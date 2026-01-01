import { IRelayManager } from "../IRelayManager";
import RelayUser from "../RelayUser";
import { IUtf8Operation } from "./IUtf8Operation";

export class SendToRealmOperation implements IUtf8Operation {

    public targetRealmId: number;

    public sendToAll: boolean = false;

    public message: string;

    public decode(command: string, message: string): void {
        const symbol = command[0];
        if (symbol !== ':') {
            throw new Error('Unexpected command symbol.');
        }

        const fragment = command.substring(1);
        const commaIndex = fragment?.indexOf(',') ?? -1;
        if (commaIndex === -1) {
            this.targetRealmId = parseInt(fragment);
            this.sendToAll = false;
        } else {
            this.targetRealmId = parseInt(fragment.substring(0, commaIndex));
            this.sendToAll = fragment.substring(commaIndex + 1) === '*';
        }

        this.message = message;
    }

    public execute(senderUser: RelayUser, manager: IRelayManager): void {

        const targetRealm = manager.getRealmById(this.targetRealmId);
        if (senderUser.realm === null || !targetRealm || targetRealm.users.length === 0) {
            return;
        }

        const encodedPacket = `@${senderUser.id} ${this.message}`;

        for (const targetUser of targetRealm.users) {
            manager.sendUtf8(targetUser, encodedPacket);
            if (!this.sendToAll) {
                break;
            }
        }
    }

}