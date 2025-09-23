defmodule TextChannels.Messaging.Channel do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  schema "channels" do
    field :name, :string
    field :server_id, :binary_id
    field :channel_type, :string, default: "text"
    field :topic, :string
    field :private, :boolean, default: false
    field :members, {:array, :binary_id}, default: []
    field :permissions, :map, default: %{}

    timestamps()
  end

  def changeset(channel, attrs) do
    channel
    |> cast(attrs, [:name, :server_id, :channel_type, :topic, :private, :members, :permissions])
    |> validate_required([:name, :server_id])
    |> validate_length(:name, min: 1, max: 100)
    |> validate_inclusion(:channel_type, ["text", "voice", "announcement"])
  end
end