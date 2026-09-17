# 34_plug_pipeline.exs — What this shows: a minimal web app with
#   Plug — Phoenix's foundation — running on the Bandit web server.
#   First run needs network (Hex fetch). Run, then open the printed
#   URL: elixir demo/ecosystem/34_plug_pipeline.exs
Mix.install([{:plug, "~> 1.16"}, {:bandit, "~> 1.5"}])

defmodule DemoRouter do
  # A router IS a plug that dispatches to other plugs (actions).
  use Plug.Router

  plug Plug.Logger                     # request logging — a pipeline member
  plug :match
  plug Plug.Parsers, parsers: [:json], pass: ["application/json"]
  plug :dispatch

  get "/hello" do
    # conn is immutable; send_resp returns the transformed conn.
    send_resp(conn, 200, "Hello from Plug!\n")
  end

  get "/greet/:name" do
    # Path params bind by name; HTML-escape anything user-provided:
    name = Plug.HTML.html_escape_to_iodata(name)
    send_resp(conn, 200, "Hello, #{name}!\n")
  end

  post "/echo" do
    case conn.body_params do
      %{"text" => text} ->
        conn |> put_resp_content_type("application/json") |> send_resp(200, JSON.encode!(%{you_said: text}))
      _ ->
        # Wrong body shape: tell the caller exactly what to send.
        send_resp(conn, 422, "{\"error\": \"send a JSON object with a text field\"}\n")
    end
  end

  match _ do
    send_resp(conn, 404, "not found\n")
  end
end

# Bandit runs the plug pipeline — this is the same stack Phoenix uses.
{:ok, _} = Bandit.start_link(plug: DemoRouter, port: 4123)
IO.puts("Try:  curl localhost:4123/hello")
IO.puts("      curl localhost:4123/greet/Ada")
IO.puts("      curl -X POST -d '{\"text\": \"hi\"}' -H 'content-type: application/json' localhost:4123/echo")
Process.sleep(:infinity)
