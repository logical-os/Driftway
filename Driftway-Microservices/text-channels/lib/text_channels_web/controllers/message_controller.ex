defmodule TextChannelsWeb.MessageController do
  use TextChannelsWeb, :controller
  alias TextChannels.Messaging

  def index(conn, %{"channel_id" => channel_id} = params) do
    limit = Map.get(params, "limit", "50") |> String.to_integer()
    before = Map.get(params, "before")
    
    before_datetime = if before do
      case DateTime.from_iso8601(before) do
        {:ok, datetime, _} -> datetime
        _ -> nil
      end
    else
      nil
    end

    messages = Messaging.list_messages(channel_id, limit, before_datetime)
    json(conn, %{messages: messages})
  end

  def create(conn, %{"channel_id" => channel_id} = message_params) do
    user_id = conn.assigns.current_user_id
    
    # Get username from user service or use user_id for now
    username = Map.get(message_params, "username", user_id)
    
    attrs = message_params
    |> Map.put("channel_id", channel_id)
    |> Map.put("user_id", user_id)
    |> Map.put("username", username)

    case Messaging.create_message(attrs) do
      {:ok, message} ->
        conn
        |> put_status(:created)
        |> json(%{message: message})
      
      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: format_errors(changeset)})
    end
  end

  def update(conn, %{"id" => id} = params) do
    user_id = conn.assigns.current_user_id
    
    try do
      message = Messaging.get_message!(id)
      
      # Check if user owns the message
      if message.user_id == user_id do
        case Messaging.update_message(message, params) do
          {:ok, updated_message} ->
            json(conn, %{message: updated_message})
          
          {:error, changeset} ->
            conn
            |> put_status(:unprocessable_entity)
            |> json(%{errors: format_errors(changeset)})
        end
      else
        conn
        |> put_status(:forbidden)
        |> json(%{error: "You can only edit your own messages"})
      end
    rescue
      Ecto.NoResultsError ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Message not found"})
    end
  end

  def delete(conn, %{"id" => id}) do
    user_id = conn.assigns.current_user_id
    
    try do
      message = Messaging.get_message!(id)
      
      # Check if user owns the message
      if message.user_id == user_id do
        case Messaging.delete_message(message) do
          {:ok, _} ->
            conn
            |> put_status(:no_content)
            |> json(%{})
          
          {:error, changeset} ->
            conn
            |> put_status(:unprocessable_entity)
            |> json(%{errors: format_errors(changeset)})
        end
      else
        conn
        |> put_status(:forbidden)
        |> json(%{error: "You can only delete your own messages"})
      end
    rescue
      Ecto.NoResultsError ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Message not found"})
    end
  end

  def add_reaction(conn, %{"id" => message_id, "emoji" => emoji}) do
    user_id = conn.assigns.current_user_id
    
    case Messaging.add_reaction(message_id, user_id, emoji) do
      {:ok, message} ->
        json(conn, %{message: message})
      
      {:error, reason} when is_binary(reason) ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: reason})
      
      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: format_errors(changeset)})
    end
  end

  def remove_reaction(conn, %{"id" => message_id, "emoji" => emoji}) do
    user_id = conn.assigns.current_user_id
    
    case Messaging.remove_reaction(message_id, user_id, emoji) do
      {:ok, message} ->
        json(conn, %{message: message})
      
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