defmodule TextChannels.Messaging.Channel do
  @moduledoc """
  Channel schema for MongoDB
  """

  @type t :: %__MODULE__{
    id: binary() | nil,
    name: String.t(),
    server_id: binary(),
    channel_type: String.t(),
    topic: String.t() | nil,
    private: boolean(),
    members: [binary()],
    permissions: map(),
    inserted_at: DateTime.t() | nil,
    updated_at: DateTime.t() | nil
  }

  defstruct [
    :id,
    :name,
    :server_id,
    :channel_type,
    :topic,
    :private,
    :members,
    :permissions,
    :inserted_at,
    :updated_at
  ]

  def new(attrs \\ %{}) do
    now = DateTime.utc_now()
    
    %__MODULE__{
      id: attrs[:id] || BSON.ObjectId.new(),
      name: attrs[:name],
      server_id: attrs[:server_id],
      channel_type: attrs[:channel_type] || "text",
      topic: attrs[:topic],
      private: attrs[:private] || false,
      members: attrs[:members] || [],
      permissions: attrs[:permissions] || %{},
      inserted_at: attrs[:inserted_at] || now,
      updated_at: attrs[:updated_at] || now
    }
  end

  def validate(attrs) do
    errors = []
    
    errors = if is_nil(attrs[:name]) or String.trim(attrs[:name]) == "" do
      ["name is required" | errors]
    else
      errors
    end
    
    errors = if is_nil(attrs[:server_id]) do
      ["server_id is required" | errors]
    else
      errors
    end
    
    errors = if attrs[:name] && String.length(String.trim(attrs[:name])) > 100 do
      ["name must be 100 characters or less" | errors]
    else
      errors
    end
    
    errors = if attrs[:channel_type] && attrs[:channel_type] not in ["text", "voice", "announcement"] do
      ["channel_type must be text, voice, or announcement" | errors]
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