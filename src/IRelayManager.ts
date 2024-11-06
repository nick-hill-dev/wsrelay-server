import EntityManager from "./Entities/EntityManager";
import FseManager from "./Entities/FseManager";
import RelayRealm from "./RelayRealm";
import RelayUser from "./RelayUser";

export interface IRelayManager {

    getConfig(): IConfig;

    getUserById(userId: number): RelayUser;

    getRealmById(realmId: number): RelayRealm;

    reserveNextAvailableRealmNumber(): number;

    changeRealm(user: RelayUser, targetRealmId: number, createChildRealm: boolean): void;

    getEntityManager(): EntityManager;

    getFseManager(): FseManager;

    sendUtf8(user: RelayUser, packet: string): void;

    sendBinary(user: RelayUser, packet: Buffer): void;

}