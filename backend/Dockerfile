FROM node:22-slim AS build
WORKDIR /app

# node:22-slim ships without OpenSSL. Prisma's `generate` step probes the OS for
# it to pick the matching query-engine binary — without it, generate silently
# defaults to the wrong engine, which then fails to load at runtime.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma
RUN npm install

COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist

RUN mkdir -p uploads
VOLUME ["/app/uploads"]

EXPOSE 4000
CMD ["node", "dist/src/index.js"]
