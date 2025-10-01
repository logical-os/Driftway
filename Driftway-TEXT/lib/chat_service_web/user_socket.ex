defmodule ChatServiceWeb.UserSocket do
  use Phoenix.Socket

  # Channel routes for text channels
  channel "text_channel:*", ChatServiceWeb.TextChannel

  # Authentication and connection handling
  @impl true
  def connect(%{"token" => token}, socket, _connect_info) do
    # In production, verify the token here
    case verify_token(token) do
      {:ok, user_id} ->
        socket = assign(socket, :user_id, user_id)
        {:ok, socket}
      {:error, _reason} ->
        :error
    end
  end

  def connect(_params, socket, _connect_info) do
    # For development, allow connections without authentication
    socket = assign(socket, :user_id, "anonymous_#{:rand.uniform(10000)}")
    {:ok, socket}
  end

  @impl true
  def id(socket), do: "user_socket:#{socket.assigns.user_id}"

  # Simple token verification (replace with proper auth in production)
  defp verify_token(_token) do
    {:ok, "user_#{:rand.uniform(1000)}"}
  end
end