defmodule ChatServiceWeb.HealthController do
  use Phoenix.Controller
  
  def check(conn, _params) do
    # Simple health check
    node_info = %{
      node: Node.self() |> Atom.to_string(),
      connected_nodes: Node.list() |> Enum.map(&Atom.to_string/1),
      uptime: System.system_time(:millisecond),
      status: "healthy"
    }
    
    json(conn, node_info)
  end
end