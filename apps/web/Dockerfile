FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN npm ci --include=dev

COPY . .

# NEXT_PUBLIC_* values are embedded in the browser bundle during `next build`.
ARG NEXT_PUBLIC_API_URL
RUN test -n "$NEXT_PUBLIC_API_URL"
ENV NODE_ENV=production \
    PORT=3000 \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build --workspace=apps/web && chown -R node:node /app
USER node

EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=apps/web"]
