#!/usr/bin/env bash
# trace.sh — execute a command and append status + wall-clock duration to .temp/trace.log
#
# Usage:
#   trace.sh [--label LABEL] <command [args...]>
#   trace.sh [--label LABEL] -c "<full command string>"    # pipes / redirections / && chains
#   trace.sh report [N]                                     # summary: OK/FAIL counts + durations
#   trace.sh tail [N]                                       # tail of the trace log
#
# Log format (.temp/trace.log, append-only TSV):
#   <UTC timestamp>  <OK|FAIL>  <label|->  <duration_ms>  <command line>
#
# Exit status: same as the wrapped command.

set -o pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LOG="$ROOT/.temp/trace.log"

die() { echo "error: $*" >&2; exit 1; }

mkdir -p "$ROOT/.temp"

case "${1:-}" in
    report)
        n="${2:-50}"
        if [ ! -f "$LOG" ]; then
            echo "no trace log yet: $LOG"
            exit 0
        fi
        total=$(wc -l < "$LOG")
        ok=$(awk -F '\t' '$2=="OK"   {c++} END {print c+0}' "$LOG")
        fail=$(awk -F '\t' '$2=="FAIL" {c++} END {print c+0}' "$LOG")
        ms_total=$(awk -F '\t' '{gsub(/ms/,"",$4); s+=$4} END {print s+0}' "$LOG")
        echo "--- trace.sh report (all $total entries) ---"
        echo "OK:   $ok"
        echo "FAIL: $fail"
        if [ "$total" -gt 0 ]; then
            printf "avg:  %dms  total: %dms\n" "$((ms_total/total))" "$ms_total"
            echo "--- last FAILed commands ---"
            awk -F '\t' '$2=="FAIL" {print NR": "$1" "$4" "$5}' "$LOG" | tail -n "$n"
        fi
        ;;
    tail)
        n="${2:-30}"
        if [ -f "$LOG" ]; then
            tail -n "$n" "$LOG"
        else
            echo "no trace log yet: $LOG"
        fi
        ;;
    *)
        label=""
        if [ "${1:-}" = "--label" ]; then
            label="$2"
            shift 2
        fi
        str_mode=false
        if [ "${1:-}" = "-c" ]; then
            str_mode=true
            shift
            if [ "$#" -ne 1 ]; then
                die "'-c' expects exactly ONE argument — quote the full command string, got: $*"
            fi
        fi
        [ "$#" -eq 0 ] && die "no command given — see header of $0"
        ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
        start=$(date +%s%N)
        if $str_mode; then
            bash -c "$*"
        else
            "$@"
        fi
        code=$?
        end=$(date +%s%N)
        ms=$(( (end - start) / 1000000 ))
        if [ "$code" -eq 0 ]; then status="OK"; else status="FAIL"; fi
        line="$(printf '%s\t%s\t%s\t%dms\t%s' "$ts" "$status" "${label:--}" "$ms" "$*")"
        printf '%s\n' "$line" >> "$LOG"
        printf 'TRACE %s%s %dms >> %s\n' "$status" "${label:+ [$label]}" "$ms" "$*"
        exit "$code"
        ;;
esac
