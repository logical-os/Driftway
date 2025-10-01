defmodule ChatService.MixProject do
  use Mix.Project

  def project do
    [
      app: :chat_service,
      version: "0.1.0",
      elixir: "~> 1.12",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  def application do
    [
      mod: {ChatService.Application, []},
      extra_applications: [:logger, :runtime_tools]
    ]
  end

  defp deps do
    [
      {:phoenix, "~> 1.7.0"},
      {:phoenix_pubsub, "~> 2.1"},
      {:jason, "~> 1.2"},
      {:plug_cowboy, "~> 2.5"},
      {:libcluster, "~> 3.3"}
    ]
  end
end