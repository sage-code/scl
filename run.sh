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
    echo "  test       Run local tests (npm run test:local)"
    echo "  commit     Stage changes and commit with message"
    echo "             Usage: ./run.sh commit \"your commit message\""
    echo "  publish    Increment version, commit and push changes"
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
        npm run test:local
        ;;
    commit)
        shift
        msg="${1:-chore: update project build artifacts and content}"
        git add .
        git commit -m "$msg"
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
