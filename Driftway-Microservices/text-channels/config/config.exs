import Config

# Configure your database
config :text_channels, TextChannels.Repo,
  adapter: Mongo.Ecto,
  database: "driftway",
  hostname: "localhost",
  port: 27017

# Configures the endpoint
config :text_channels, TextChannelsWeb.Endpoint,
  url: [host: "localhost"],
  render_errors: [
    formats: [json: TextChannelsWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: TextChannels.PubSub,
  live_view: [signing_salt: "your-signing-salt"]

# Configures the mailer
config :text_channels, TextChannels.Mailer,
  adapter: Swoosh.Adapters.Local

# Configure esbuild (the version is required)
config :esbuild,
  version: "0.17.11",
  default: [
    args:
      ~w(js/app.js --bundle --target=es2017 --outdir=../priv/static/assets --external:/fonts/* --external:/images/*),
    cd: Path.expand("../assets", __DIR__),
    env: %{"NODE_PATH" => Path.expand("../deps", __DIR__)}
  ]

# Configure tailwind (the version is required)
config :tailwind,
  version: "3.3.0",
  default: [
    args: ~w(
      --config=tailwind.config.js
      --input=css/app.css
      --output=../priv/static/assets/app.css
    ),
    cd: Path.expand("../assets", __DIR__)
  ]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# Redis configuration
config :text_channels, :redis,
  url: {:system, "REDIS_URL", "redis://localhost:6379"}

# JWT configuration
config :joken, 
  default_signer: [
    signer_alg: "HS256",
    key_octet: {:system, "JWT_SECRET", "default-secret"}
  ]

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{config_env()}.exs"