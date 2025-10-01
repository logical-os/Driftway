import Config

# For production, configure the endpoint with proper security
config :chat_service, ChatServiceWeb.Endpoint,
  url: [host: System.get_env("HOST") || "localhost", port: 80],
  http: [
    ip: {0, 0, 0, 0, 0, 0, 0, 0},
    port: String.to_integer(System.get_env("PORT") || "4000")
  ],
  secret_key_base: System.fetch_env!("SECRET_KEY_BASE"),
  check_origin: [
    "//localhost",
    "//*.yourdomain.com"
  ]

# Configure session with secure settings
config :chat_service, ChatServiceWeb.Endpoint,
  session: [
    store: :cookie,
    key: "_chat_service_key",
    signing_salt: System.fetch_env!("SIGNING_SALT"),
    same_site: "Lax"
  ]

# Configure clustering for production with DNS-based discovery
config :libcluster,
  topologies: [
    chat_cluster: [
      strategy: Cluster.Strategy.Kubernetes.DNS,
      config: [
        service: "chat-service",
        application_name: "chat_service"
      ]
    ]
  ]

# Do not print debug messages in production
config :logger, level: :info

# Runtime production config (if using releases)
if System.get_env("PHX_SERVER") do
  config :chat_service, ChatServiceWeb.Endpoint, server: true
end