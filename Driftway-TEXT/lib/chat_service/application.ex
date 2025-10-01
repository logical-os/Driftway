defmodule ChatService.Application do
  use Application

  def start(_type, _args) do
    children = [
      # Start the cluster supervisor for horizontal scaling
      {Cluster.Supervisor, [topologies(), [name: ChatService.ClusterSupervisor]]},
      
      # Start the PubSub system for real-time messaging
      {Phoenix.PubSub, name: ChatService.PubSub},
      
      # Start the endpoint (HTTP/WebSocket server)
      ChatServiceWeb.Endpoint,
      
      # Start the channel registry for tracking active channels
      {Registry, keys: :unique, name: ChatService.ChannelRegistry},
      
      # Initialize the message storage
      {Task, fn -> ChatService.Channel.start_link() end}
    ]

    opts = [strategy: :one_for_one, name: ChatService.Supervisor]
    Supervisor.start_link(children, opts)
  end

  defp topologies do
    Application.get_env(:libcluster, :topologies) || []
  end
end