#!/bin/bash

# Increment version script
# Version format in README.md: "Version: X.Y.Z"

VERSION_FILE="README.md"
# Extract version using awk to avoid complex grep regex issues
CURRENT_VERSION=$(awk '/Version: [0-9]+\.[0-9]+\.[0-9]+/ {print $2}' "$VERSION_FILE")

if [ -z "$CURRENT_VERSION" ]; then
    echo "Could not find version in $VERSION_FILE"
    exit 1
fi

echo "Current version: $CURRENT_VERSION"

# Increment patch version
IFS='.' read -r major minor patch <<< "$CURRENT_VERSION"
NEW_PATCH=$((patch + 1))
NEW_VERSION="$major.$minor.$NEW_PATCH"

echo "New version: $NEW_VERSION"

# Update version in README.md
# Using perl for safe in-place editing across platforms
perl -pi -e "s/Version: $CURRENT_VERSION/Version: $NEW_VERSION/" "$VERSION_FILE"

# Commit and push
git add "$VERSION_FILE"
git commit -m "chore: bump version to $NEW_VERSION"
git push

echo "Published version $NEW_VERSION"
