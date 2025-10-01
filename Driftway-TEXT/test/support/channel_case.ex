defmodule ChatServiceWeb.ChannelCase do
  use ExUnit.CaseTemplate

  using do
    quote do
      # Import conveniences for testing with channels
      import Phoenix.ChannelTest
      import ChatServiceWeb.ChannelCase

      # The default endpoint for testing
      @endpoint ChatServiceWeb.Endpoint
    end
  end

  setup tags do
    :ok
  end
end