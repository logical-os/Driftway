defmodule TextChannels.Messaging do
  @moduledoc """
  The Messaging context.
  """

  import Ecto.Query, warn: false
  alias TextChannels.Repo

  alias TextChannels.Messaging.{Message, Channel}

  # Messages

  def list_messages(channel_id, limit \\ 50, before \\ nil) do
    query = from m in Message,
      where: m.channel_id == ^channel_id,
      order_by: [desc: m.inserted_at],
      limit: ^limit

    query = if before do
      from m in query, where: m.inserted_at < ^before
    else
      query
    end

    Repo.all(query)
    |> Enum.reverse()
  end

  def get_message!(id), do: Repo.get!(Message, id)

  def create_message(attrs \\ %{}) do
    %Message{}
    |> Message.changeset(attrs)
    |> Repo.insert()
    |> case do
      {:ok, message} ->
        # Broadcast message to channel subscribers
        Phoenix.PubSub.broadcast(
          TextChannels.PubSub,
          "channel:#{message.channel_id}",
          {:new_message, message}
        )
        {:ok, message}
      
      error -> error
    end
  end

  def update_message(%Message{} = message, attrs) do
    message
    |> Message.changeset(Map.put(attrs, :edited, true))
    |> Repo.update()
    |> case do
      {:ok, updated_message} ->
        # Broadcast message update
        Phoenix.PubSub.broadcast(
          TextChannels.PubSub,
          "channel:#{updated_message.channel_id}",
          {:message_updated, updated_message}
        )
        {:ok, updated_message}
      
      error -> error
    end
  end

  def delete_message(%Message{} = message) do
    Repo.delete(message)
    |> case do
      {:ok, deleted_message} ->
        # Broadcast message deletion
        Phoenix.PubSub.broadcast(
          TextChannels.PubSub,
          "channel:#{deleted_message.channel_id}",
          {:message_deleted, deleted_message.id}
        )
        {:ok, deleted_message}
      
      error -> error
    end
  end

  def add_reaction(message_id, user_id, emoji) do
    message = get_message!(message_id)
    
    # Check if user already reacted with this emoji
    existing_reaction = Enum.find(message.reactions, fn reaction ->
      reaction["emoji"] == emoji && reaction["user_id"] == user_id
    end)

    if existing_reaction do
      {:error, "User already reacted with this emoji"}
    else
      reaction = %{
        "emoji" => emoji,
        "user_id" => user_id,
        "timestamp" => DateTime.utc_now()
      }
      
      updated_reactions = [reaction | message.reactions]
      
      update_message(message, %{reactions: updated_reactions})
    end
  end

  def remove_reaction(message_id, user_id, emoji) do
    message = get_message!(message_id)
    
    updated_reactions = Enum.reject(message.reactions, fn reaction ->
      reaction["emoji"] == emoji && reaction["user_id"] == user_id
    end)
    
    update_message(message, %{reactions: updated_reactions})
  end

  # Channels

  def list_channels(server_id) do
    Repo.all(from c in Channel, where: c.server_id == ^server_id)
  end

  def get_channel!(id), do: Repo.get!(Channel, id)

  def create_channel(attrs \\ %{}) do
    %Channel{}
    |> Channel.changeset(attrs)
    |> Repo.insert()
  end

  def update_channel(%Channel{} = channel, attrs) do
    channel
    |> Channel.changeset(attrs)
    |> Repo.update()
  end

  def delete_channel(%Channel{} = channel) do
    Repo.delete(channel)
  end

  def join_channel(channel_id, user_id) do
    channel = get_channel!(channel_id)
    
    if user_id in channel.members do
      {:ok, channel}
    else
      updated_members = [user_id | channel.members]
      update_channel(channel, %{members: updated_members})
    end
  end

  def leave_channel(channel_id, user_id) do
    channel = get_channel!(channel_id)
    updated_members = List.delete(channel.members, user_id)
    update_channel(channel, %{members: updated_members})
  end

  # Real-time presence tracking
  def track_user_presence(channel_id, user_id, user_info) do
    # Use Phoenix Presence to track users in channels
    TextChannelsWeb.Presence.track(
      self(),
      "channel:#{channel_id}",
      user_id,
      user_info
    )
  end

  def list_channel_users(channel_id) do
    TextChannelsWeb.Presence.list("channel:#{channel_id}")
  end
end