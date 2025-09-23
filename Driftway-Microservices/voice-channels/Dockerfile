# Build stage
FROM ubuntu:22.04 AS build

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    pkg-config \
    libssl-dev \
    libboost-all-dev \
    libopus-dev \
    libuv1-dev \
    nlohmann-json3-dev \
    libhiredis-dev \
    libcurl4-openssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy source code
COPY . .

# Create build directory and compile
RUN mkdir build && cd build && \
    cmake .. && \
    make -j$(nproc)

# Runtime stage
FROM ubuntu:22.04 AS runtime

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libssl3 \
    libboost-system1.74.0 \
    libboost-thread1.74.0 \
    libopus0 \
    libuv1 \
    libhiredis0.14 \
    libcurl4 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy executable from build stage
COPY --from=build /app/build/voice_server .

# Create non-root user
RUN groupadd -r voice || true && \
    useradd -r -g voice -s /bin/false voiceuser && \
    chown voiceuser:voice /app/voice_server

USER voiceuser

# Expose ports
EXPOSE 9090 3478/udp

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:9090/health || exit 1

CMD ["./voice_server"]