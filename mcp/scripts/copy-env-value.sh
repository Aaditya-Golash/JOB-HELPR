#!/usr/bin/env bash
# Copies one value out of mcp/.env.local straight to the clipboard, so you
# never have to open the file, find the line, or copy a substring by hand.
#
# Usage (run from the mcp/ directory):
#   bash scripts/copy-env-value.sh CONTACT_EMAIL
set -euo pipefail

KEY="${1:-}"
if [ -z "$KEY" ]; then
  echo "Usage: bash scripts/copy-env-value.sh VAR_NAME" >&2
  exit 1
fi

if [ ! -f .env.local ]; then
  echo "No .env.local found. Run this from the mcp/ directory." >&2
  exit 1
fi

LINE=$(grep "^${KEY}=" .env.local | head -1 || true)
if [ -z "$LINE" ]; then
  echo "No value found for ${KEY} in .env.local" >&2
  exit 1
fi

VALUE="${LINE#*=}"
VALUE="${VALUE%\"}"
VALUE="${VALUE#\"}"

printf '%s' "$VALUE" | clip.exe

echo "Copied ${KEY}'s value to your clipboard. Go paste it into the Value box now."
