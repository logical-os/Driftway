import Config

# Configure the endpoint for development
config :chat_service, ChatServiceWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4000],
  check_origin: false,
  code_reloader: true,
  debug_errors: true,
  secret_key_base: "development_secret_key_base_replace_in_production",
  watchers: []

# Configure session
config :chat_service, ChatServiceWeb.Endpoint,
  session: [
    store: :cookie,
    key: "_chat_service_key",
    signing_salt: "development_signing_salt"
  ]

# Do not include metadata nor timestamps in development logs
config :logger, :console, format: "[$level] $message\n"

# Initialize plugs at runtime for faster development compilation
config :phoenix, :plug_init_mode, :runtime