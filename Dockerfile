FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/bin ./bin
COPY config/defaultConfig.json ./config/defaultConfig.json

RUN mkdir -p /app/data && chown -R node:node /app/data

USER node
EXPOSE 22002
CMD ["node", "bin/app.js"]