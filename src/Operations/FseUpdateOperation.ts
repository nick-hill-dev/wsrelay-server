import { BinaryClientCommandNumbers } from "../BinaryClientCommandName";
import { BinaryPacketReader } from "../BinaryPacketReader";
import { BinaryPacketWriter } from "../BinaryPacketWriter";
import { BinaryServerCommandNames, BinaryServerCommandNumber } from "../BinaryServerCommandName";
import { IRelayManager } from "../IRelayManager";
import RelayUser from "../RelayUser";
import { IBinaryOperation } from "./IBinaryOperation";

export class FseUpdateOperation implements IBinaryOperation {

    private name: string;

    private startPosition: number;

    private data: Buffer;

    private includeSender: boolean;

    public decode(command: BinaryServerCommandNumber, message: BinaryPacketReader): void {
        const commandName = BinaryServerCommandNames.get(command);
        switch (BinaryServerCommandNames.get(command)) {
            case 'fseUpdate':
            case 'fseUpdateIncludeMe':
                break;

            default:
                throw new Error('Unexpected binary command number.');
        }

        this.name = message.readString(1);
        this.startPosition = message.readUint32();
        this.data = message.readBuffer(2);
        this.includeSender = commandName === 'fseUpdateIncludeMe';
    }

    public execute(senderUser: RelayUser, manager: IRelayManager): void {
        if (senderUser.realm === null) {
            return;
        }

        const fseManager = manager.getFseManager();
        const subscribedUsers = fseManager.updateData(senderUser.realm.id, this.name, this.startPosition, this.data);

        const packet = new BinaryPacketWriter();
        packet.writeByte(BinaryClientCommandNumbers.get('fseUpdate'));
        packet.writeUint32(senderUser.id);
        packet.writeString(this.name);
        packet.writeUint32(this.startPosition);
        packet.writeBuffer(this.data);
        const packetAsBuffer = packet.toBuffer();

        for (let realmUser of subscribedUsers) {
            if (this.includeSender || realmUser.id !== senderUser.id) {
                manager.sendBinary(realmUser, packetAsBuffer);
            }
        }
    }

}