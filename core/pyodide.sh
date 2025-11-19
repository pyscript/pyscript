#!/usr/bin/env bash

# This script assumes the following folder structure:
#   ./pyscript      - it must be a GitHub clone/fork
#   ./polyscript    - it must be a GitHub clone/fork
#
# Running from ./pyscript/core via:
#
#   cd ./pyscript/core
#   bash ./pyodide.sh
#
# will print a JSON compatible string like:
#
# {
#   "2024.10.1": "0.26.2",
#   ...
#   "2025.11.1": "0.29.0",
#   "": null
# }
#
# Each key represents the PyScript release and each
# value represents the Pyodide version used by that PyScript release.
#
# The last empty key with `null` value is used just to close the JSON object.
# One could remove manually that entry as long as there are no dangling commas.
#

current_pyscript=$(git branch | grep \\* | cut -d ' ' -f2)

echo "{"
for release in $(git tag --list --sort=version:refname); do
    git checkout ${release} > /dev/null 2>&1
    if test -e "package.json"; then
        polyscript=$(cat package.json | jq -r '.dependencies.polyscript')
        tag="v${polyscript:1:${#polyscript}-1}"
        cd ../../polyscript > /dev/null 2>&1
        current_polyscript=$(git branch | grep \\* | cut -d ' ' -f2)
        git checkout ${tag} > /dev/null 2>&1
        if test -e "versions/pyodide"; then
            echo "  \"${release}\": \"$(cat versions/pyodide)\","
        fi
        git checkout ${current_polyscript} > /dev/null 2>&1
        cd - > /dev/null 2>&1
    fi
    git checkout ${current_pyscript} > /dev/null 2>&1
done
echo "  \"\": null"
echo "}"
