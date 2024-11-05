import { IRelayManager } from "../IRelayManager";
import RelayUser from "../RelayUser";
import { IUtf8Operation } from "./IUtf8Operation";

export class SaveDataOperation implements IUtf8Operation {

    private entityName: string;

    private expireTime: number;

    private data: string;

    public decode(command: string, message: string): void {
        const symbol = command[0];
        if (symbol !== '>') {
            throw new Error('Unexpected command symbol.');
        }

        const fragment = command.substring(1);
        if (fragment.length < 1) {
            throw new Error('Load data command requires additional information.');
        }

        const commaIndex = fragment?.indexOf(',') ?? -1;
        if (commaIndex === -1) {
            this.entityName = fragment;
            this.expireTime = 0;
        } else {
            this.entityName = fragment.substring(0, commaIndex);
            this.expireTime = parseInt(fragment.substring(commaIndex + 1));
        }

        this.data = message;
    }

    public execute(senderUser: RelayUser, manager: IRelayManager): void {
        if (senderUser.realm === null) {
            return;
        }
        manager.saveData(senderUser.realm.id, this.entityName, this.expireTime, this.data);
    }

}