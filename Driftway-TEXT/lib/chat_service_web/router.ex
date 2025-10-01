defmodule ChatServiceWeb.Router do
  use Phoenix.Router
  
  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/api", ChatServiceWeb do
    pipe_through :api

    get "/health", HealthController, :check
    get "/metrics", TelemetryController, :metrics
    get "/channels", ChannelController, :index
    post "/channels", ChannelController, :create
    get "/channels/:id/messages", MessageController, :index
  end
end