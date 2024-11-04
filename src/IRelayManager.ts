import RelayRealm from "./RelayRealm";
import RelayUser from "./RelayUser";

export interface IRelayManager {

    getUserById(userId: number): RelayUser;

    getRealmById(realmId: number): RelayRealm;

    reserveNextAvailableRealmNumber(): number;

    changeRealm(user: RelayUser, targetRealmId: number, createChildRealm: boolean): void;

    sendUtf8(user: RelayUser, packet: string): void;

}