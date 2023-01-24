'use strict';

let WebSocketServer = require('websocket').server;
import { server as WSServer } from 'websocket';
let http = require('http');

const fs = require('fs');

import './IConfig';
import RelayUser from './RelayUser';
import RelayRealm from './RelayRealm';

let configText = fs.readFileSync('config.json');
let config = <IConfig>JSON.parse(configText);

let server = http.createServer((request: any, response: any) => {
    console.log(`Received request for: ${request.url}`);
    response.writeHead(404);
    response.end();
});

server.listen(config.port, () => {
    console.log('WebSocket Relay Server. Version 2.0 written by Nicholas Hill.');
    console.log('Connections will be accepted from the following origins: ' + config.acceptedOrigins.join(', '));
    console.log('Connections will be accepted for the following protocols: ' + config.acceptedProtocols.join(', '));
    console.log(`Listening on port ${config.port}.`);
    console.log();
});

let wsServer: WSServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

let users: RelayUser[] = [];

let availableUserIds: number[] = [];

let realms: RelayRealm[] = [];

let availableRealmIds: number[] = [];

wsServer.on('request', (request) => {

    // Confirm the origin is permitted
    let url = new URL(request.origin);
    let checkAddress = `${url.protocol}//${url.hostname}`;
    if (config.acceptedOrigins.indexOf(checkAddress) === -1) {
        request.reject();
        console.log(`[Connect] Rejected connection from non-permitted origin: ${checkAddress}`);
        return;
    }

    // At least one protocol must be specified
    if (request.requestedProtocols.length === 0) {
        request.reject();
        console.log(`[Connect] Rejected connection due to not asking for any protocols: ${checkAddress}`);
        return;
    }

    // Confirm all the requested protocols are permitted
    for (let requestedProcotol of request.requestedProtocols) {
        if (config.acceptedProtocols.indexOf('*') === -1 && config.acceptedProtocols.indexOf(requestedProcotol) === -1) {
            request.reject();
            console.log(`[Connect] Rejected connection from non-permitted protocol: ${checkAddress}`);
            return;
        }
    }

    let connection = request.accept(request.requestedProtocols[0], request.origin);
    let id = users.length;
    if (availableUserIds.length > 0) {
        id = availableUserIds.shift();
        availableUserIds.sort();
    }
    let user = new RelayUser(id, request.remoteAddress);
    users[id] = user;
    connection.sendUTF(`#${id}`);
    console.log(`[${user.id}|Connect] ${request.origin}`);

    connection.on('message', (message: any) => {
        if (message.type === 'utf8') {
            console.log(`[${user.id}|Message|In] ${message.utf8Data}`);
            connection.sendUTF(message.utf8Data);
        } else if (message.type === 'binary') {
            console.log(`[${user.id}|Binary|In] (${message.binaryData.length} bytes.`);
            connection.sendBytes(message.binaryData);
        }
    });

    connection.on('close', (reasonCode: any, description: any) => {
        availableUserIds.push(user.id);
        users[user.id] = undefined;
        console.log(`[${user.id}|Disconnect] ${connection.remoteAddress} ${reasonCode}: ${description}`);
    });

});