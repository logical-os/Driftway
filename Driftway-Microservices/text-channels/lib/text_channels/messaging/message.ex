defmodule TextChannels.Messaging.Message do
  @moduledoc """
  Message schema for MongoDB
  """

  @type t :: %__MODULE__{
    id: binary() | nil,
    content: String.t() | nil,
    encrypted_content: String.t() | nil,
    channel_id: binary(),
    user_id: binary(),
    username: String.t(),
    message_type: String.t(),
    status: String.t(),
    edited: boolean(),
    reply_to: binary() | nil,
    reactions: [map()],
    attachments: [map()],
    inserted_at: DateTime.t() | nil,
    updated_at: DateTime.t() | nil
  }

  defstruct [
    :id,
    :content,
    :encrypted_content,
    :channel_id,
    :user_id,
    :username,
    :message_type,
    :status,
    :edited,
    :reply_to,
    :reactions,
    :attachments,
    :inserted_at,
    :updated_at
  ]

  def new(attrs \\ %{}) do
    now = DateTime.utc_now()
    
    %__MODULE__{
      id: attrs[:id] || BSON.ObjectId.new(),
      content: attrs[:content],
      encrypted_content: attrs[:encrypted_content],
      channel_id: attrs[:channel_id],
      user_id: attrs[:user_id],
      username: attrs[:username],
      message_type: attrs[:message_type] || "text",
      status: attrs[:status] || "sent",
      edited: attrs[:edited] || false,
      reply_to: attrs[:reply_to],
      reactions: attrs[:reactions] || [],
      attachments: attrs[:attachments] || [],
      inserted_at: attrs[:inserted_at] || now,
      updated_at: attrs[:updated_at] || now
    }
  end

  def validate(attrs) do
    errors = []
    
    errors = if is_nil(attrs[:channel_id]) do
      ["channel_id is required" | errors]
    else
      errors
    end
    
    errors = if is_nil(attrs[:user_id]) do
      ["user_id is required" | errors]
    else
      errors
    end
    
    errors = if is_nil(attrs[:username]) or String.trim(attrs[:username]) == "" do
      ["username is required" | errors]
    else
      errors
    end
    
    errors = if attrs[:content] && String.length(attrs[:content]) > 2000 do
      ["content must be 2000 characters or less" | errors]
    else
      errors
    end
    
    errors = if attrs[:message_type] && attrs[:message_type] not in ["text", "image", "file", "system"] do
      ["message_type must be text, image, file, or system" | errors]
    else
      errors
    end
    
    errors = if attrs[:status] && attrs[:status] not in ["sent", "delivered", "read", "failed"] do
      ["status must be sent, delivered, read, or failed" | errors]
    else
      errors
    end
    
    if errors == [] do
      {:ok, attrs}
    else
      {:error, errors}
    end
  end
end