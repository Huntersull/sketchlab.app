# syntax=docker/dockerfile:1

FROM node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293 AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# The fork removes third-party analytics in source. Fail if it returns.
RUN ! grep -q "umami-production-101d.up.railway.app" /app/dist/index.html

FROM nginx:alpine@sha256:db35bfc6b2951e7f8a72db5db120288c127ffaeeb4a6d4b95a26fead017d5913

ARG SKETCHLAB_SOURCE_COMMIT
LABEL org.opencontainers.image.source="https://github.com/Huntersull/sketchlab.app" \
      org.opencontainers.image.revision="${SKETCHLAB_SOURCE_COMMIT}" \
      org.opencontainers.image.title="SketchLab for Hestia"

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
