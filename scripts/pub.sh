#!/bin/bash

[[ -z "$1" ]] && echo "cannot publish, must provide tag message" && exit 1

git push && yarn build && npm publish && git tag $(cat package.json | jq -r ".version") -m "$1" && git push --tags