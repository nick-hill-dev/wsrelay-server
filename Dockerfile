FROM node:16 AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production
COPY bin/ ./bin
COPY config/defaultConfig.json ./config/config.json

FROM node:16-alpine
WORKDIR /usr/src/app
COPY --from=build /usr/src/app .
EXPOSE 22002
CMD [ "node", "bin/app.js" ]