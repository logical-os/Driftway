defmodule TextChannelsWeb.ChannelController do
  use TextChannelsWeb, :controller
  alias TextChannels.Messaging

  def index(conn, %{"server_id" => server_id}) do
    channels = Messaging.list_channels(server_id)
    json(conn, %{channels: channels})
  end

  def index(conn, _params) do
    json(conn, %{error: "server_id parameter required"})
  end

  def show(conn, %{"id" => id}) do
    try do
      channel = Messaging.get_channel!(id)
      json(conn, %{channel: channel})
    rescue
      Ecto.NoResultsError ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Channel not found"})
    end
  end

  def create(conn, channel_params) do
    case Messaging.create_channel(channel_params) do
      {:ok, channel} ->
        conn
        |> put_status(:created)
        |> json(%{channel: channel})
      
      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: format_errors(changeset)})
    end
  end

  def update(conn, %{"id" => id} = params) do
    try do
      channel = Messaging.get_channel!(id)
      
      case Messaging.update_channel(channel, params) do
        {:ok, updated_channel} ->
          json(conn, %{channel: updated_channel})
        
        {:error, changeset} ->
          conn
          |> put_status(:unprocessable_entity)
          |> json(%{errors: format_errors(changeset)})
      end
    rescue
      Ecto.NoResultsError ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Channel not found"})
    end
  end

  def delete(conn, %{"id" => id}) do
    try do
      channel = Messaging.get_channel!(id)
      
      case Messaging.delete_channel(channel) do
        {:ok, _} ->
          conn
          |> put_status(:no_content)
          |> json(%{})
        
        {:error, changeset} ->
          conn
          |> put_status(:unprocessable_entity)
          |> json(%{errors: format_errors(changeset)})
      end
    rescue
      Ecto.NoResultsError ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Channel not found"})
    end
  end

  def join(conn, %{"id" => channel_id}) do
    user_id = conn.assigns.current_user_id
    
    case Messaging.join_channel(channel_id, user_id) do
      {:ok, channel} ->
        json(conn, %{message: "Joined channel successfully", channel: channel})
      
      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: format_errors(changeset)})
    end
  end

  def leave(conn, %{"id" => channel_id}) do
    user_id = conn.assigns.current_user_id
    
    case Messaging.leave_channel(channel_id, user_id) do
      {:ok, channel} ->
        json(conn, %{message: "Left channel successfully", channel: channel})
      
      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: format_errors(changeset)})
    end
  end

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end
end