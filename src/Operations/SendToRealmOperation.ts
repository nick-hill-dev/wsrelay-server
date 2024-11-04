import { IRelayManager } from "../IRelayManager";
import RelayUser from "../RelayUser";
import { IUtf8Operation } from "./IUtf8Operation";

export class SendToRealmOperation implements IUtf8Operation {

    public targetRealmId: number;

    public message: string;

    public decode(command: string, message: string): void {
        const symbol = command[0];
        if (symbol !== ':') {
            throw new Error('Unexpected command symbol.');
        }

        this.targetRealmId = parseInt(command.substring(1));
        this.message = message;
    }

    public execute(senderUser: RelayUser, manager: IRelayManager): void {
        let targetRealm = manager.getRealmById(this.targetRealmId);
        if (senderUser.realm === null || !targetRealm || targetRealm.users.length === 0) {
            return;
        }

        let targetUser = targetRealm.users[0];
        manager.sendUtf8(targetUser, `@${senderUser.id} ${this.message}`);
    }

}