FROM node:22 AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:22-slim
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Install build tools
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /usr/src/app/bin ./bin
COPY config/defaultConfig.json ./config/defaultConfig.json

RUN chown -R node:node /usr/src/app
USER node
EXPOSE 22002
CMD [ "node", "bin/app.js" ]