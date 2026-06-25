# TODO: Revisar

FROM node:20-alpine AS base

# Install libc6-compat for some deps
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@latest --activate

# 1. Install dependencies
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies (ignoring scripts to avoid prisma generate failure before schema copy)
RUN pnpm i --frozen-lockfile --ignore-scripts

# 2. Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client (User requested pnpm)
RUN pnpm prisma generate

# Build Next.js app
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# 3. Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install Prisma CLI globally for migrations
RUN npm install -g prisma

# Create .next directory
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy schema for migrations
COPY --from=builder /app/src/prisma ./src/prisma

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run migrations and then start the server
CMD ["/bin/sh", "-c", "prisma migrate deploy && node server.js"]
