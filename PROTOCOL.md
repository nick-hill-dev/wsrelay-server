# WebSocket Relay Protocol

A WebSocket Relay server implements the WebSocket Relay protocol and allows communication between web browsers on different machines using WebSockets.

Communications are split into different channels, which are termed "realms". A user can only be present in one realm at a time.

Users can only communicate with each other if they are in the same realm, though some degree of cross-realm communication is possible.

## Basic protocol format

The basic format of a message is `x` or `x y` (where `y` can contain spaces).

All packets sent to and received from the WebSocket Relay server consist of one or two fragments, seperated by a space character. In splitting a packet, only the first space character is used. Subsequent space characters are included in the second fragment.

For example: `#3` is a single-fragment packet and `@1 Hello World` is a two-fragment packet consisting of `@1` for the first fragment and `Hello World` for the second.

The first fragment of a packet might contain multiple pieces of information. In this case the first character is the "command" and anything else afterwards is information relating to that command. Sometimes this information contains multiple parts, each seperated by a comma.

For example, `<12,cards 12 32 7` is one of the most complex packets that might be encountered. In this case, it describes data named `cards` from realm `12` and the value of the data is  `12 32 7`. It can be broken down as follows:

- The command `<` indicating that the server is telling us about some data previously saved to a realm by someone.
- The two-part data fragment `12,cards` which associates the parameter values `12` and `cards` with the command (in this case, realm `12` and data name `cards`).
- The rest, `12 32 7`, which in this case describes the cards that have been revealed (cards 12, 32 and 7).

## Packets that the server sends to web browsers

The messages you can receive from the WebSocket Relay server are as follows.

### `#x` - Assigned user number

Each user who connects to the WebSocket Relay server is assigned a unique user number by the server from the time of joining.

Format: `#x`

- Parameter `x`: The user number assigned to the receiver of this message. Unique across the server.

Example: `#3` - You are assigned to be user number 3.

### `^x` - Assigned realm number

A notification to the receiver specifying which realm they are now a member of.

Format: `^x`

- Parameter `x`: The realm number you have been assigned to.

Example: `^9` - You are now in realm number 9.

### `&x` - Assigned child realm number

Format: `&x`

- Parameter `x`: The realm number you have been assigned to, which is a child realm of the realm you used to be in.

Example: `&9` - You are not in child realm number 9.

### `=` - Users present

Sent to users who join a realm to give them a list of users present in the realm at the time of joining.

Format: `=u`

- Parameter `u`: A comma seperated list of user numbers, indicating the number of users present in the realm and what user numbers they have.

Example: `=2,4,6` - There are three users in this realm, user number 2, user number 4 and user number 6.

### `+` - User joined

A notification that a user has joined the realm.

Format: `+x`

- Parameter `x`: The user number who has joined the realm.

Example: `+3` - User number 3 has joined this realm.

### `-` - User left

A notification that a user has left the realm.

Format: `-x`

- Parameter `x`: The user number who has left the realm.

Example: `-3` - User number 3 has left this realm.

### `{` - Child realm created

Sent to members of a realm to notify them that a child realm has been created.

This message is also sent to users that join the realm to notify them which child realms are present at the time of joining.

Format: `{x`

- Parameter `x`: The number of the new child realm that has been created.

Example: `{4` - A new child realm of this realm has begun to exist, realm number 4.

### `}` - Child realm destroyed

Sent to members of a realm to notify them that one of the child realms belonging to that realm has been destroyed.

Format: `}x`

- Parameter `x`: The number of the child realm that has been destroyed.

Example: `}4` - The child realm numbered 4 has ceased to exist, and is no longer a child realm of this realm.

### `@` - Message sent to me

The sender of this message requested that the message be sent to you only. The message was not sent to anyone else.

Format: `@x m`

- Parameter `x`: The number of the user who sent the message.
- Parameter `m`: The rest of the packet. The message that was sent.

Example: `@3 Hello you!` - User number 3 sent you a message "Hello you!".

### `!` - Message sent to everyone except sender

The sender of this message requested that the message be sent to everyone in the realm, and not echoed back to the sender.

Format: `!x m`

- Parameter `x`: The number of the user who sent the message.
- Parameter `m`: The rest of the packet. The message that was sent.

Example: `!3 Hello realm!` - User number 3 sent everyone in this realm except themselves the message "Hello realm!".

### `*` - Message sent to all including to sender

The sender of this message requested that the message be sent to everyone, including the user who sent the message.

Format: `*x m`

- Parameter `x`: The number of the user who sent the message.
- Parameter `m`: The rest of the packet. The message that was sent.

Example: `*3 Hello everyone including me!` - User number 3 sent everyone in the realm (including themselves) the message "Hello everyone including me!".

### `<` - Realm data

A response to a request to retrieve data about a realm.

Format: `<e d` or `<r,e d`

- Parameter `r`: The realm number the data is associated with, in the case that the sender's realm is different to the realm the data has been assigned to.
- Parameter `e`: The key, effectively the file name of the data.
- Parameter `d`: The rest of the packet. The data.

Example: `<chips 10000` - There is data called "chips" whose value is "10000".

Example: `<12,cards 12 32 7` - There is data from realm 12 called "cards" whose value is "12 32 7".

## Packets that web browsers can send to the server

The commands that can be sent to a WebSocket Relay server are as follows.

### `~t v` - Identify

Identify yourself using a name or a JWT token. Identification is generally optional.

Format: `~t v`

- Parameter: `t`: The type. Either `name` or `jwt`.
- Parameter: `v`: The value, either the name (for `name` type) or a JWT token (for `jwt` type).

Example: `~name Nick` - Identify as Nick.

Example: `~jwt eyJhbGci...` - Identify via JWT.

### `^x` - Join realm number x

Used to change the user's realm.

Format: `^` or `^x`

- Parameter `x`: The realm number to join. If omitted, creates a new realm.

Example: `^` - Join any free realm (server will advise which realm was joined).

Example: `^5` - Join realm 5.

### `&x` - Join child realm number x

Used to change the user's realm. The target realm is a child realm of the user's current realm.

Users must be present in a realm in order to be able to join a child realm.

Format: `&` or `&x`

- Parameter `x`: The child realm number to join. If omitted, creates a new child realm.

Example: `&` - Create a new child realm and join it.

Example: `&5` - Join realm 5 as a child realm of this realm.

### `@x s` - Send string s to user x

Send a message directly to a specific user.

Format: `@x s`

- Parameter `x`: The user number of the user who should be sent the message.
- Parameter `s`: The message to send to the user.

Example: `@4 Hello friend!` - Send "Hello friend!" to user 4.

### `! s` - Send string s to all users except for me

Send a message to everyone in the current realm except for the person who sent the message.

Format: `! s`

- Parameter `s`: The message to send.

Example: `! Hello everyone else!` - Send message "Hello everyone else" to everyone in this realm but do not send it to myself.

### `* s` - Send string s to all users including me

Send a message to everyone in the current realm including the person who sent the message.

Format: `* s`

- Parameter `s`: The message to send.

Example: `* Hello everyone including me!` - Send message "Hello everyone including me!" to everyone, including me.

### `:x s` - Send string s to first (or all) user(s) in realm x

Send a message to every person in the specified realm.

Format: `:x,n s`

- Parameter `x`: The number of the realm to send the message to.
- Parameter `n`: Optional. If `*`, sends to all users in realm. If absent (or `@`), sends to first user in realm.

Example: `:3 Hello realm 3!` - Send message "Hello realm 3!" to first person currently in realm 3.

Example: `:3,* Hello realm 3!` - Send message "Hello realm 3!" to everyone currently in realm 3.

### `>k s` - Save realm data s using key k

Save key-value data on the server, associated with the user's current realm. Can also be used to delete data.

Format: `>k,t s` or `>k s` or `>k`

- Parameter `k`: The key of the data. Effectively the file name for the data.
- Parameter `t`: The amount of time, in seconds, to store the data on the server. If omitted, then the data is stored permanently.
- Parameter `s`: The data to save. If not specified, then any existing data will be deleted.

Example: `>score 10000` - Save data "10000" to a file called "score".
Example: `>score` - Delete data "score".
Example: `>score,10 10000` - Save data "10000" to a file called "score", and delete it automatically after 10 seconds.

### `<k` - Retrieve realm data k

Retrieve key-value data that was previously saved on the server.

Format: `<k` or `<r,k`

- Parameter `r`: The realm number containing the data. If omitted, uses the user's current realm.
- Parameter `k`: The key of the data. Effectively the file name for the data to retrieve.

Example: `<score` - Retrieve current value of data file "score" that is saved to the current realm.
Example: `<4,score` - Retrieve current value of data file "score" saved in realm 4.