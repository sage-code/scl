# 04_script_arguments.exs — What this shows: .exs scripts reading
#   argv, environment variables, and writing files.
#   Run: elixir demo/foundations/04_script_arguments.exs --name Ada

# System.argv/0 returns script arguments as a list of strings.
case System.argv() do
  ["--name", name | _] -> IO.puts("Hello from a script, #{name}!")
  _ -> IO.puts("Try: elixir 04_script_arguments.exs --name Ada")
end

# Environment variables come as strings — parse deliberately.
pool =
  case System.get_env("POOL_SIZE") do
    nil -> 10                                  # default when unset
    raw ->
      # String.to_integer raises on garbage; this is a script,
      # so failing fast is the honest choice.
      String.to_integer(raw)
  end
IO.inspect(pool, label: "pool size")

# Path helpers and file IO — File functions return tagged tuples.
path = Path.join(System.tmp_dir!(), "sage_demo.txt")

# write! raises on failure; the non-bang File.write returns a tuple.
File.write!(path, """
line one
line two
""")

# Read the whole file (fine for small files):
IO.inspect(File.read!(path) |> String.split("\n", trim: :true) |> length(),
           label: "line count")

# Stream the file line by line — the scalable version for big files:
File.stream!(path)
|> Stream.map(&String.trim_trailing/1)
|> Enum.each(&IO.puts("read: #{&1}"))

File.rm(path)   # clean up; returns :ok
