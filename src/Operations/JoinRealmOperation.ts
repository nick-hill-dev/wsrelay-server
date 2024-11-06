import { IRelayManager } from "../IRelayManager";
import RelayUser from "../RelayUser";
import { IUtf8Operation } from "./IUtf8Operation";

export class JoinRealmOperation implements IUtf8Operation {

    private mode: 'direct' | 'child';

    private realmNumber: number;

    public decode(command: string, message: string): void {
        const symbol = command[0];
        switch (symbol) {
            case '^':
                this.mode = 'direct';
                break;

            case '&':
                this.mode = 'child';
                break;

            default:
                throw new Error('Unexpected command symbol.');
        }

        this.realmNumber = parseInt(command.substring(1));
        if (isNaN(this.realmNumber)) {
            this.realmNumber = -1;
        }
    }

    public execute(senderUser: RelayUser, manager: IRelayManager): void {
        let realmId = this.realmNumber;
        if (realmId === -1) {
            realmId = manager.reserveNextAvailableRealmNumber();
        }
        const option = this.mode === 'child' ? 'temporaryChildRealm' : 'standard';
        manager.changeRealm(senderUser, realmId, option);
    }

}