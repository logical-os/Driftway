defmodule TextChannels.Messaging.Message do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  schema "messages" do
    field :content, :string
    field :encrypted_content, :string
    field :channel_id, :binary_id
    field :user_id, :binary_id
    field :username, :string
    field :message_type, :string, default: "text"
    field :status, :string, default: "sent"
    field :edited, :boolean, default: false
    field :reply_to, :binary_id
    field :reactions, {:array, :map}, default: []
    field :attachments, {:array, :map}, default: []

    timestamps()
  end

  def changeset(message, attrs) do
    message
    |> cast(attrs, [:content, :encrypted_content, :channel_id, :user_id, :username, 
                    :message_type, :status, :edited, :reply_to, :reactions, :attachments])
    |> validate_required([:channel_id, :user_id, :username])
    |> validate_length(:content, max: 2000)
    |> validate_inclusion(:message_type, ["text", "image", "file", "system"])
    |> validate_inclusion(:status, ["sent", "delivered", "read", "failed"])
  end
end