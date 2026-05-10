FROM node:20-alpine AS builder

WORKDIR /app

COPY app/package.json app/.npmrc* ./
RUN npm install --frozen-lockfile

COPY app/ .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000

COPY --from=builder /app/.output ./

EXPOSE 3000

CMD ["node", "server/index.mjs"]
