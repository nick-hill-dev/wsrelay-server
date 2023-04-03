# WebSocket Relay Protocol

A WebSocket Relay server implements the WebSocket Relay protocol and allows communication between web browsers on different machines using WebSockets.

Communications are split into different channels, which are termed "realms".

A user can only be present in one realm at a time although some degree of cross-realm communication is possible.

All packets sent to and received from the WebSocket Relay server consist of one or two fragments, seperated by a space character. In splitting a packet, only the first space character is used. Subsequent space characters are included in the second fragment.

For example: `#3` is a single-fragment packet and `@1 Hello World` is a two-fragment packet consisting of `@1` for the first fragment and `Hello World` for the second.

## Packets that the server sends to web browsers

The messages you can receive from the WebSocket Relay server.

### #x - Assign user number

Each user who connects to the WebSocket Relay server is assigned a unique user number at the time of joining.

Format: `#x`

Parameter x: The user number assigned to the receiver of this message. Unique across the server.

Example: `#3` - You are assigned to be user number 3.

### ^x - Assign realm number

A notification to the receiver specifying which realm they are now a member of.

Format: `^x`

Parameter x: The realm number you have been assigned to.

Example: `^9`

### &x - Assign child realm number

Format: `&x`

Parameter x: The realm number you have been assigned to, which is a child realm of the realm you used to be in.

Example: `&9`

### = - Users present

Sent to users who join a realm to give them a list of users present in the realm at the time of joining.

Format: `=u`

Parameter u: A comma seperated list of user numbers, indicating the number of users present in the realm and what user numbers they have.

Example: `=1,2,3`

### + - User joined

A notification that a user has joined the realm.

Format: `+x`

Parameter x: The user number who has joined the realm.

Example: `+3`

### - - User left

A notification that a user has left the realm.

Format: `-x`

Parameter x: The user number who has left the realm.

Example: `-3`

### { - Child realm created

Sent to members of a realm to notify them that a child realm has been created.

This message is also sent to users that join the realm to notify them which child realms are present at the time of joining.

Format: `{x`

Parameter x: The number of the new child realm that has been created.

Example: `{4`

### } - Child realm destroyed

Sent to members of a realm to notify them that one of the child realms belonging to that realm has been destroyed.

Format: `}x`

Parameter x: The number of the child realm that has been destroyed.

Example: `}4`

### @ - Message sent to me

The sender of this message requested that the message be sent to you only. The message was not sent to anyone else.

Format: `@x m`

Parameter x: The number of the user who sent the message.

Parameter m: The rest of the packet. The message that was sent.

Example: `@3 Hello you!`

### ! - Message sent to everyone except sender

The sender of this message requested that the message be sent to everyone in the realm, and not echoed back to the sender.

Format: `!x m`

Parameter x: The number of the user who sent the message.

Parameter m: The rest of the packet. The message that was sent.

Example: `!3 Hello realm!`

### * - Message sent to all including to sender

The sender of this message requested that the message be sent to everyone, including the user who sent the message.

Format: `*x m`

Parameter x: The number of the user who sent the message.

Parameter m: The rest of the packet. The message that was sent.

Example: `*3 Hello everyone including me!`

### < - Realm data

A response to a request to retrieve data about a realm.

Format: `<e d` or `<r,e d`

Parameter r: The realm number the data is associated with, in the case that the sender's reealm is different to the realm the data has been assigned to.

Parameter e: The key, effectively the file name of the data.

Parameter d: The rest of the packet. The data.

Example: `<chips 10000`

Example: `<12,cards 12 32 7`

## Packets that web browsers can send to the server

The commands you can send to the WebSocket Relay server.

### ^x - Join realm number x

Used to change the user's realm.

Format: `^` or `^x`

Parameter x: The realm number to join. If omitted, creates a new realm.

Example: `^`

Example: `^5`

### &x - Join child realm number x

Used to change the user's realm. The target realm is a child realm of the user's current realm.

Users must be present in a realm in order to be able to join a child realm.

Format: `&` or `&x`

Parameter x: The child realm number to join. If omitted, creates a new child realm.

Example: `&`

Example: `&5`

### @x s - Send string s to user x

Send a message directly to a specific user.

Format: `@x s`

Parameter x: The user number of the user who should be sent the message.

Parameter s: The message to send to the user.

Example: `@4 Hello friend!`

### ! s - Send string s to all users except for me

Send a message to everyone in the current realm except for the person who sent the message.

Format: `! s`

Parameter s: The message to send.

Example: `! Hello everyone else!`

### * s - Send string s to all users including me

Send a message to everyone in the current realm including the person who sent the message.

Format: `* s`

Parameter s: The message to send.

Example: `* Hello everyone including me!`

### :x s - Send string s to all users in realm x

Send a message to every person in the specified realm.

Format: `:x s`

Parameter x: The number of the realm to send the message to.

Example: `:3 Hello realm 3!`

### >k s - Save realm data s using key k

Save key-value data on the server, associated with the user's current realm.

Format: `>k,t s` or `>k s` or `>k`

Parameter k: The key of the data. Effectively the file name for the data.

Parameter t: The amount of time, in seconds, to store the data on the server. If omitted, then the data is stored permanently.

Parameter s: The data to save. If not specified, then any existing data will be deleted.

Example: `>score 10000`

Example: `>score`

### <k - Retrieve realm data k

Retrieve key-value data that was previously saved on the server.

Format: `<k` or `<r,k`

Parameter r: The realm number containing the data. If omitted, uses the user's current realm.

Parameter k: The key of the data. Effectively the file name for the data to retrieve.

Example: `<score`

Example: `<4,score`

### $c - Execute command

Instructs the server to execute a command.

Format: `$c`

Parameter c: The command the server should execute, including parameters.

Example: `$setEmptyRealmLifetime 90`
