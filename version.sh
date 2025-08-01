#!/bin/bash
set -e

if ! [ -z $(git status --untracked-files=no --porcelain) ]; then
    echo "Git status is not clean" > /dev/stderr
    exit 1
fi

NEW_VERSION=$(npm version "$@")
sed -E "s/(\"version\": \")[^\"]+(\")/\\1${NEW_VERSION:1}\\2/" -i deno.json

git add -A
git commit -m "${NEW_VERSION:1}"
git tag "$NEW_VERSION" HEAD -m "$NEW_VERSION"
