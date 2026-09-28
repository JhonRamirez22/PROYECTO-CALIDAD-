FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN npm ci --include=dev

COPY . .

# This URL is only a build-time placeholder for Prisma Client generation.
RUN DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public" \
    npm exec --workspace=apps/api -- prisma generate --schema=prisma/schema.prisma \
    && npm run build --workspace=apps/api

ENV NODE_ENV=production \
    PORT=3001 \
    RITECH_UPLOAD_DIR=/mnt/ritech-storage

RUN mkdir -p /mnt/ritech-storage && chown -R node:node /app /mnt/ritech-storage
USER node

EXPOSE 3001
CMD ["node", "apps/api/dist/src/main.js"]
