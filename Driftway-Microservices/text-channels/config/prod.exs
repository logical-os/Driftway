import Config

# For production, don't forget to configure the url host
# to something meaningful, Phoenix uses this information
# when generating URLs.

config :text_channels, TextChannelsWeb.Endpoint,
  url: [host: "example.com", port: 443, scheme: "https"],
  http: [
    # Enable IPv6 and bind on all interfaces.
    # Set it to {0, 0, 0, 0, 0, 0, 0, 1} for local network only access.
    ip: {0, 0, 0, 0, 0, 0, 0, 0},
    port: String.to_integer(System.get_env("PHOENIX_PORT") || "4000")
  ],
  secret_key_base: {:system, "PHOENIX_SECRET_KEY_BASE"},
  server: true

# Configures Swoosh API Client
config :swoosh, api_client: Swoosh.ApiClient.Finch, finch_name: TextChannels.Finch

# Runtime production config, including reading
# of environment variables, is done on config/runtime.exs.

# Do not print debug messages in production
config :logger, level: :info

# Database configuration
config :text_channels, TextChannels.Repo,
  database: {:system, "DATABASE_URL"}

# Redis configuration
config :text_channels, :redis,
  url: {:system, "REDIS_URL"}

# JWT configuration  
config :joken,
  default_signer: [
    signer_alg: "HS256", 
    key_octet: {:system, "SECRET_KEY_BASE"}
  ]