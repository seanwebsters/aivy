# Aivy — production image for Railway (or any Docker host).
# Prototype data lives in a JSON file: attach a volume and Railway sets
# RAILWAY_VOLUME_MOUNT_PATH automatically, so data survives redeploys.
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV AIVY_NOINDEX=true
RUN npm run build && npm prune --omit=dev

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
# PREVIEW SETTINGS — the clickable test checkout and no search indexing.
# Simulated checkout switches itself off automatically once STRIPE_SECRET_KEY is set.
ENV AIVY_ALLOW_SIMULATED_PAYMENTS=true
ENV AIVY_NOINDEX=true
COPY --from=build /app ./
EXPOSE 3000
CMD ["sh", "-c", "npx next start -p ${PORT:-3000}"]
