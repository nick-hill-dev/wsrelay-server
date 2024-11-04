import { IRelayManager } from "../IRelayManager";
import RelayUser from "../RelayUser";
import { IUtf8Operation } from "./IUtf8Operation";

export class SendToUserOperation implements IUtf8Operation {

    public targetUserId: number;

    public message: string;

    public decode(command: string, message: string): void {
        const symbol = command[0];
        if (symbol !== '@') {
            throw new Error('Unexpected command symbol.');
        }

        this.targetUserId = parseInt(command.substring(1));
        this.message = message;
    }

    public execute(senderUser: RelayUser, manager: IRelayManager): void {
        if (senderUser.realm === null) {
            return;
        }

        let targetUser = manager.getUserById(this.targetUserId);
        if (targetUser) {
            manager.sendUtf8(targetUser, `@${senderUser.id} ${this.message}`);
        }
    }

}