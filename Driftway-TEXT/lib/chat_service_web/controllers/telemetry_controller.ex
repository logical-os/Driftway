defmodule ChatServiceWeb.TelemetryController do
  use Phoenix.Controller
  
  alias ChatService.Channel
  
  def metrics(conn, _params) do
    # Get system metrics safely
    memory_info = :erlang.memory()
    total_memory = Keyword.get(memory_info, :total, 0)
    allocated_memory = Keyword.get(memory_info, :processes, 0)
    system_memory = Keyword.get(memory_info, :system, 0)
    
    # Get application metrics
    channel_stats = get_channel_statistics()
    
    metrics = %{
      system: %{
        node: Node.self() |> Atom.to_string(),
        connected_nodes: Node.list() |> Enum.map(&Atom.to_string/1),
        uptime: System.system_time(:millisecond),
        memory: %{
          total: total_memory,
          allocated: allocated_memory,
          system: system_memory
        },
        processes: :erlang.system_info(:process_count),
        ports: :erlang.system_info(:port_count),
        schedulers: :erlang.system_info(:schedulers_online)
      },
      application: %{
        active_channels: length(channel_stats),
        total_messages: get_total_message_count(),
        connections: get_active_connection_count(),
        channels: channel_stats
      },
      timestamp: System.system_time(:millisecond)
    }
    
    json(conn, metrics)
  end
  
  defp get_channel_statistics do
    try do
      Registry.select(ChatService.ChannelRegistry, [
        {{:"$1", :"$2", :"$3"}, [], [{{:"$1", :"$3"}}]}
      ])
      |> Enum.group_by(fn {channel_id, _user_id} -> channel_id end)
      |> Enum.map(fn {channel_id, users} ->
        %{
          channel_id: channel_id,
          active_users: length(users),
          message_count: get_channel_message_count(channel_id)
        }
      end)
    rescue
      _ -> []
    end
  end
  
  defp get_channel_message_count(channel_id) do
    try do
      Channel.get_recent_messages(channel_id, 1000) |> length()
    rescue
      _ -> 0
    end
  end
  
  defp get_total_message_count do
    try do
      :ets.info(:chat_messages, :size) || 0
    rescue
      _ -> 0
    end
  end
  
  defp get_active_connection_count do
    try do
      Registry.count(ChatService.ChannelRegistry)
    rescue
      _ -> 0
    end
  end
end