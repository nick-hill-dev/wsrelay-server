import { IRelayManager } from "../IRelayManager";
import RelayUser from "../RelayUser";
import { IUtf8Operation } from "./IUtf8Operation";

export class SendToAllOperation implements IUtf8Operation {

    private includeMe: boolean;

    private message: string;

    public decode(command: string, message: string): void {
        const symbol = command[0];
        switch (symbol) {
            case '*':
                this.includeMe = true;
                break;

            case '!':
                this.includeMe = false;
                break;

            default:
                throw new Error('Unexpected command symbol.');
        }

        this.message = message;
    }

    public execute(senderUser: RelayUser, manager: IRelayManager): void {
        if (senderUser.realm === null) {
            return;
        }

        const symbol = this.includeMe ? '*' : '!';
        for (let realmUser of senderUser.realm.users) {
            if (this.includeMe || realmUser.id !== senderUser.id) {
                manager.sendUtf8(realmUser, `${symbol}${senderUser.id} ${this.message}`);
            }
        }
    }

}