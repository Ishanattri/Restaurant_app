FROM node:22-slim AS build
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm install

COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist

RUN mkdir -p uploads
VOLUME ["/app/uploads"]

EXPOSE 4000
CMD ["node", "dist/src/index.js"]
