defmodule TextChannels.Repo do
  @moduledoc """
  MongoDB repository for TextChannels
  """
  
  def child_spec(_opts) do
    %{
      id: __MODULE__,
      start: {__MODULE__, :start_link, []},
      type: :supervisor
    }
  end
  
  def start_link do
    Mongo.start_link(name: __MODULE__, url: get_database_url())
  end
  
  defp get_database_url do
    System.get_env("DATABASE_URL") || "mongodb://localhost:27017/driftway"
  end
  
  def find(collection, filter, opts \\ []) do
    Mongo.find(__MODULE__, collection, filter, opts)
  end
  
  def insert_one(collection, document, opts \\ []) do
    Mongo.insert_one(__MODULE__, collection, document, opts)
  end
  
  def update_one(collection, filter, update, opts \\ []) do
    Mongo.update_one(__MODULE__, collection, filter, update, opts)
  end
  
  def delete_one(collection, filter, opts \\ []) do
    Mongo.delete_one(__MODULE__, collection, filter, opts)
  end
end