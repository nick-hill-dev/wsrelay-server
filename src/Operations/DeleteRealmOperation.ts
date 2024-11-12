import { IRelayManager } from "../IRelayManager";
import RelayUser from "../RelayUser";
import { IUtf8Operation } from "./IUtf8Operation";

export class DeleteRealmOperation implements IUtf8Operation {

    private realmNumber: number;

    public decode(command: string, message: string): void {
        const symbol = command[0];
        if (symbol !== 'x') {
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
            realmId = senderUser.realm?.id ?? -1;
        }
        if (realmId === -1) {
            return;
        }
        const config = manager.getConfig();
        if (!config.jwt?.rolesClaim || !config.jwt?.adminRoleName) {
            console.warn('Cannot delete relam due to missing JWT configuration.');
        }
        if (!senderUser.jwt) {
            console.warn('Cannot delete relam because user has not identified with a JWT.');
        }
        const roles = <string[]>senderUser.jwt[config.jwt.rolesClaim];
        if (roles.indexOf(config.jwt.adminRoleName) === -1) {
            console.warn(`Cannot delete relam because user is not an admin. JWT must have a ${config.jwt.rolesClaim} claim containing a value of "${config.jwt.adminRoleName}".`);
        }
        manager.deleteRealm(realmId);
    }

}