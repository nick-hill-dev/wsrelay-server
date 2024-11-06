import { connection } from "websocket";
import RelayRealm from "./RelayRealm";
import RelayUser from "./RelayUser";
import EntityManager from "./Entities/EntityManager";
import { BinaryPacketReader } from "./BinaryPacketReader";
import FseManager from "./Entities/FseManager";
import { BinaryServerCommandNames, BinaryServerCommandNumber } from "./BinaryServerCommandName";
import { BinaryClientCommandNames, BinaryClientCommandNumber } from "./BinaryClientCommandName";
import { IUtf8Operation } from "./Operations/IUtf8Operation";
import { JoinRealmOperation } from "./Operations/JoinRealmOperation";
import { IRelayManager } from "./IRelayManager";
import { SendToAllOperation } from "./Operations/SendToAllOperation";
import { SendToUserOperation } from "./Operations/SendToUserOperation";
import { SendToRealmOperation } from "./Operations/SendToRealmOperation";
import { IdentifyOperation } from "./Operations/IdentifyOperation";
import { LoadDataOperation } from "./Operations/LoadDataOperation";
import { SaveDataOperation } from "./Operations/SaveDataOperation";
import { IBinaryOperation } from "./Operations/IBinaryOperation";
import { FseListenOperation } from "./Operations/FseListenOperation";
import { FseUnlistenOperation } from "./Operations/FseUnlistenOperation";
import { FseSetOperation } from "./Operations/FseSetOperation";
import { FseUpdateOperation } from "./Operations/FseUpdateOperation";
import { NewRealmOption } from "./NewRealmOption";

export default class RelayManager implements IRelayManager {

    public readonly users: RelayUser[] = [];

    private readonly availableUserIds: number[] = [];

    public readonly realms: RelayRealm[] = [];

    private readonly availableRealmIds: number[] = [];

    private nextRealmId: number = 0;

    private readonly entityManager: EntityManager = null;

    private readonly fseManager: FseManager = null;

    public constructor(private readonly config: IConfig) {
        this.nextRealmId = config.publicRealmCount;
        this.entityManager = new EntityManager(config.entityPath);
        this.fseManager = new FseManager(config.fsePath, config.fseMaxSize ?? 131072);
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
        this.changeRealm(user, -1, 'standard');
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
            console.log(`[${user.name ?? userId}:${realmId === -1 ? '?' : realmId}|UTF8|In] ${packet}`);
        }

        const spaceIndex = packet.indexOf(' ');
        const command = spaceIndex === -1 ? packet : packet.substring(0, spaceIndex);
        const message = spaceIndex === -1 ? '' : packet.substring(spaceIndex + 1);

        if (command.length === 0) {
            return;
        }

        switch (command[0]) {
            case '^':
            case '&':
                this.executeUtf8Operation(user, JoinRealmOperation, command, message);
                break;

            case '~':
                this.executeUtf8Operation(user, IdentifyOperation, command, message);
                break;

            case '*':
            case '!':
                this.executeUtf8Operation(user, SendToAllOperation, command, message);
                break;

            case '@':
                this.executeUtf8Operation(user, SendToUserOperation, command, message);
                break;

            case ':':
                this.executeUtf8Operation(user, SendToRealmOperation, command, message);
                break;

            case '<':
                this.executeUtf8Operation(user, LoadDataOperation, command, message);
                break;

            case '>':
                this.executeUtf8Operation(user, SaveDataOperation, command, message);
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
        const command = <BinaryServerCommandNumber>reader.readByte();
        const commandName = BinaryServerCommandNames.get(command);
        if (!commandName) {
            return;
        }

        if (this.config.logIncoming) {
            console.log(`[${user.name ?? userId}:${realmId === -1 ? '?' : realmId}|Binary|In] ${commandName} (${packet.length - 1} bytes)`);
        }

        switch (commandName) {
            case 'fseListen':
                this.executeBinaryOperation(user, FseListenOperation, command, reader);
                break;

            case 'fseUnlisten':
                this.executeBinaryOperation(user, FseUnlistenOperation, command, reader);
                break;

            case 'fseSet':
            case 'fseSetIncludeMe':
                this.executeBinaryOperation(user, FseSetOperation, command, reader);
                break;

            case 'fseUpdate':
            case 'fseUpdateIncludeMe':
                this.executeBinaryOperation(user, FseUpdateOperation, command, reader);
                break;
        }
    }

    public getUserById(userId: number): RelayUser {
        return this.users[userId];
    }

    public getRealmById(realmId: number): RelayRealm {
        return this.realms[realmId];
    }

    public reserveNextAvailableRealmNumber(): number {
        return this.availableRealmIds.length > 0
            ? this.availableRealmIds.shift()
            : this.nextRealmId++;
    }

    public getConfig(): IConfig {
        return this.config;
    }

    public getEntityManager(): EntityManager {
        return this.entityManager;
    }

    public getFseManager(): FseManager {
        return this.fseManager;
    }

    /**
     * @param targetRealmId The target realm number, or -1 to leave a realm.
     * @param option If the realm should become a child realm of the user's current realm, targetRealmId must not be -1.
     */
    public changeRealm(user: RelayUser, targetRealmId: number, option: NewRealmOption) {

        // Don't do anything if the user is staying in the same realm
        let becomingRealmless = targetRealmId === -1;
        if ((user.realm === null && becomingRealmless) || (user.realm !== null && user.realm.id === targetRealmId)) {
            return;
        }

        // Child realms can only be created if user is currently in a realm
        let oldRealm = user.realm;
        let makeChild = option === 'temporaryChildRealm' || option === 'persistedChildRealm';
        if (oldRealm === null && makeChild) {
            option = 'standard';
            makeChild = false;
        }

        // Remove user from the old realm
        if (oldRealm !== null) {
            this.makeUserLeaveRealm(user, oldRealm);
        }

        // Add the user to the new realm, creating it if necessary
        let newRealm: RelayRealm = null;
        let creatingOrJoiningRealm = targetRealmId !== -1;
        if (creatingOrJoiningRealm) {
            newRealm = this.realms[targetRealmId] ?? this.createRealm(targetRealmId, makeChild ? oldRealm : null);
            this.makeUserJoinRealm(user, newRealm, makeChild);
        }

        // Advise everyone in the old realm that there is a new child realm
        if (makeChild) {
            for (let realmUser of oldRealm.users) {
                this.sendUtf8(realmUser, `{${newRealm.id}`);
            }
        }

        // If there aren't any more users or child realms in the old realm then recursively destroy the old realm(s)
        if (!makeChild) {
            this.cleanUpEmptyRealms(oldRealm);
        }
    }

    public sendUtf8(user: RelayUser, packet: string) {
        if (this.config.logOutgoing) {
            console.log(`[${user.name ?? user.id}|Out] ${packet}`);
        }
        user.connection.sendUTF(packet);
    }

    public sendBinary(user: RelayUser, packet: Buffer) {
        if (this.config.logOutgoing) {
            const command = packet?.[0] ?? -1;
            const commandName = BinaryClientCommandNames.get(<BinaryClientCommandNumber>command) ?? command;
            console.log(`[${user.name ?? user.id}|Out] ${commandName} (${packet.length - 1} bytes)`);
        }
        user.connection.sendBytes(packet);
    }

    private executeUtf8Operation(user: RelayUser, operationType: { new(): IUtf8Operation }, command: string, message: string) {
        const operation = new operationType();
        operation.decode(command, message);
        operation.execute(user, this);
    }

    private executeBinaryOperation(user: RelayUser, operationType: { new(): IBinaryOperation }, command: BinaryServerCommandNumber, message: BinaryPacketReader) {
        const operation = new operationType();
        operation.decode(command, message);
        operation.execute(user, this);
    }

    private createRealm(id: number, parentRealm: RelayRealm): RelayRealm {
        const newRealm = new RelayRealm(parentRealm, id);
        this.realms[id] = newRealm;
        if (parentRealm !== null) {
            parentRealm.childRealms.push(newRealm);
        }
        return newRealm;
    }

    private makeUserLeaveRealm(user: RelayUser, realmToLeave: RelayRealm): void {

        // Unlisten to all FSEs from the old realm
        this.fseManager.unsubscribeUserFromAll(user);

        // Remove user from the realm
        realmToLeave.users.splice(realmToLeave.users.indexOf(user), 1);
        user.realm = null;

        // Notify everyone else
        for (let realmUser of realmToLeave.users) {
            this.sendUtf8(realmUser, `-${user.id}`);
        }
    }

    private makeUserJoinRealm(user: RelayUser, realmToJoin: RelayRealm, asChild: boolean): void {

        // Add user to the realm
        realmToJoin.users.push(user);
        user.realm = realmToJoin;

        // Advise user that the new realm has been joined successfully
        this.sendUtf8(user, `${asChild ? "&" : "^"}${realmToJoin.id}`);

        // Advise user of all child realms already existing in the new realm
        for (let realm of realmToJoin.childRealms) {
            this.sendUtf8(user, `{${realm.id}`);
        }

        // Advise user of all other users already connected to that realm
        let otherRealmUsers = realmToJoin.users.filter(u => u !== user);
        this.sendUtf8(user, `=${otherRealmUsers.map(u => u.id).join(',')}`);

        // Advise everyone in the target realm that user has joined
        for (let realmUser of otherRealmUsers) {
            this.sendUtf8(realmUser, `+${user.id}`);
        }
    }

    private cleanUpEmptyRealms(realm: RelayRealm) {
        let currentRealm = realm;
        while (currentRealm !== null && currentRealm.users.length === 0 && currentRealm.childRealms.length === 0) {

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
                this.entityManager.handleRealmDeleted(currentRealm.id);
                this.fseManager.handleRealmDeleted(currentRealm.id);
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

}