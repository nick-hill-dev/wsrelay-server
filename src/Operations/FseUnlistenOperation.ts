import { BinaryPacketReader } from "../BinaryPacketReader";
import { BinaryServerCommandNames, BinaryServerCommandNumber } from "../BinaryServerCommandName";
import { IRelayManager } from "../IRelayManager";
import RelayUser from "../RelayUser";
import { IBinaryOperation } from "./IBinaryOperation";

export class FseUnlistenOperation implements IBinaryOperation {

    private name: string;

    public decode(command: BinaryServerCommandNumber, message: BinaryPacketReader): void {
        if (BinaryServerCommandNames.get(command) !== 'fseUnlisten') {
            throw new Error('Unexpected binary command number.');
        }

        this.name = message.readString(1);
    }

    public execute(senderUser: RelayUser, manager: IRelayManager): void {
        if (senderUser.realm === null) {
            return;
        }

        const fseManager = manager.getFseManager();
        fseManager.unsubscribeUser(senderUser, this.name);
    }

}