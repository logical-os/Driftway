defmodule TextChannelsWeb.CoreComponents do
  @moduledoc """
  Provides core UI components.
  """
  use Phoenix.Component

  @doc """
  Renders a simple error list.
  """
  attr :errors, :list, required: true
  
  def error_list(assigns) do
    ~H"""
    <div class="text-red-600">
      <ul :for={error <- @errors}>
        <li><%= error %></li>
      </ul>
    </div>
    """
  end
end