defmodule TextChannelsWeb.UserSocket do
  use Phoenix.Socket

  # A Socket handler
  channel "channel:*", TextChannelsWeb.ChannelChannel

  @impl true
  def connect(%{"token" => token}, socket, _connect_info) do
    # Here you would validate the JWT token
    # For now, we'll extract user_id from token payload
    case verify_token(token) do
      {:ok, user_id} ->
        {:ok, assign(socket, :user_id, user_id)}
      
      {:error, _reason} ->
        :error
    end
  end

  def connect(_params, _socket, _connect_info), do: :error

  @impl true
  def id(socket), do: "user_socket:#{socket.assigns.user_id}"

  defp verify_token(token) do
    # Simple token verification - in production, use proper JWT validation
    # This should match the JWT secret from the API gateway
    case String.split(token, ".") do
      [_header, payload, _signature] ->
        try do
          decoded = Base.decode64!(payload <> String.duplicate("=", rem(4 - rem(byte_size(payload), 4), 4)))
          %{"user_id" => user_id} = Jason.decode!(decoded)
          {:ok, user_id}
        rescue
          _ -> {:error, "Invalid token"}
        end
      
      _ ->
        {:error, "Invalid token format"}
    end
  end
end