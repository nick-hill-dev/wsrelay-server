import { BinaryClientCommandNumbers } from "../BinaryClientCommandName";
import { BinaryPacketReader } from "../BinaryPacketReader";
import { BinaryPacketWriter } from "../BinaryPacketWriter";
import { BinaryServerCommandNames, BinaryServerCommandNumber } from "../BinaryServerCommandName";
import { IRelayManager } from "../IRelayManager";
import RelayUser from "../RelayUser";
import { IBinaryOperation } from "./IBinaryOperation";

export class FseListenOperation implements IBinaryOperation {

    private name: string;

    public decode(command: BinaryServerCommandNumber, message: BinaryPacketReader): void {
        if (BinaryServerCommandNames.get(command) !== 'fseListen') {
            throw new Error('Unexpected binary command number.');
        }

        this.name = message.readString(1);
    }

    public execute(senderUser: RelayUser, manager: IRelayManager): void {
        if (senderUser.realm === null) {
            return;
        }

        const fseManager = manager.getFseManager();
        fseManager.subscribeUser(senderUser, this.name);
        const data = fseManager.getData(senderUser.realm.id, this.name);

        const packet = new BinaryPacketWriter();
        packet.writeByte(BinaryClientCommandNumbers.get('fseData'));
        packet.writeString(this.name);
        packet.writeBuffer(data);
        manager.sendBinary(senderUser, packet.toBuffer());
    }

}