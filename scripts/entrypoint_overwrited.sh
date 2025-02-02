#!/bin/bash
set -e

# Load secrets


if [ -f /run/secrets/databaseUrl ]; then
  export DATABASE_URL=$(cat /run/secrets/databaseUrl)
else
  echo "Error: DATABASE_URL is not set" >&2
  exit 1
fi

if [ -f /run/secrets/directUrl ]; then
  export DIRECT_URL=$(cat /run/secrets/directUrl)
else
  echo "Error: DIRECT_URL is not set" >&2
  exit 1
fi

# Start the application
exec "$@"
