import { IRelayManager } from "../IRelayManager";
import { NewRealmOption } from "../NewRealmOption";
import RelayUser from "../RelayUser";
import { IUtf8Operation } from "./IUtf8Operation";

export class JoinRealmOperation implements IUtf8Operation {

    private mode: 'direct' | 'child';

    private persist: boolean;

    private realmNumber: number;

    public decode(command: string, message: string): void {
        const symbol = command[0];
        switch (symbol) {
            case '^':
                this.mode = 'direct';
                this.persist = false;
                break;

            case '&':
            case '%':
                this.mode = 'child';
                this.persist = symbol === '%';
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
        let option: NewRealmOption = 'standard';
        if (this.mode === 'child') {
            // TODO: If server restarts it forgets about which realm should be the next number, and seems to re-use existing/active realms
            option = this.persist ? 'persistedChildRealm' : 'temporaryChildRealm';
        }
        manager.changeRealm(senderUser, realmId, option);
    }

}