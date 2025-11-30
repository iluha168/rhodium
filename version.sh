#!/bin/bash
set -e

git checkout main-cjs
git merge --no-ff dev

if ! [ -z $(git status --untracked-files=no --porcelain) ]; then
    echo "Git status is not clean" > /dev/stderr
    exit 1
fi

NEW_VERSION=$(npm version "pre$@" --preid cjs)
sed -E "s/(\"version\": \")[^\"]+(\")/\\1${NEW_VERSION:1}\\2/" -i deno.json

git add -A
git commit -m "${NEW_VERSION:1}"
git tag "$NEW_VERSION" HEAD -m "$NEW_VERSION"
