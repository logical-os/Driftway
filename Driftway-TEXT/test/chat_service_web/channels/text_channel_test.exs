defmodule ChatServiceWeb.TextChannelTest do
  use ChatServiceWeb.ChannelCase

  setup do
    {:ok, _, socket} =
      ChatServiceWeb.UserSocket
      |> socket("user_id", %{user_id: "test_user"})
      |> subscribe_and_join(ChatServiceWeb.TextChannel, "text_channel:test")

    %{socket: socket}
  end

  test "ping replies with status ok", %{socket: socket} do
    ref = push(socket, "ping", %{"hello" => "there"})
    assert_reply ref, :ok, %{"hello" => "there"}
  end

  test "new_message broadcasts to text_channel:test", %{socket: socket} do
    push(socket, "new_message", %{"content" => "hello"})
    assert_broadcast "new_message", %{content: "hello"}
  end

  test "broadcasts are pushed to the client", %{socket: socket} do
    broadcast_from!(socket, "broadcast", %{"some" => "data"})
    assert_push "broadcast", %{"some" => "data"}
  end
end