# 33_nx_tensors.exs — What this shows: Nx tensors, defn functions,
#   and a softmax — numerical code the JIT can compile to native code.
#   First run needs network (Hex fetch). Run:
#   elixir demo/ecosystem/33_nx_tensors.exs
Mix.install([{:nx, "~> 0.9"}])

defmodule NN do
  import Nx.Defn

  # defn restricts the body to tensor operations — that restriction is
  # what lets EXLA/GPU backends compile it later.
  defn softmax(t) do
    Nx.exp(t) / Nx.sum(Nx.exp(t))
  end

  defn normalize(t) do
    (t - Nx.mean(t)) / Nx.standard_deviation(t)
  end
end

t = Nx.tensor([1.0, 2.0, 3.0, 4.0])
IO.inspect(NN.softmax(t), label: "softmax")
IO.inspect(NN.normalize(t), label: "z-score normalize")

# Tensors are shaped and typed — matrices work as you'd hope:
m = Nx.tensor([[1, 2], [3, 4]])
IO.inspect(Nx.multiply(m, 10), label: "element-wise")
IO.inspect(Nx.sum(m, axes: [1]), label: "row sums")

# Compare with the Enum version of softmax — readable, but slower on
# big data and cannot be JIT-compiled:
defmodule EnumSoftmax do
  def softmax(list) do
    exps = Enum.map(list, &:math.exp/1)
    sum = Enum.sum(exps)
    Enum.map(exps, &(&1 / sum))
  end
end
IO.inspect(EnumSoftmax.softmax([1.0, 2.0, 3.0, 4.0]), label: "same math, Enum")

# The division of labor (lesson 27): Elixir orchestrates; Nx (often
# backed by Rust/OpenXLA) computes. Same philosophy as Rust NIFs.
