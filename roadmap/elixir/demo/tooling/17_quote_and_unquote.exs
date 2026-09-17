# 17_quote_and_unquote.exs — What this shows: the AST as data,
#   Macro.to_string for reading it back, and unquote splicing.
#   Run: elixir demo/tooling/17_quote_and_unquote.exs

defmodule Ast do
  # quote returns the AST instead of evaluating:
  def sample, do: quote(do: 1 + 2)
  # => {:+, [context: Elixir, imports: [{2, Kernel}]], [1, 2]}
  #    ^call ^metadata              ^arguments

  def show(expr), do: Macro.to_string(expr)

  # unquote injects VALUES into quoted code:
  def build_sum(x) do
    quote do
      unquote(x) + 10
    end
  end

  # Macro.escape turns a runtime VALUE into AST — required when
  # splicing data structures into generated code:
  def inject_map(map) do
    ast = Macro.escape(map)
    quote do
      Map.put(unquote(ast), :injected, true)
    end
  end
end

IO.inspect(Ast.sample(), label: "AST of 1 + 2")
IO.puts(Ast.show(Ast.sample()) <> "   <- back to code")

# The generated code is a normal expression once evaluated:
quoted = Ast.build_sum(5)
IO.inspect(Code.eval_quoted(quoted), label: "evaluated quote")

map_ast = Ast.inject_map(%{a: 1})
{value, _} = Code.eval_quoted(map_ast)
IO.inspect(value, label: "escaped map injected")

# Why care? Every DSL you use — Ecto queries, ExUnit tests, Phoenix
# routes — is a macro reading THIS structure. Understanding quote
# demystifies the whole ecosystem.
IO.puts(Ast.show(quote(do: def foo(x), do: x + 1)))
