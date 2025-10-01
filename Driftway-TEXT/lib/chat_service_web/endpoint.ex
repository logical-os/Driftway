defmodule ChatServiceWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :chat_service

  # WebSocket configuration for real-time chat
  socket "/socket", ChatServiceWeb.UserSocket,
    websocket: true,
    longpoll: false

  # HTTP request pipeline
  plug Plug.RequestId
  plug Plug.Telemetry, event_prefix: [:phoenix, :endpoint]

  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library()

  plug Plug.MethodOverride
  plug Plug.Head

  # Simple router for health checks and basic endpoints
  plug ChatServiceWeb.Router
end