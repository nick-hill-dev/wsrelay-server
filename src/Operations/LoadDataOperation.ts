import { IRelayManager } from "../IRelayManager";
import RelayUser from "../RelayUser";
import { IUtf8Operation } from "./IUtf8Operation";

export class LoadDataOperation implements IUtf8Operation {

    private realmId: number = -1;

    private entityName: string;

    public decode(command: string, message: string): void {
        const symbol = command[0];
        if (symbol !== '<') {
            throw new Error('Unexpected command symbol.');
        }

        const fragment = command.substring(1);
        if (fragment.length < 1) {
            throw new Error('Load data command requires additional information.');
        }

        const commaIndex = fragment?.indexOf(',') ?? -1;
        if (commaIndex === -1) {
            this.entityName = fragment;
        } else {
            this.realmId = parseInt(fragment.substring(0, commaIndex));
            this.entityName = fragment.substring(commaIndex + 1);
        }
    }

    public execute(senderUser: RelayUser, manager: IRelayManager): void {
        if (senderUser.realm === null) {
            return;
        }

        let realmId = this.realmId;
        if (realmId === -1) {
            realmId = senderUser.realm.id;
        }

        const fragment = realmId === senderUser.realm.id
            ? this.entityName
            : realmId + ',' + this.entityName;

        let data = manager.loadData(realmId, this.entityName);
        if (data === '') {
            manager.sendUtf8(senderUser, `<${fragment}`);
        } else {
            manager.sendUtf8(senderUser, `<${fragment} ${data}`);
        }

    }

}