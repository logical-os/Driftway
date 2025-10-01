import Config

# Configure the endpoint
config :chat_service, ChatServiceWeb.Endpoint,
  url: [host: "localhost"],
  render_errors: [
    formats: [json: ChatServiceWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: ChatService.PubSub,
  live_view: [signing_salt: "your_signing_salt_here"]

# Configure PubSub for distributed messaging
config :chat_service, ChatService.PubSub,
  name: ChatService.PubSub,
  adapter: Phoenix.PubSub.PG2

# Configure clustering for horizontal scaling
config :libcluster,
  topologies: [
    chat_cluster: [
      strategy: Cluster.Strategy.Epmd,
      config: [
        hosts: [:"chat1@127.0.0.1", :"chat2@127.0.0.1", :"chat3@127.0.0.1"]
      ]
    ]
  ]

# Configure JSON library
config :phoenix, :json_library, Jason

# Configure logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Import environment specific config
import_config "#{config_env()}.exs"