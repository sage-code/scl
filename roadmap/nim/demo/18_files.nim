# 18_files.nim — files, paths, and a command-line program.
#
# Run it with:  nim c -r 18_files.nim --lines 3 --tag demo
#
# Standard library: `std/os` for paths and processes, `std/strutils` for text,
# `std/parseopt` for arguments. The pattern below is the one every small tool
# follows: parse options → read input → transform → write output → clean up.

import std/[os, strutils, parseopt, times]

# 1. Paths are values, not strings to concatenate. `/` joins with the right
#    separator for the platform, `$` renders the result, and `parentDir`,
#    `extractFilename`, `changeFileExt` work on either separator.
let dir = getTempDir()
let path = dir / "nim_demo_config.txt"
echo "path      : ", path
echo "file name : ", path.extractFilename
echo "extension : ", path.changeFileExt(".bak").extractFilename
echo "exists?   : ", fileExists(path)

# 2. Writing text. `writeFile` truncates; `appendFile` adds. Both raise IOError
#    on failure, so a caller that must not crash needs a `try` block around them.
writeFile(path, """
# demo config
host = localhost
port = 8080
""")
if not fileExists(path):
  quit("could not create " & path, QuitFailure)

# 3. Reading. `readFile` loads everything — fine for configuration, wrong for
#    logs. The `lines` iterator streams instead: memory stays constant no matter
#    how large the input is, and it closes the handle when the loop ends.
var entries = 0
var settings: seq[(string, string)]
for line in lines(path):
  let trimmed = line.strip()
  if trimmed.len == 0 or trimmed.startsWith("#"):
    continue                                   # skip comments and blanks
  let parts = trimmed.split('=', 1)
  if parts.len != 2:
    echo "malformed line: ", trimmed
    continue
  settings.add((parts[0].strip(), parts[1].strip()))
  entries.inc

echo "entries   : ", entries
for (key, value) in settings:
  echo "  ", key.alignLeft(8), " = ", value

# 4. The same stream, transformed: read → uppercase keys → write to a new file.
#    `getTempDir()` is used for the copy so the demo leaves nothing behind in
#    the working directory.
let backup = path.changeFileExt(".upper")
var output: seq[string]
for line in lines(path):
  output.add(line.toUpperAscii())
writeFile(backup, output.join("\n") & "\n")
echo "backup    : ", backup.extractFilename, " (",
     getFileSize(backup), " bytes)"

# 5. Command-line arguments. `parseopt` walks `--flag`, `--key:value` and short
#    `-x` forms; it never raises on odd input, so the program decides what an
#    unknown option means.
type
  Options = object
    limit: int
    tag: string
    verbose: bool

proc parseArgs(): Options =
  result = Options(limit: 2, tag: "none")
  for kind, key, value in getopt():
    case kind
    of cmdArgument:
      echo "positional argument: ", key
    of cmdShortOption, cmdLongOption:
      case key
      of "lines", "l": result.limit = parseInt(value)
      of "tag", "t": result.tag = value
      of "verbose", "v": result.verbose = true
      of "help", "h":
        echo "usage: 18_files.nim [--lines N] [--tag NAME] [--verbose]"
        quit(QuitSuccess)
      else:
        echo "ignoring unknown option: ", key
    of cmdEnd:
      discard
  # `getopt()` is called with the default parameters, so the argument count is
  # delivered by `os.commandLineParams()` — useful for a quick pre-check.
  if commandLineParams().len > 0 and result.verbose:
    echo "received ", commandLineParams().len, " raw argument(s)"

let opt = parseArgs()
echo "options   : limit=", opt.limit, " tag=", opt.tag, " verbose=", opt.verbose

# 6. Use the parsed options: print at most `limit` settings, tagged.
for i, (key, value) in settings:
  if i >= opt.limit: break
  echo "  [", opt.tag, "] ", key, " -> ", value

# 7. Clean up. A tool that writes temporary state removes it again; `removeFile`
#    raises if the path is missing, so check first.
for f in [path, backup]:
  if fileExists(f):
    removeFile(f)
echo "cleaned up: ", not fileExists(path), " / ", not fileExists(backup)

# A timestamp from `std/times` reminds you that I/O programs need deterministic
# formatting, not locale-dependent defaults.
echo "finished at ", now().format("yyyy-MM-dd HH:mm:ss")
