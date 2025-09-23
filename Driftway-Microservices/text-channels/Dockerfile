# Build stage
FROM elixir:1.15-alpine AS build

# Install build dependencies
RUN apk add --no-cache build-base npm git python3

WORKDIR /app

# Install hex + rebar
RUN mix local.hex --force && \
    mix local.rebar --force

# Set build ENV
ENV MIX_ENV=prod

# Install mix dependencies
COPY mix.exs mix.lock ./
RUN mix deps.get --only prod
RUN mkdir config

# Copy compile-time config files before we compile dependencies
# to ensure any relevant config change will trigger the dependencies
# to be re-compiled.
COPY config/config.exs config/prod.exs config/
RUN mix deps.compile

# Compile the release
COPY priv priv
COPY lib lib
RUN mix compile

# Build assets
COPY assets/package.json ./assets/
RUN npm --prefix ./assets install --progress=false --no-audit --loglevel=error

COPY assets assets
RUN npm run --prefix ./assets deploy
RUN mix phx.digest

# Build release
RUN mix release

# Runtime stage
FROM alpine:3.18 AS app

RUN apk add --no-cache openssl ncurses-libs libstdc++

WORKDIR /app

# Create app user
RUN adduser -D -s /bin/sh app
USER app

# Copy release from build stage
COPY --from=build --chown=app:app /app/_build/prod/rel/text_channels ./

# Expose port
EXPOSE 4000

CMD ["./bin/text_channels", "start"]