cmake_minimum_required(VERSION 3.16)
project(VoiceChannels)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find required packages
find_package(PkgConfig REQUIRED)
find_package(Threads REQUIRED)

# Find Redis client
find_package(PkgConfig REQUIRED)
pkg_check_modules(HIREDIS REQUIRED hiredis)

# Find WebRTC libraries (optional)
find_package(PkgConfig REQUIRED)
pkg_check_modules(WEBRTC webrtc)

# Include directories
include_directories(${CMAKE_SOURCE_DIR}/include)
include_directories(${CMAKE_SOURCE_DIR}/third_party)

# Source files
set(SOURCES
    src/main.cpp
    src/voice_server.cpp
    src/voice_channel.cpp
    src/audio_processor.cpp
    src/webrtc_handler.cpp
    src/database_client.cpp
    src/redis_client.cpp
    src/http_server.cpp
    src/websocket_handler.cpp
    src/codec/opus_codec.cpp
    src/network/rtp_handler.cpp
    src/network/stun_handler.cpp
)

# Create executable
add_executable(voice_server ${SOURCES})

# Link libraries
target_link_libraries(voice_server
    ${CMAKE_THREAD_LIBS_INIT}
    ${HIREDIS_LIBRARIES}
    ${WEBRTC_LIBRARIES}
    pthread
    ssl
    crypto
    opus
    uv
    boost_system
    boost_thread
    curl
)

# Compiler flags
target_compile_options(voice_server PRIVATE
    -Wall
    -Wextra
    -Wpedantic
    -O3
    -march=native
    -DWEBRTC_POSIX
    -DWEBRTC_LINUX
)

# Include directories for libraries
target_include_directories(voice_server PRIVATE
    ${HIREDIS_INCLUDE_DIRS}
    ${WEBRTC_INCLUDE_DIRS}
    /usr/include/opus
    /usr/include/nlohmann
)

# Install target
install(TARGETS voice_server DESTINATION bin)