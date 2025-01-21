#!/bin/bash
set -e

# Load secrets
if [ -f /run/secrets/serviceRoleKey ]; then
  export SUPABASE_SERVICE_ROLE_KEY=$(cat /run/secrets/serviceRoleKey)
else
  echo "Error: SUPABASE_SERVICE_ROLE_KEY is not set" >&2
  exit 1
fi

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

if [ -f /run/secrets/redisUrl ]; then
  export UPSTASH_REDIS_REST_URL=$(cat /run/secrets/redisUrl)
else
  echo "Warning: UPSTASH_REDIS_REST_URL is not set"
fi

if [ -f /run/secrets/redisToken ]; then
  export UPSTASH_REDIS_REST_TOKEN=$(cat /run/secrets/redisToken)
else
  echo "Warning: UPSTASH_REDIS_REST_TOKEN is not set"
fi

if [ -f /run/secrets/resendKey ]; then
  export RESEND_API_KEY=$(cat /run/secrets/resendKey)
else
  echo "Warning: RESEND_API_KEY is not set"
fi

if [ -f /run/secrets/moviderKey ]; then
  export MOVIDER_API_KEY=$(cat /run/secrets/moviderKey)
else
  echo "Warning: MOVIDER_API_KEY is not set"
fi

if [ -f /run/secrets/moviderSecret ]; then
  export MOVIDER_API_SECRET=$(cat /run/secrets/moviderSecret)
else
  echo "Warning: MOVIDER_API_SECRET is not set"
fi

# Start the application
exec "$@"
