defmodule TextChannels.Repo do
  use Ecto.Repo,
    otp_app: :text_channels,
    adapter: Mongo.Ecto
end