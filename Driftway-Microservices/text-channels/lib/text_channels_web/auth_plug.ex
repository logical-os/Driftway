defmodule TextChannelsWeb.AuthPlug do
  import Plug.Conn
  import Phoenix.Controller, only: [json: 2]

  def init(opts), do: opts

  def call(conn, _opts) do
    # Skip auth for health check
    if conn.request_path == "/health" do
      conn
    else
      case get_req_header(conn, "x-user-id") do
        [user_id] when user_id != "" ->
          # User ID is passed from API Gateway after JWT validation
          assign(conn, :current_user_id, user_id)
        
        _ ->
          conn
          |> put_status(:unauthorized)
          |> json(%{error: "Unauthorized"})
          |> halt()
      end
    end
  end
end