defmodule TextChannels.Messaging do
  @moduledoc """
  The Messaging context.
  """

  alias TextChannels.Repo
  alias TextChannels.Messaging.{Message, Channel}

  # Messages

  def list_messages(channel_id, limit \\ 50, before \\ nil) do
    filter = %{"channel_id" => channel_id}
    
    filter = if before do
      Map.put(filter, "inserted_at", %{"$lt" => before})
    else
      filter
    end

    cursor = Repo.find("messages", filter, sort: %{"inserted_at" => -1}, limit: limit)
    
    cursor
    |> Enum.to_list()
    |> Enum.reverse()
    |> Enum.map(&document_to_message/1)
  end

  def get_message!(id) do
    case Repo.find("messages", %{"_id" => id}) |> Enum.take(1) do
      [doc] -> document_to_message(doc)
      [] -> raise "Message not found"
    end
  end

  def create_message(attrs \\ %{}) do
    case Message.validate(attrs) do
      {:ok, validated_attrs} ->
        message = Message.new(validated_attrs)
        doc = message_to_document(message)
        
        case Repo.insert_one("messages", doc) do
          {:ok, %{inserted_id: id}} ->
            message = %{message | id: id}
            
            # Broadcast message to channel subscribers
            Phoenix.PubSub.broadcast(
              TextChannels.PubSub,
              "channel:#{message.channel_id}",
              {:new_message, message}
            )
            {:ok, message}
          
          error -> error
        end
      
      {:error, errors} -> {:error, errors}
    end
  end

  def update_message(%Message{} = message, attrs) do
    updated_attrs = Map.merge(Map.from_struct(message), attrs)
    updated_attrs = Map.put(updated_attrs, :edited, true)
    updated_attrs = Map.put(updated_attrs, :updated_at, DateTime.utc_now())
    
    case Message.validate(updated_attrs) do
      {:ok, validated_attrs} ->
        updated_message = struct(Message, validated_attrs)
        doc = message_to_document(updated_message)
        
        case Repo.update_one("messages", %{"_id" => message.id}, %{"$set" => doc}) do
          {:ok, _} ->
            # Broadcast message update
            Phoenix.PubSub.broadcast(
              TextChannels.PubSub,
              "channel:#{updated_message.channel_id}",
              {:message_updated, updated_message}
            )
            {:ok, updated_message}
          
          error -> error
        end
      
      {:error, errors} -> {:error, errors}
    end
  end

  def delete_message(%Message{} = message) do
    case Repo.delete_one("messages", %{"_id" => message.id}) do
      {:ok, _} ->
        # Broadcast message deletion
        Phoenix.PubSub.broadcast(
          TextChannels.PubSub,
          "channel:#{message.channel_id}",
          {:message_deleted, message.id}
        )
        {:ok, message}
      
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
    cursor = Repo.find("channels", %{"server_id" => server_id})
    
    cursor
    |> Enum.to_list()
    |> Enum.map(&document_to_channel/1)
  end

  def get_channel!(id) do
    case Repo.find("channels", %{"_id" => id}) |> Enum.take(1) do
      [doc] -> document_to_channel(doc)
      [] -> raise "Channel not found"
    end
  end

  def create_channel(attrs \\ %{}) do
    case Channel.validate(attrs) do
      {:ok, validated_attrs} ->
        channel = Channel.new(validated_attrs)
        doc = channel_to_document(channel)
        
        case Repo.insert_one("channels", doc) do
          {:ok, %{inserted_id: id}} ->
            {:ok, %{channel | id: id}}
          
          error -> error
        end
      
      {:error, errors} -> {:error, errors}
    end
  end

  def update_channel(%Channel{} = channel, attrs) do
    updated_attrs = Map.merge(Map.from_struct(channel), attrs)
    updated_attrs = Map.put(updated_attrs, :updated_at, DateTime.utc_now())
    
    case Channel.validate(updated_attrs) do
      {:ok, validated_attrs} ->
        updated_channel = struct(Channel, validated_attrs)
        doc = channel_to_document(updated_channel)
        
        case Repo.update_one("channels", %{"_id" => channel.id}, %{"$set" => doc}) do
          {:ok, _} -> {:ok, updated_channel}
          error -> error
        end
      
      {:error, errors} -> {:error, errors}
    end
  end

  def delete_channel(%Channel{} = channel) do
    case Repo.delete_one("channels", %{"_id" => channel.id}) do
      {:ok, _} -> {:ok, channel}
      error -> error
    end
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

  # Private helper functions

  defp message_to_document(message) do
    %{
      "_id" => message.id,
      "content" => message.content,
      "encrypted_content" => message.encrypted_content,
      "channel_id" => message.channel_id,
      "user_id" => message.user_id,
      "username" => message.username,
      "message_type" => message.message_type,
      "status" => message.status,
      "edited" => message.edited,
      "reply_to" => message.reply_to,
      "reactions" => message.reactions,
      "attachments" => message.attachments,
      "inserted_at" => message.inserted_at,
      "updated_at" => message.updated_at
    }
  end

  defp document_to_message(doc) do
    %Message{
      id: doc["_id"],
      content: doc["content"],
      encrypted_content: doc["encrypted_content"],
      channel_id: doc["channel_id"],
      user_id: doc["user_id"],
      username: doc["username"],
      message_type: doc["message_type"],
      status: doc["status"],
      edited: doc["edited"],
      reply_to: doc["reply_to"],
      reactions: doc["reactions"] || [],
      attachments: doc["attachments"] || [],
      inserted_at: doc["inserted_at"],
      updated_at: doc["updated_at"]
    }
  end

  defp channel_to_document(channel) do
    %{
      "_id" => channel.id,
      "name" => channel.name,
      "server_id" => channel.server_id,
      "channel_type" => channel.channel_type,
      "topic" => channel.topic,
      "private" => channel.private,
      "members" => channel.members,
      "permissions" => channel.permissions,
      "inserted_at" => channel.inserted_at,
      "updated_at" => channel.updated_at
    }
  end

  defp document_to_channel(doc) do
    %Channel{
      id: doc["_id"],
      name: doc["name"],
      server_id: doc["server_id"],
      channel_type: doc["channel_type"],
      topic: doc["topic"],
      private: doc["private"],
      members: doc["members"] || [],
      permissions: doc["permissions"] || %{},
      inserted_at: doc["inserted_at"],
      updated_at: doc["updated_at"]
    }
  end
end