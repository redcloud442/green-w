#!/bin/bash
set -e


if [ -f /run/secrets/serviceRoleKey ]; then
  export SUPABASE_SERVICE_ROLE_KEY=$(cat /run/secrets/serviceRoleKey)
fi

if [ -f /run/secrets/databaseUrl ]; then
  export DATABASE_URL=$(cat /run/secrets/databaseUrl)
fi

if [ -f /run/secrets/directUrl ]; then
  export DIRECT_URL=$(cat /run/secrets/directUrl)
fi


if [ -f /run/secrets/redisUrl ]; then
  export UPSTASH_REDIS_REST_URL=$(cat /run/secrets/redisUrl)
fi


if [ -f /run/secrets/redisToken ]; then
  export UPSTASH_REDIS_REST_TOKEN=$(cat /run/secrets/redisToken)
fi


if [ -f /run/secrets/resendKey ]; then
  export RESEND_API_KEY=$(cat /run/secrets/resendKey)
fi

if [ -f /run/secrets/moviderKey ]; then
  export MOVIDER_API_KEY=$(cat /run/secrets/moviderKey)
fi


if [ -f /run/secrets/moviderSecret ]; then
  export MOVIDER_API_SECRET=$(cat /run/secrets/moviderSecret)
fi







# Start the application
exec "$@"
