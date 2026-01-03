# WebSocket Relay Server

WebSocket Relay Server facilitates P2P-style communication between different browser users, without any WebRTC faff. It acts as an intermediatory relaying messages between users and can support scenarios such as online chat or multiplayer gaming.

Web pages that make use of a WebSocket Relay server must understand and transmit messages using the [WebSocket Relay protocol](PROTOCOL.md). The [WebSocket Relay Client library](https://github.com/nick-hill-dev/wsrelay-client) has been created to simplify communications to and from a WebSocket Relay server in your client applications without needing to have a deep understanding of the protocol.

## Quick Start

**Public Docker Container:**

Use the published container image in Docker Hub:

```bash
docker run -p 22002:22002 nicholashill/wsrelay:latest
```

Supply any number of environment variables to configure the server:

- `ACCEPTED_ORIGINS`, to override which origins to permit (I.E. https://whatever), defaults as `*` for all.
- `ACCEPTED_PROTOCOLS`: to override which websocket protocols to permit, defaults as `*` for all.

Alternatively, mount a volume with an alternative config.json file, and optionally mount a volume to persist data, as per the below example. See the "Configuration" section for more details.

```bash
docker run -p 22002:22002 \
    -v /var/dockerVolumes/wsrelay/config:/app/config \
    -v /var/dockerVolumes/wsrelay/data:/app/data \
    nicholashill/wsrelay:latest
```

**NPM:**

Run `npm install` then `npm start`.

**Private Docker Container:**

You can build a Docker container yourself from source:

```bash
npm install
docker build -t wsrelay:latest . # For Raspberry Pi add this parameter: --platform linux/arm64/v8
docker run -p 22002:22002 wsrelay:latest # If you want to run it now
```

See above for environment variables which can be set to configure without having to set up a volume for a bespoke configuration file.

---

## Features

- Allows web browsers on different machines to communicate with one another via the relay.
- Groups of people can be segregated into different groups, aka "realms".
- Can send messages to everyone in a realm, everyone in a realm except yourself, or to specific people currently residing within a realm.
- Receive notifications when people join or leave a realm.
- Receive notifications when child realms begin to exist or are deleted.
- Distinction between permanent realms and temporary realms.
- Can create or join child realms belonging to a parent realm, in a tree-like structure.
- Can save data to realms and load data from them.
- Supports automatic synchronisation of file data for all connected users, including experimental support for Fully Synchronised Entities (FSEs).
- Support for communication across different realms.
- Can authenticte with bearer tokens or simple unsecured identity.
- Support for binary commands.
- Can implement custom protocols on top of the basic WebSocket Relay protocol for highly customised applications.
- Can specify which specific origins to accept, or all.
- Can specify which specific websocket protocols to accept, or all.
- Can operate as a Docker container.
- Can run on a Raspberry Pi, as a Docker container or as a node application.

## Configuration

The service can be configured by creating a config file `config/config.json`. If this file does not exist WSRelay will load `config/defaultConfig.json` instead, which has been included in the package.

```jsonc
{
    "port": 22002, // The port number to listen on for incoming connections.
    "acceptedOrigins": [ // A list of strings describing which origins will be accepted.
        "http://127.0.0.1" // Another example: "https://my.website.com".
    ],
    "acceptedProtocols": [ // A list of strings describing which protocols will be accepted.
        "*" // This accepts all protocols.
    ],
    "publicRealmCount": 65536, // The number of reserved realms, where data is not deleted, and temporary realm IDs are above this number.
    "entityPath": "./data", // Storage location for data entities clients ask to save on the server, I.E. game state etc.
    "fsePath": "./data", // Storage location for Fully Synchronised Entities. Defaults to the value of "entityPath".
    "fseMaxSize": 131072, // The maximum size of a FSE. Defaults to 131072 (128KB).
    "logIncoming": false, // Indicates whether or not to write messages to the console based on what messages the server has received.
    "logOutgoing": false, // Indicates whether or not to write messages to the console based on what messages the server has sent.
    "jwt": { /* ... */ } // Optional, if you want JWT authentication (experimental and not used very much)
}
```

See `JWT.md` for JWT configuration options.

## Example Usage

See [demo/index.html](demo/index.html) for an example on directly calling the server, without support of the [WebSocket Relay Client library](https://github.com/nick-hill-dev/wsrelay-client). Use cases like this require comprehensive understanding of the [protocol](PROTOCOL.md).

## Secure WebSocket

There is no direct support for the wss:// protocol at present but it is possible to set up a proxy to transform wss traffic into ws traffic. Example below describes what changes need to be made to an existing SSL host in the apache2 configuration file:

```xml
<VirtualHost *:443>
    ...
    ProxyPass "/wsrelay" "ws://example.com:12345/wsrelay"
    ...
</VirtualHost>
```

## Version History

- **2.0**: Initial release.
- **2.1**: Support for a binary version of the WSRelay protocol as well as support for Fully Synchronised Entities.
- **2.2**: Support for persisted child realms, some small improvements, some critical bug fixes and publish first image to Docker.

## C# Version (2019)

The original version of WebSocket Relay server was created many years ago and originally published as a part of the "Social Poker" solution [released in 2019](https://github.com/nick-hill-dev/social-poker) (under the `Application Server/WSRelay/(mono)` folder). This repository is a complete rewrite of that C# version in order to improve stability and make it simpler to use and configure. This version of the WebSocket Relay server retains 100% compatibility with the original.

## License

The WebSocket Relay server was written by Nick Hill and is released under the MIT license. See LICENSE for more information.