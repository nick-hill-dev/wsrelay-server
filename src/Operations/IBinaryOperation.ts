import { BinaryPacketReader } from "../BinaryPacketReader";
import { BinaryServerCommandNumber } from "../BinaryServerCommandName";
import { IRelayManager } from "../IRelayManager";
import RelayUser from "../RelayUser";

export interface IBinaryOperation {

    decode(command: BinaryServerCommandNumber, message: BinaryPacketReader): void;

    execute(senderUser: RelayUser, manager: IRelayManager): void;

}