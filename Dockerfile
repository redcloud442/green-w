FROM node:20.10-alpine

# Install required dependencies
RUN apk add --no-cache openssl bash libc6-compat

# Set the working directory
WORKDIR /usr/src/app

# Copy application dependencies
COPY package*.json ./ 
COPY prisma ./prisma/

# Install dependencies
RUN npm install --production
RUN npm install prisma --save-dev

# Generate Prisma client
RUN npx prisma generate --schema ./prisma/schema.prisma

# Copy the rest of the application files
COPY . .

# Copy the entrypoint script
COPY /scripts/entrypoint_overwrited.sh /usr/src/app/entrypoint.sh

# Ensure the script is executable
RUN dos2unix /usr/src/app/entrypoint.sh
RUN chmod +x /usr/src/app/entrypoint.sh


# Build the application (if applicable)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_CRYPTO_SECRET_KEY
ARG DATABASE_URL="postgresql://postgres.bfnevuiuzigykvlsnoea:Blackl300123!@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
ARG DIRECT_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV DATABASE_URL=$DATABASE_URL
ENV DIRECT_URL=$DIRECT_URL
RUN npm run build


ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["/bin/bash", "/usr/src/app/entrypoint.sh"]

# # Default command to run the app
CMD ["npm", "start"]
