'use strict';

let WebSocketServer = require('websocket').server;
import { connection, server as WSServer } from 'websocket';
let http = require('http');

import './IConfig';
import RelayManager from './RelayManager';

const fs = require('fs');
let configText = fs.readFileSync('config.json');
let config = <IConfig>JSON.parse(configText);

if (!fs.existsSync(config.entityPath)) {
    fs.mkdirSync(config.entityPath);
}

let manager = new RelayManager(config);

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

    // Accept the connection
    let connection: connection = null;
    let userId: number = -1;
    let registered: boolean;
    try {
        connection = request.accept(request.requestedProtocols[0], request.origin);
        userId = manager.registerUser(connection);
        registered = true;
        connection.sendUTF(`#${userId}`);
        console.log(`[${userId}|Connect] ${request.origin}`);
    } catch (e) {
        console.error(`[Error] {Accepting Connection} ${e}`);
        if (registered) {
            try {
                manager.unregisterUser(userId);
            } catch (f) {
                console.error(`[Error] {Unregistering User} ${e}`);
            }
        }
        return;
    }

    // Handle messages
    connection.on('message', message => {
        try {
            if (message.type === 'utf8') {
                manager.handleMessage(userId, message.utf8Data);
            } else if (message.type === 'binary') {
                console.log(`[${userId}|Binary|In] (${message.binaryData.length} bytes.`);
            }
        } catch (e) {
            console.error(`[Error] {Handling Message} ${e}`);
        }
    });

    // Handle closing connection
    connection.on('close', (reasonCode, description) => {
        try {
            manager.unregisterUser(userId);
            console.log(`[${userId}|Disconnect] ${connection.remoteAddress} ${reasonCode}: ${description}`);
        } catch (e) {
            console.error(`[Error] {Accepting Disconnection} ${e}`);
        }
    });

});