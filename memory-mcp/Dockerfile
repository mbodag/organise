FROM node:22-slim
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build && npm prune --omit=dev
ENV MEMORY_DIR=/data/memory PORT=8787
RUN git config --global user.name "memory-bot" && git config --global user.email "memory-bot@users.noreply.github.com"
EXPOSE 8787
CMD ["node", "dist/index.js"]
