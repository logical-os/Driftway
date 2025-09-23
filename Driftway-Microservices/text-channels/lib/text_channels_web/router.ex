defmodule TextChannelsWeb.Router do
  use TextChannelsWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
    plug TextChannelsWeb.AuthPlug
  end

  scope "/", TextChannelsWeb do
    pipe_through :api

    # Health check
    get "/health", HealthController, :health

    # Channels
    get "/channels", ChannelController, :index
    post "/channels", ChannelController, :create
    get "/channels/:id", ChannelController, :show
    put "/channels/:id", ChannelController, :update
    delete "/channels/:id", ChannelController, :delete
    post "/channels/:id/join", ChannelController, :join
    post "/channels/:id/leave", ChannelController, :leave

    # Messages
    get "/channels/:channel_id/messages", MessageController, :index
    post "/channels/:channel_id/messages", MessageController, :create
    put "/messages/:id", MessageController, :update
    delete "/messages/:id", MessageController, :delete
    
    # Message reactions
    post "/messages/:id/reactions", MessageController, :add_reaction
    delete "/messages/:id/reactions", MessageController, :remove_reaction

    # Presence
    get "/channels/:id/users", PresenceController, :list_users
  end

  # Enable LiveDashboard in development
  if Application.compile_env(:text_channels, :dev_routes) do
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through [:fetch_session, :protect_from_forgery]

      live_dashboard "/dashboard", metrics: TextChannelsWeb.Telemetry
    end
  end
end