defmodule ChatServiceTest do
  use ExUnit.Case
  doctest ChatService

  test "module exists" do
    assert is_atom(ChatService)
  end
end