import { BinaryClientCommandNumbers } from "../BinaryClientCommandName";
import { BinaryPacketReader } from "../BinaryPacketReader";
import { BinaryPacketWriter } from "../BinaryPacketWriter";
import { BinaryServerCommandNames, BinaryServerCommandNumber } from "../BinaryServerCommandName";
import { IRelayManager } from "../IRelayManager";
import RelayUser from "../RelayUser";
import { IBinaryOperation } from "./IBinaryOperation";

export class FseSetOperation implements IBinaryOperation {

    private name: string;

    private data: Buffer;

    private includeSender: boolean;

    public decode(command: BinaryServerCommandNumber, message: BinaryPacketReader): void {
        const commandName = BinaryServerCommandNames.get(command);
        switch (commandName) {
            case 'fseSet':
            case 'fseSetIncludeMe':
                break;

            default:
                throw new Error('Unexpected binary command number.');
        }

        this.name = message.readString(1);
        this.data = message.readBuffer(4);
        this.includeSender = commandName === 'fseSetIncludeMe';
    }

    public execute(senderUser: RelayUser, manager: IRelayManager): void {
        if (senderUser.realm === null) {
            return;
        }

        const fseManager = manager.getFseManager();
        const subscribedUsers = fseManager.setData(senderUser.realm.id, this.name, this.data);

        const packet = new BinaryPacketWriter();
        packet.writeByte(BinaryClientCommandNumbers.get('fseSet'));
        packet.writeUint32(senderUser.id);
        packet.writeString(this.name);
        packet.writeBuffer(this.data, 4);
        const packetAsBuffer = packet.toBuffer();

        for (const realmUser of subscribedUsers) {
            if (this.includeSender || realmUser.id !== senderUser.id) {
                manager.sendBinary(realmUser, packetAsBuffer);
            }
        }
    }

}