# Nebius Serverless Endpoints-ready image (also runs anywhere).
FROM node:22-slim AS base
WORKDIR /app
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN corepack enable && pnpm install --frozen-lockfile || pnpm install
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start", "--", "-p", "3000"]
