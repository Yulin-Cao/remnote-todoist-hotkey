#!/bin/zsh
set -e

SCRIPT_DIR="${0:A:h}"
cd "$SCRIPT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install it from https://nodejs.org and run this file again."
  read -r "?Press Return to close."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Preparing the private RemNote plugin for first use…"
  npm install
fi

echo ""
echo "RemNote Todoist plugin is available at http://localhost:8080"
echo "Keep this window open while using the plugin. Press Control-C to stop it."
echo ""
npm run dev
