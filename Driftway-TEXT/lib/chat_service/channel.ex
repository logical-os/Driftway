defmodule ChatService.Channel do
  @moduledoc """
  Channel management module for handling text channels and message storage.
  
  In production, this should be backed by a proper database like PostgreSQL.
  For this example, we use ETS for simplicity.
  """
  
  @table_name :chat_messages
  
  def start_link do
    case :ets.info(@table_name) do
      :undefined -> :ets.new(@table_name, [:named_table, :public, :ordered_set])
      _ -> :ok
    end
    {:ok, self()}
  end
  
  def store_message(message) do
    key = {message.channel_id, message.timestamp, message.id}
    :ets.insert(@table_name, {key, message})
  end
  
  def get_recent_messages(channel_id, limit \\ 50) do
    pattern = {{channel_id, :"$1", :"$2"}, :"$3"}
    
    :ets.select(@table_name, [{pattern, [], [:"$3"]}])
    |> Enum.sort_by(& &1.timestamp, {:desc, DateTime})
    |> Enum.take(limit)
    |> Enum.reverse()
  end
  
  def get_channel_stats(channel_id) do
    pattern = {{channel_id, :"$1", :"$2"}, :"$3"}
    
    messages = :ets.select(@table_name, [{pattern, [], [:"$3"]}])
    message_count = length(messages)
    
    active_users = 
      Registry.select(ChatService.ChannelRegistry, [{{:"$1", :"$2", :"$3"}, [{:==, :"$1", channel_id}], [:"$3"]}])
      |> Enum.uniq()
      |> length()
    
    %{
      channel_id: channel_id,
      message_count: message_count,
      active_users: active_users
    }
  end
end