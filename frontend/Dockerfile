FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV CI=1 EXPO_NO_TELEMETRY=1 EXPO_PUBLIC_API_URL=/api
COPY frontend/package.json frontend/package-lock.json ./
COPY frontend/scripts ./scripts
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run lint && npm test && npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine
LABEL org.opencontainers.image.title="GatePilot Web" org.opencontainers.image.version="1.0.0"
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
HEALTHCHECK --interval=10s --timeout=3s --retries=6 CMD wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1
