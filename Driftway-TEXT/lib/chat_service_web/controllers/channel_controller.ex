defmodule ChatServiceWeb.ChannelController do
  use Phoenix.Controller
  
  alias ChatService.Channel
  
  def index(conn, _params) do
    # In production, fetch from database
    channels = [
      %{id: "general", name: "General", description: "General discussion"},
      %{id: "random", name: "Random", description: "Random chat"},
      %{id: "tech", name: "Tech Talk", description: "Technology discussions"}
    ]
    
    json(conn, %{channels: channels})
  end
  
  def create(conn, %{"name" => name, "description" => description}) do
    channel_id = :crypto.strong_rand_bytes(8) |> Base.encode16(case: :lower)
    
    channel = %{
      id: channel_id,
      name: name,
      description: description,
      created_at: DateTime.utc_now()
    }
    
    json(conn, %{channel: channel})
  end
end