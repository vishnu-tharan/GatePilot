FROM node:22-bookworm-slim
ENV NODE_ENV=production MONGOMS_DISABLE_POSTINSTALL=1
LABEL org.opencontainers.image.title="GatePilot API" org.opencontainers.image.version="1.0.0"
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --chown=node:node server.js seed.js ./
COPY --chown=node:node src ./src
COPY --chown=node:node middleware ./middleware
COPY --chown=node:node scripts ./scripts
USER node
EXPOSE 5000
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=6 CMD node -e "fetch('http://127.0.0.1:5000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
