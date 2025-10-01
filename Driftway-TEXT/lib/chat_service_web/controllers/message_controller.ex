defmodule ChatServiceWeb.MessageController do
  use Phoenix.Controller
  
  alias ChatService.Channel
  
  def index(conn, %{"id" => channel_id}) do
    limit = Map.get(conn.params, "limit", "50") |> String.to_integer()
    messages = Channel.get_recent_messages(channel_id, limit)
    
    json(conn, %{messages: messages})
  end
end