import { connection } from "websocket";
import RelayRealm from "./RelayRealm";
import RelayUser from "./RelayUser";
import EntityManager from "./Entities/EntityManager";
import { BinaryPacketWriter } from "./BinaryPacketWriter";
import { BinaryPacketReader } from "./BinaryPacketReader";
import FseManager from "./Entities/FseManager";
import { binaryServerCommandNames } from "./BinaryCommandServer";
import { binaryClientCommandNames, binaryClientCommandNumbers } from "./BinaryCommandClient";

export default class RelayManager {

    public readonly users: RelayUser[] = [];

    private readonly availableUserIds: number[] = [];

    public readonly realms: RelayRealm[] = [];

    private readonly availableRealmIds: number[] = [];

    private nextRealmId: number = 0;

    private readonly entityManager: EntityManager = null;

    private readonly fseManager: FseManager = null;

    public constructor(public readonly config: IConfig) {
        this.nextRealmId = config.publicRealmCount;
        this.entityManager = new EntityManager(config.entityPath);
        this.fseManager = new FseManager(config.entityPath);
    }

    public registerUser(connection: connection): number {
        let userId = this.users.length;
        if (this.availableUserIds.length > 0) {
            userId = this.availableUserIds.shift();
            this.availableUserIds.sort();
        }
        let user = new RelayUser(userId, connection);
        this.users[userId] = user;
        return userId;
    }

    public unregisterUser(userId: number): void {
        let user = this.users[userId];
        if (!user) {
            return;
        }
        this.changeRealm(user, -1, false);
        this.availableUserIds.push(userId);
        this.users[userId] = undefined;
    }

    public handleUtf8Message(userId: number, packet: string): void {
        const user = this.users[userId];
        if (!user) {
            return;
        }

        const realmId = user.realm ? user.realm.id : -1;
        if (this.config.logIncoming) {
            console.log(`[${userId}:${realmId === -1 ? '?' : realmId}|UTF8|In] ${packet}`);
        }

        const spaceIndex = packet.indexOf(' ');
        const command = spaceIndex === -1 ? packet : packet.substring(0, spaceIndex);
        const message = spaceIndex === -1 ? '' : packet.substring(spaceIndex + 1);

        if (command.length === 0) {
            return;
        }

        switch (command[0]) {
            case '^':
                let realmNumberDirect = parseInt(command.substring(1));
                this.handleUtf8JoinRealmDirectCommand(user, isNaN(realmNumberDirect) ? -1 : realmNumberDirect);
                break;

            case '&':
                let realmNumberChild = parseInt(command.substring(1));
                this.handleUtf8JoinRealmChildCommand(user, isNaN(realmNumberChild) ? -1 : realmNumberChild);
                break;

            case '*':
                this.handleUtf8SendToAllCommand(user, message);
                break;

            case '!':
                this.handleUtf8SendToAllExceptMeCommand(user, message);
                break;

            case '@':
                let targetUserId = parseInt(command.substring(1));
                let targetUser = this.users[targetUserId];
                if (targetUser) {
                    this.handleUtf8SendToUserCommand(user, targetUser, message);
                }
                break;

            case ':':
                let targetRealmId = parseInt(command.substring(1));
                let targetRealm = this.realms[targetRealmId];
                if (targetRealm) {
                    this.handleUtf8SendToRealmCommand(user, targetRealm, message);
                }
                break;

            case '<':
                let loadDataFragment = command.substring(1);
                if (loadDataFragment.length > 0) {
                    let loadDataCommaIndex = loadDataFragment?.indexOf(',') ?? -1;
                    let loadDataRealmId = loadDataCommaIndex === -1 ? -1 : parseInt(loadDataFragment.substring(0, loadDataCommaIndex));
                    let loadDataEntityName = loadDataCommaIndex === -1 ? loadDataFragment : loadDataFragment.substring(loadDataCommaIndex + 1);
                    this.handleUtf8LoadDataCommand(user, loadDataRealmId, loadDataEntityName);
                }
                break;

            case '>':
                let saveDataFragment = command.substring(1);
                if (saveDataFragment.length > 0) {
                    let saveDataCommaIndex = saveDataFragment?.indexOf(',') ?? -1;
                    let saveDataEntityName = saveDataCommaIndex === -1 ? saveDataFragment : saveDataFragment.substring(0, saveDataCommaIndex);
                    let saveDataExpireTime = saveDataCommaIndex === -1 ? 0 : parseInt(saveDataFragment.substring(saveDataCommaIndex + 1));
                    this.handleUtf8SaveDataCommand(user, saveDataEntityName, saveDataExpireTime, message);
                }
                break;
        }
    }

    public handleBinaryMessage(userId: number, packet: Buffer): void {
        if (packet.length < 1) {
            return;
        }

        const user = this.users[userId];
        if (!user) {
            return;
        }

        const realmId = user.realm ? user.realm.id : -1;
        const reader = new BinaryPacketReader(packet);
        const command = reader.readByte();
        const commandName = binaryServerCommandNames.get(command) ?? command;
        if (this.config.logIncoming) {
            console.log(`[${userId}:${realmId === -1 ? '?' : realmId}|Binary|In] ${commandName} (${packet.length - 1} bytes)`);
        }

        switch (commandName) {
            case 'fseListen':
                const fseListenEntityName = reader.readString();
                this.handleBinFseListenCommand(user, fseListenEntityName);
                break;

            case 'fseUnlisten':
                const fseUnlistenEntityName = reader.readString();
                this.handleBinFseUnlistenCommand(user, fseListenEntityName);
                break;

            case 'fseSet':
            case 'fseSetIncludeMe':
                const fseSetEntityName = reader.readString();
                const fseSetBytes = reader.readBuffer();
                this.handleBinFseSetCommand(user, fseSetEntityName, fseSetBytes, commandName === 'fseSetIncludeMe');
                break;

            case 'fseUpdate':
            case 'fseUpdateIncludeMe':
                const fseUpdateName = reader.readString();
                const fseUpdateStart = reader.readUint32();
                const fseUpdateData = reader.readBuffer();
                this.handleBinFseUpdateCommand(user, fseUpdateName, fseUpdateStart, fseUpdateData, commandName === 'fseUpdateIncludeMe');
                break;
        }
    }

    private handleUtf8JoinRealmDirectCommand(senderUser: RelayUser, realmId: number) {
        if (realmId === -1) {
            realmId = this.availableRealmIds.length > 0 ? this.availableRealmIds.shift() : this.nextRealmId++;
        }
        this.changeRealm(senderUser, realmId, false);
    }

    private handleUtf8JoinRealmChildCommand(senderUser: RelayUser, realmId: number) {
        if (realmId === -1) {
            realmId = this.availableRealmIds.length > 0 ? this.availableRealmIds.shift() : this.nextRealmId++;
        }
        this.changeRealm(senderUser, realmId, true);
    }

    private handleUtf8SendToAllCommand(senderUser: RelayUser, message: string): void {
        if (senderUser.realm === null) {
            return;
        }
        for (let realmUser of senderUser.realm.users) {
            this.sendUtf8(realmUser, `*${senderUser.id} ${message}`);
        }
    }

    private handleUtf8SendToAllExceptMeCommand(senderUser: RelayUser, message: string): void {
        if (senderUser.realm === null) {
            return;
        }
        for (let realmUser of senderUser.realm.users) {
            if (realmUser.id !== senderUser.id) {
                this.sendUtf8(realmUser, `!${senderUser.id} ${message}`);
            }
        }
    }

    private handleUtf8SendToUserCommand(senderUser: RelayUser, targetUser: RelayUser, message: string): void {
        if (senderUser.realm === null) {
            return;
        }
        this.sendUtf8(targetUser, `@${senderUser.id} ${message}`);
    }

    private handleUtf8SendToRealmCommand(senderUser: RelayUser, targetRealm: RelayRealm, message: string): void {
        if (senderUser.realm === null || targetRealm.users.length === 0) {
            return;
        }
        let targetUser = targetRealm.users[0];
        this.sendUtf8(targetUser, `@${senderUser.id} ${message}`);
    }

    private handleUtf8LoadDataCommand(senderUser: RelayUser, realmId: number, entityName: string): void {
        if (senderUser.realm === null) {
            return;
        }
        if (realmId === -1) {
            realmId = senderUser.realm.id;
        }
        let fragment = realmId === senderUser.realm.id ? entityName : realmId + ',' + entityName;
        let data = this.entityManager.loadData(realmId, entityName);
        if (data === '') {
            this.sendUtf8(senderUser, `<${fragment}`);
        } else {
            this.sendUtf8(senderUser, `<${fragment} ${data}`);
        }
    }

    private handleUtf8SaveDataCommand(senderUser: RelayUser, entityName: string, time: number, data: string): void {
        if (senderUser.realm === null) {
            return;
        }
        this.entityManager.saveData(senderUser.realm.id, entityName, time, data);
    }

    private handleBinFseListenCommand(senderUser: RelayUser, entityName: string): void {
        if (senderUser.realm === null) {
            return;
        }
        let data = this.fseManager.loadData(senderUser.realm.id, entityName);

        const packet = new BinaryPacketWriter();
        packet.writeByte(binaryClientCommandNumbers.get('fseData'));
        packet.writeString(entityName);
        packet.writeBuffer(data);
        this.sendBinary(senderUser, packet.toBuffer());

        // TODO: All future updates to the file need to be sent to this user
    }

    private handleBinFseUnlistenCommand(senderUser: RelayUser, entityName: string): void {
        if (senderUser.realm === null) {
            return;
        }

        // TODO: This needs to be implemented

        // TODO: On exit realm or disconnect, ensure user unlistens to everything in the realm they were in
    }

    private handleBinFseSetCommand(senderUser: RelayUser, entityName: string, data: Buffer, includeSender: boolean): void {
        if (senderUser.realm === null) {
            return;
        }
        this.fseManager.saveData(senderUser.realm.id, entityName, data);

        // TODO: Pass updates to all other people who are listening to this file
    }

    private handleBinFseUpdateCommand(senderUser: RelayUser, name: string, start: number, data: Buffer, includeSender: boolean): void {
        if (senderUser.realm === null) {
            return;
        }

        this.fseManager.updateData(senderUser.realm.id, name, start, data);

        const packet = new BinaryPacketWriter();
        packet.writeByte(binaryClientCommandNumbers.get('fseUpdate'));
        packet.writeUint32(senderUser.id);
        packet.writeString(name);
        packet.writeUint32(start);
        packet.writeBuffer(data);
        const packetAsBuffer = packet.toBuffer();

        // TODO: Send updates only to those who are listening to changes to the file
        for (let realmUser of senderUser.realm.users) {
            if (includeSender || realmUser.id !== senderUser.id) {
                this.sendBinary(realmUser, packetAsBuffer);
            }
        }
    }

    /**
     * @param targetRealmId The target realm number, or -1 to leave a realm.
     * @param createChildRealm Indicates whether a request has been made to join a child realm (note targetRealmId will not be -1 in this case).
     */
    private changeRealm(user: RelayUser, targetRealmId: number, createChildRealm: boolean) {

        // Don't do anything if the user is staying in the same realm
        let becomingRealmless = targetRealmId === -1;
        if ((user.realm === null && becomingRealmless) || (user.realm !== null && user.realm.id === targetRealmId)) {
            return;
        }

        // Child realms can only be created if user is currently in a realm
        let oldRealm = user.realm;
        if (oldRealm === null && createChildRealm) {
            createChildRealm = false;
        }

        // Remove user from the old realm, informing everyone that the user has left it
        if (oldRealm !== null) {
            oldRealm.users.splice(oldRealm.users.indexOf(user), 1);
            user.realm = null;
            for (let realmUser of oldRealm.users) {
                this.sendUtf8(realmUser, `-${user.id}`);
            }
        }

        // Get the target realm, creating it if necessary
        let newRealm: RelayRealm = null;
        let creatingOrJoiningRealm = targetRealmId !== -1;
        if (creatingOrJoiningRealm) {
            newRealm = this.realms[targetRealmId];
            if (!newRealm) {
                let parentRealm = createChildRealm ? oldRealm : null;
                newRealm = new RelayRealm(parentRealm, targetRealmId);
                this.realms[targetRealmId] = newRealm;
                if (parentRealm !== null) {
                    parentRealm.childRealms.push(newRealm);
                }
            }

            // Add the user to the new realm
            newRealm.users.push(user);
            user.realm = newRealm;

            // Advise user that the new realm has been joined successfully
            this.sendUtf8(user, `${createChildRealm ? "&" : "^"}${targetRealmId}`);

            // Advise user of all child realms already existing in the new realm
            for (let realm of newRealm.childRealms) {
                this.sendUtf8(user, `{${realm.id}`);
            }

            // Advise user of all other users already connected to that realm
            let otherRealmUsers = newRealm.users.filter(u => u !== user);
            this.sendUtf8(user, `=${otherRealmUsers.map(u => u.id).join(',')}`);

            // Advise everyone in the target realm that user has joined
            for (let realmUser of otherRealmUsers) {
                this.sendUtf8(realmUser, `+${user.id}`);
            }
        }

        // Advise everyone in the old realm that there is a new child realm
        if (createChildRealm) {
            for (let realmUser of oldRealm.users) {
                this.sendUtf8(realmUser, `{${newRealm.id}`);
            }
        }

        // If there aren't any more users or child realms in the old realm then recursively destroy the old realm(s)
        let currentRealm = oldRealm;
        while (!createChildRealm && currentRealm !== null && currentRealm.users.length === 0 && currentRealm.childRealms.length === 0) {

            // Remove the realm from the parent's child list
            if (currentRealm.parentRealm !== null) {
                currentRealm.parentRealm.childRealms.splice(currentRealm.parentRealm.childRealms.indexOf(currentRealm), 1);

                // Advise users of the parent realm that the child realm has been destroyed
                for (let realmUser of currentRealm.parentRealm.users) {
                    this.sendUtf8(realmUser, `}${currentRealm.id}`);
                }
            }

            // Remove realm data
            if (currentRealm.id >= this.config.publicRealmCount) {
                this.entityManager.deleteData(currentRealm.id);
                this.fseManager.deleteData(currentRealm.id);
            }

            // Remove the realm from the list
            if (currentRealm.id >= this.config.publicRealmCount) {
                this.availableRealmIds.push(currentRealm.id);
            }
            this.availableRealmIds.splice(this.availableRealmIds.indexOf(currentRealm.id), 1);

            // Move on to checking parent realm
            currentRealm = currentRealm.parentRealm;
        }
    }

    private sendUtf8(user: RelayUser, packet: string) {
        if (this.config.logOutgoing) {
            console.log(`[${user.id}|Out] ${packet}`);
        }
        user.connection.sendUTF(packet);
    }

    private sendBinary(user: RelayUser, packet: Buffer) {
        if (this.config.logOutgoing) {
            const command = packet?.[0] ?? -1;
            const commandName = binaryClientCommandNames.get(command) ?? command;
            console.log(`[${user.id}|Out] ${commandName} (${packet.length - 1} bytes)`);
        }
        user.connection.sendBytes(packet);
    }

}