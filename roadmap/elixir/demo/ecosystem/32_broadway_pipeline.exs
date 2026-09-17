# 32_broadway_pipeline.exs — What this shows: a Broadway pipeline
#   with a custom producer, bounded processors, and batching.
#   First run needs network (Hex fetch). Run:
#   elixir demo/ecosystem/32_broadway_pipeline.exs
Mix.install([{:broadway, "~> 1.1"}])

# A minimal producer: pushes numbers, then a final :flush.
defmodule NumberProducer do
  use GenStage

  def start_link(_), do: GenStage.start_link(__MODULE__, :ok, name: __MODULE__)

  @impl true
  def init(:ok), do: {:producer, %{sent: 0}}

  @impl true
  # handle_demand IS back-pressure: the pipeline asks for N events,
  # we send only N — never more than the pipeline can chew.
  def handle_demand(demand, %{sent: sent} = state) when sent < 100 do
    events = Enum.to_list(sent..min(sent + demand, 99))
    {:noreply, events, %{state | sent: sent + length(events)}}
  end

  @impl true
  def handle_demand(_demand, state), do: {:noreply, [:flush], state}
end

defmodule Pipeline do
  use Broadway

  def start_link(_opts) do
    Broadway.start_link(__MODULE__,
      name: __MODULE__,
      producer: [module: {NumberProducer, []}, concurrency: 1],
      processors: [stages: 10, max_demand: 20],
      batchers: [default: [batch_size: 10, batch_timeout: 100]]
    )
  end

  @impl true
  # Runs concurrently in `stages` processes — parse/validate here:
  def handle_message(_processor, %{data: n} = msg, _ctx) when is_binary(n) do
    msg
    |> Broadway.Message.update_data(fn d -> String.to_integer(d) * 2 end)
    |> Broadway.Message.put_batcher(:default)
  end

  @impl true
  # Batching: side-effects happen 10-at-a-time (one DB call, etc.):
  def handle_batch(:default, messages, _batch_info, _ctx) do
    total = messages |> Enum.map(& &1.data) |> Enum.sum()
    IO.inspect(total, label: "batch sum")
    messages
  end
end

{:ok, _} = Pipeline.start_link([])
Process.sleep(1_000)     # let the pipeline drain
Broadway.stop(Pipeline)
