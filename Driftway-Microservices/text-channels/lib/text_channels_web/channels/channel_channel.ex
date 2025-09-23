defmodule TextChannelsWeb.ChannelChannel do
  use TextChannelsWeb, :channel
  alias TextChannels.Messaging

  @impl true
  def join("channel:" <> channel_id, _payload, socket) do
    # Check if user has permission to join this channel
    user_id = socket.assigns.user_id
    
    try do
      channel = Messaging.get_channel!(channel_id)
      
      # For now, allow all authenticated users to join
      # In production, check channel permissions
      
      # Track user presence
      send(self(), :after_join)
      
      {:ok, assign(socket, :channel_id, channel_id)}
    rescue
      Ecto.NoResultsError ->
        {:error, %{reason: "Channel not found"}}
    end
  end

  @impl true
  def handle_info(:after_join, socket) do
    user_id = socket.assigns.user_id
    channel_id = socket.assigns.channel_id
    
    # Track user presence in channel
    Messaging.track_user_presence(channel_id, user_id, %{
      online_at: inspect(System.system_time(:second))
    })
    
    # Send current user list to the new user
    users = Messaging.list_channel_users(channel_id)
    push(socket, "presence_state", users)
    
    {:noreply, socket}
  end

  # Handle incoming messages
  @impl true
  def handle_in("new_message", %{"content" => content} = payload, socket) do
    user_id = socket.assigns.user_id
    channel_id = socket.assigns.channel_id
    
    attrs = %{
      content: content,
      channel_id: channel_id,
      user_id: user_id,
      username: Map.get(payload, "username", user_id),
      message_type: Map.get(payload, "message_type", "text")
    }
    
    case Messaging.create_message(attrs) do
      {:ok, message} ->
        # Message is automatically broadcast via PubSub in the context
        {:reply, {:ok, %{message: message}}, socket}
      
      {:error, changeset} ->
        {:reply, {:error, %{errors: format_errors(changeset)}}, socket}
    end
  end

  # Handle message reactions
  def handle_in("add_reaction", %{"message_id" => message_id, "emoji" => emoji}, socket) do
    user_id = socket.assigns.user_id
    
    case Messaging.add_reaction(message_id, user_id, emoji) do
      {:ok, message} ->
        {:reply, {:ok, %{message: message}}, socket}
      
      {:error, reason} ->
        {:reply, {:error, %{error: reason}}, socket}
    end
  end

  def handle_in("remove_reaction", %{"message_id" => message_id, "emoji" => emoji}, socket) do
    user_id = socket.assigns.user_id
    
    case Messaging.remove_reaction(message_id, user_id, emoji) do
      {:ok, message} ->
        {:reply, {:ok, %{message: message}}, socket}
      
      {:error, changeset} ->
        {:reply, {:error, %{errors: format_errors(changeset)}}, socket}
    end
  end

  # Handle typing indicators
  def handle_in("typing_start", _payload, socket) do
    user_id = socket.assigns.user_id
    channel_id = socket.assigns.channel_id
    
    broadcast_from!(socket, "typing_start", %{user_id: user_id})
    
    # Set a timer to automatically stop typing after 5 seconds
    Process.send_after(self(), {:typing_stop, user_id}, 5000)
    
    {:noreply, socket}
  end

  def handle_in("typing_stop", _payload, socket) do
    user_id = socket.assigns.user_id
    
    broadcast_from!(socket, "typing_stop", %{user_id: user_id})
    
    {:noreply, socket}
  end

  # Handle typing timeout
  @impl true
  def handle_info({:typing_stop, user_id}, socket) do
    broadcast_from!(socket, "typing_stop", %{user_id: user_id})
    {:noreply, socket}
  end

  # Listen for PubSub messages and broadcast to channel subscribers
  def handle_info({:new_message, message}, socket) do
    push(socket, "new_message", %{message: message})
    {:noreply, socket}
  end

  def handle_info({:message_updated, message}, socket) do
    push(socket, "message_updated", %{message: message})
    {:noreply, socket}
  end

  def handle_info({:message_deleted, message_id}, socket) do
    push(socket, "message_deleted", %{message_id: message_id})
    {:noreply, socket}
  end

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end
end