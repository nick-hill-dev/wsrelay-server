import { connection } from "websocket";
import RelayRealm from "./RelayRealm";
import RelayUser from "./RelayUser";

export default class RelayManager {

    public readonly users: RelayUser[] = [];

    private readonly availableUserIds: number[] = [];

    public readonly realms: RelayRealm[] = [];

    private readonly availableRealmIds: number[] = [];

    private nextRealmId: number = 0;

    public constructor(public readonly config: IConfig) {
        this.nextRealmId = config.publicRealmCount;
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

    public handleMessage(userId: number, packet: string): void {
        let user = this.users[userId];
        if (!user) {
            return;
        }

        let realmId = user.realm ? user.realm.id : -1;
        console.log(`[${userId}:${realmId === -1 ? '?' : realmId}|Message|In] ${packet}`);

        let spaceIndex = packet.indexOf(' ');
        let command = spaceIndex === -1 ? packet : packet.substring(0, spaceIndex);
        let message = spaceIndex === -1 ? '' : packet.substring(spaceIndex + 1);

        if (command.length === 0) {
            return;
        }

        switch (command[0]) {
            case '^':
                let realmNumberDirect = parseInt(command.substring(1));
                this.handleJoinRealmDirectCommand(user, isNaN(realmNumberDirect) ? -1 : realmNumberDirect);
                break;

            case '&':
                let realmNumberChild = parseInt(command.substring(1));
                this.handleJoinRealmChildCommand(user, isNaN(realmNumberChild) ? -1 : realmNumberChild);

            case '*':
                this.handleSendToAllCommand(user, message);
                break;

            case '!':
                this.handleSendToAllExceptMeCommand(user, message);
                break;

            case '@':
                let targetUserId = parseInt(command.substring(1));
                let targetUser = this.users[targetUserId];
                if (targetUser) {
                    this.handleSendToUserCommand(user, targetUser, message);
                }
                break;
        }
    }

    private handleJoinRealmDirectCommand(senderUser: RelayUser, realmId: number) {
        if (realmId === -1) {
            realmId = this.availableRealmIds.length > 0 ? this.availableRealmIds.shift() : this.nextRealmId++;
        }
        this.changeRealm(senderUser, realmId, false);
    }

    private handleJoinRealmChildCommand(senderUser: RelayUser, realmId: number) {
        if (realmId === -1) {
            realmId = this.availableRealmIds.length > 0 ? this.availableRealmIds.shift() : this.nextRealmId++;
        }
        this.changeRealm(senderUser, realmId, true);
    }

    private handleSendToAllCommand(senderUser: RelayUser, message: string): void {
        if (senderUser.realm === null) {
            return;
        }
        for (let realmUser of senderUser.realm.users) {
            this.send(realmUser, `*${senderUser.id} ${message}`);
        }
    }

    private handleSendToAllExceptMeCommand(senderUser: RelayUser, message: string): void {
        if (senderUser.realm === null) {
            return;
        }
        for (let realmUser of senderUser.realm.users) {
            if (realmUser.id !== senderUser.id) {
                this.send(realmUser, `!${senderUser.id} ${message}`);
            }
        }
    }

    private handleSendToUserCommand(senderUser: RelayUser, targetUser: RelayUser, message: string): void {
        if (senderUser.realm === null) {
            return;
        }
        this.send(targetUser, `@${senderUser.id} ${message}`);
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
                this.send(realmUser, `-${user.id}`);
            }
        }

        // Get the target realm, creating it if necessary
        let newRealm: RelayRealm = null;
        let creatingOrJoiningRealm = targetRealmId !== -1;
        if (creatingOrJoiningRealm) {
            let newRealm = this.realms[targetRealmId];
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
            this.send(user, `${createChildRealm ? "&" : "^"}${targetRealmId}`);

            // Advise user of all child realms already existing in the new realm
            for (let realm of newRealm.childRealms) {
                this.send(user, `{${realm.id}`);
            }

            // Advise user of all other users already connected to that realm
            let otherRealmUsers = newRealm.users.filter(u => u !== user);
            this.send(user, `=${otherRealmUsers.map(u => u.id).join(',')}`);

            // Advise everyone in the target realm that user has joined
            for (let realmUser of otherRealmUsers) {
                this.send(realmUser, `+${user.id}`);
            }
        }

        // Advise everyone in the old realm that there is a new child realm
        if (createChildRealm) {
            for (let realmUser of oldRealm.users) {
                this.send(realmUser, `{${newRealm.id}`);
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
                    this.send(realmUser, `}${currentRealm.id}`);
                }
            }

            // Remove realm data
            if (currentRealm.id >= this.config.publicRealmCount) {
                // TODO: Implement
                //for (let fileName of Directory.GetFiles(".", "realm." + currentRealm.id + ".*.entity")) {
                //File.Delete(fileName);
                //}
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

    private send(user: RelayUser, packet: string) {
        console.log(`[${user.id}|Out] ${packet}`);
        user.connection.sendUTF(packet);
    }

}