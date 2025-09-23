defmodule TextChannelsWeb.HealthController do
  use TextChannelsWeb, :controller

  def health(conn, _params) do
    json(conn, %{
      status: "healthy",
      service: "text-channels",
      timestamp: DateTime.utc_now(),
      database: check_database(),
      redis: check_redis()
    })
  end

  defp check_database do
    try do
      TextChannels.Repo.query!("db.runCommand({ping: 1})")
      "connected"
    rescue
      _ -> "disconnected"
    end
  end

  defp check_redis do
    try do
      Redix.command!(:redix, ["PING"])
      "connected"
    rescue
      _ -> "disconnected"
    end
  end
end