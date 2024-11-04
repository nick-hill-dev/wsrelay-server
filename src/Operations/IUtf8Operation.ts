import { IRelayManager } from "../IRelayManager";
import RelayUser from "../RelayUser";

export interface IUtf8Operation {

    decode(command: string, message: string): void;

    execute(senderUser: RelayUser, manager: IRelayManager): void;

}