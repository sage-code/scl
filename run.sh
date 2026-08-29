#!/usr/bin/env bash
set -e

show_help() {
    echo "Sage-Code SCL Project Maintenance Wrapper"
    echo "Usage: ./run.sh [command] [options]"
    echo ""
    echo "Commands:"
    echo "  clean      Clean build artifacts (npm run clean)"
    echo "  build      Build static website (npm run build)"
    echo "  test       Run local tests (npm run test:local)"
    echo "  commit     Stage changes and commit with message"
    echo "             Usage: ./run.sh commit \"your commit message\""
    echo "  -h, --help Show this help message"
}

case "$1" in
    clean)
        npm run clean
        ;;
    build)
        npm run build
        ;;
    test)
        npm run test:local
        ;;
    commit)
        shift
        msg="${1:-chore: update project build artifacts and content}"
        git add .
        git commit -m "$msg"
        ;;
    -h|--help|"")
        show_help
        ;;
    *)
        echo "Unknown command: $1"
        echo "Run './run.sh --help' for usage."
        exit 1
        ;;
esac
