'use strict';

import './IConfig';
import RelayManager from './RelayManager';
import { connection, request, server as WSServer } from 'websocket';

let WebSocketServer = require('websocket').server;
let http = require('http');

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
    if (config.acceptedOrigins.indexOf('*') !== -1) {
        console.warn('WARNING: Server accepts all origins. This is a security risk!');
        console.log();
    }
});

let wsServer: WSServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

wsServer.on('request', (request) => {

    // Check the connection request fits the security criteria defined in the config file
    if (!checkRequest(request)) {
        request.reject();
        return;
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
                manager.handleUtf8Message(userId, message.utf8Data);
            } else if (message.type === 'binary') {
                manager.handleBinaryMessage(userId, message.binaryData);
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

function checkRequest(request: request): boolean {

    let checkAddress = '?';
    if (config.acceptedOrigins.indexOf('*') === -1) {

        // Confirm origin is valid
        let url: URL = null;
        try {
            url = new URL(request.origin);
        } catch {
            console.log(`[Connect] Rejected connection due to invalid origin URL: ${request.origin}`);
            return false;
        }

        // Confirm the origin is permitted
        checkAddress = `${url.protocol}//${url.hostname}`;
        if (config.acceptedOrigins.indexOf(checkAddress) === -1) {
            console.log(`[Connect] Rejected connection from non-permitted origin: ${checkAddress}`);
            return false;
        }

    }

    // At least one protocol must be specified
    if (request.requestedProtocols.length === 0) {
        console.log(`[Connect] Rejected connection due to not asking for any protocols: ${checkAddress}`);
        return false;
    }

    // Confirm all the requested protocols are permitted
    for (let requestedProcotol of request.requestedProtocols) {
        if (config.acceptedProtocols.indexOf('*') === -1 && config.acceptedProtocols.indexOf(requestedProcotol) === -1) {
            console.log(`[Connect] Rejected connection from non-permitted protocol: ${checkAddress}`);
            return false;
        }
    }

    return true;
}
