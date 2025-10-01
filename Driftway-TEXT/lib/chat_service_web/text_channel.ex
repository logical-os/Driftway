defmodule ChatServiceWeb.TextChannel do
  use Phoenix.Channel
  
  alias ChatService.{Message, Channel}
  
  @impl true
  def join("text_channel:" <> channel_id, _params, socket) do
    # Register this process in the channel registry
    Registry.register(ChatService.ChannelRegistry, channel_id, socket.assigns.user_id)
    
    # Send recent messages to the newly joined user
    recent_messages = Channel.get_recent_messages(channel_id, 50)
    
    {:ok, %{messages: recent_messages}, socket}
  end

  @impl true
  def handle_in("new_message", %{"content" => content}, socket) do
    channel_id = extract_channel_id(socket)
    user_id = socket.assigns.user_id
    
    # Create and broadcast message
    message = %{
      id: generate_message_id(),
      channel_id: channel_id,
      user_id: user_id,
      content: content,
      timestamp: DateTime.utc_now()
    }
    
    # Store message (in production, use a database)
    Channel.store_message(message)
    
    # Broadcast to all users in the channel across all nodes
    broadcast!(socket, "new_message", message)
    
    {:noreply, socket}
  end

  @impl true
  def handle_in("typing", %{"user_id" => user_id}, socket) do
    broadcast_from!(socket, "user_typing", %{user_id: user_id})
    {:noreply, socket}
  end

  @impl true
  def handle_in("stop_typing", %{"user_id" => user_id}, socket) do
    broadcast_from!(socket, "user_stopped_typing", %{user_id: user_id})
    {:noreply, socket}
  end

  # Handle user leaving the channel
  @impl true
  def terminate(_reason, socket) do
    channel_id = extract_channel_id(socket)
    Registry.unregister(ChatService.ChannelRegistry, channel_id)
    :ok
  end

  defp extract_channel_id(socket) do
    socket.topic |> String.replace("text_channel:", "")
  end

  defp generate_message_id do
    :crypto.strong_rand_bytes(16) |> Base.encode64()
  end
end