import RelayUser from "./RelayUser";

export interface IRelayManager {

    reserveNextAvailableRealmNumber(): number;

    changeRealm(user: RelayUser, targetRealmId: number, createChildRealm: boolean): void;

    sendUtf8(user: RelayUser, packet: string): void;
    
}