# Multi-stage Dockerfile for Elixir Chat Service
# Stage 1: Build environment
FROM elixir:1.18.4-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    build-base \
    git \
    nodejs \
    npm

# Set environment variables
ENV MIX_ENV=prod

# Create app directory
WORKDIR /app

# Install hex and rebar
RUN mix local.hex --force && \
    mix local.rebar --force

# Copy mix files
COPY mix.exs mix.lock ./

# Install dependencies
RUN mix deps.get --only prod
RUN mix deps.compile

# Copy application code
COPY . .

# Compile the application
RUN mix compile

# Build release
RUN mix release

# Stage 2: Runtime environment
FROM alpine:3.19 AS runtime

# Install runtime dependencies
RUN apk add --no-cache \
    openssl \
    ncurses-libs \
    libstdc++ \
    libgcc

# Create app user
RUN addgroup -g 1000 -S app && \
    adduser -u 1000 -S app -G app

# Create app directory
WORKDIR /app

# Copy the release from builder stage
COPY --from=builder --chown=app:app /app/_build/prod/rel/chat_service ./

# Switch to app user
USER app

# Expose ports
EXPOSE 4000
EXPOSE 4369
EXPOSE 9001-9005

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

# Set environment variables
ENV PHX_SERVER=true
ENV PORT=4000
ENV MIX_ENV=prod

# Start the application
CMD ["./bin/chat_service", "start"]