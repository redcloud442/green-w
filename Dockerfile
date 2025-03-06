
FROM node:20.10-alpine


RUN apk add --no-cache curl bash openssl libc6-compat && \
    curl -fsSL https://bun.sh/install | bash && \
    mv /root/.bun/bin/bun /usr/local/bin/

# Set the working directory
WORKDIR /usr/src/app

# Copy application dependencies
COPY package.json bun.lock ./ 
COPY prisma ./prisma/


RUN bun install --frozen-lockfile

# Generate Prisma client
RUN bun prisma generate --schema ./prisma/schema.prisma

# Copy the rest of the application files
COPY . .

# Copy the entrypoint script
COPY /scripts/entrypoint_overwrited.sh /usr/src/app/entrypoint.sh

# Ensure the script is executable
RUN dos2unix /usr/src/app/entrypoint.sh && chmod +x /usr/src/app/entrypoint.sh

# Build the application (if applicable)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_CRYPTO_SECRET_KEY
ARG NEXT_PUBLIC_HCAPTCHA_SITE_KEY
ARG SUPABASE_SERVICE_ROLE_KEY
ARG DATABASE_URL="postgresql://postgres.bfnevuiuzigykvlsnoea:Blackl300123!@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
ARG DIRECT_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_HCAPTCHA_SITE_KEY=$NEXT_PUBLIC_HCAPTCHA_SITE_KEY
ENV CRYPTO_SECRET_KEY=$NEXT_PUBLIC_CRYPTO_SECRET_KEY
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV DATABASE_URL=$DATABASE_URL
ENV DIRECT_URL=$DIRECT_URL

# Use Bun for the build process (instead of npm)
RUN bun run build

# Set the application port
ENV PORT=8080
EXPOSE 8080

# Define the entrypoint for the container
ENTRYPOINT ["/bin/bash", "/usr/src/app/entrypoint.sh"]

# Default command to start the app with Bun
CMD ["bun", "start"]