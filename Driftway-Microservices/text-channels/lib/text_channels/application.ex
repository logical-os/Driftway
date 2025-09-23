defmodule TextChannels.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      TextChannelsWeb.Telemetry,
      TextChannels.Repo,
      {Phoenix.PubSub, name: TextChannels.PubSub},
      # Start the Finch HTTP client for sending emails
      {Finch, name: TextChannels.Finch},
      # Start Redis connection
      {Redix, {System.get_env("REDIS_URL", "redis://redis:6379"), [name: :redix]}},
      # Start a worker by calling: TextChannels.Worker.start_link(arg)
      # {TextChannels.Worker, arg},
      # Start to serve requests, typically the last entry
      TextChannelsWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: TextChannels.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    TextChannelsWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end