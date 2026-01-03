FROM node:22-alpine AS build
WORKDIR /app

# Build deps for node-gyp
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/bin ./bin
COPY config/defaultConfig.json ./config/defaultConfig.json

RUN mkdir -p /app/data && chown -R node:node /app/data

USER node
EXPOSE 22002
CMD ["node", "bin/app.js"]