#!/usr/bin/env bash
set -e

show_help() {
    echo "Sage-Code SCL Project Maintenance Wrapper"
    echo "Usage: ./run.sh [command] [options]"
    echo ""
    echo "Commands:"
    echo "  clean      Clean build artifacts (npm run clean)"
    echo "  build      Build static website (npm run build)"
    echo "  rebuild    Clean and perform a full build (npm run clean && npm run build:full)"
    echo "  test       Verify source files (originals) (npm run test)"
    echo "  check      Verify generated public/ output (npm run check)"
    echo "  commit     Stage changes and commit with message"
    echo "             Usage: ./run.sh commit \"your commit message\""
    echo "  publish    Increment version, commit and push changes"
    echo "  audit      Run CSS/Audit on public folder"
    echo "             Usage: ./run.sh audit [folder]"
    echo "  -h, --help Show this help message"
}

case "$1" in
    clean)
        npm run clean
        ;;
    build)
        npm run build
        ;;
    rebuild)
        npm run clean
        npm run build:full
        ;;
    test)
        npm run test
        ;;
    check)
        npm run check
        ;;
    audit)
        shift
        folder="${1:-public}"
        node scripts/audit.js "$folder"
        ;;

    commit)
        shift
        msg="${1:-chore: update project build artifacts and content}"

        # Guard: ./run.sh commit must be executed from the project root.
        # git resolves the repository from the current folder, so running
        # from any other directory would stage/commit a different repo.
        case "$(git rev-parse --show-toplevel 2>/dev/null)" in
            */sage-code/scl) ;;
            *)
                echo "error: ./run.sh commit must run from the scl repository root"
                echo "       (current folder is $PWD)"
                exit 1
                ;;
        esac

        git add -A
        if git diff --cached --quiet; then
            echo "Nothing to commit - working tree clean."
            exit 0
        fi

        echo "Staging:"
        git status --short
        echo
        git commit -m "$msg"
        echo "Committed $(git rev-parse --short HEAD)"
        ;;
    publish)
        VERSION_FILE="README.md"
        CURRENT_VERSION=$(awk '/Version: [0-9]+\.[0-9]+\.[0-9]+/ {print $2}' "$VERSION_FILE")
        
        if [ -z "$CURRENT_VERSION" ]; then
            echo "Could not find version in $VERSION_FILE"
            exit 1
        fi
        
        echo "Current version: $CURRENT_VERSION"
        IFS='.' read -r major minor patch <<< "$CURRENT_VERSION"
        NEW_PATCH=$((patch + 1))
        NEW_VERSION="$major.$minor.$NEW_PATCH"
        echo "New version: $NEW_VERSION"
        
        # Update README
        perl -pi -e "s/Version: $CURRENT_VERSION/Version: $NEW_VERSION/" "$VERSION_FILE"
        
        # Update package.json version
        node -e "const fs = require('fs'); const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')); pkg.version = '$NEW_VERSION'; fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');"
        
        git add "$VERSION_FILE" package.json
        git commit -m "chore: bump version to $NEW_VERSION"
        git push
        echo "Published version $NEW_VERSION"
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
