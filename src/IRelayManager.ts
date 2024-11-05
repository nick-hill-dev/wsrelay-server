import RelayRealm from "./RelayRealm";
import RelayUser from "./RelayUser";

export interface IRelayManager {

    readonly config: IConfig;

    getUserById(userId: number): RelayUser;

    getRealmById(realmId: number): RelayRealm;

    reserveNextAvailableRealmNumber(): number;

    changeRealm(user: RelayUser, targetRealmId: number, createChildRealm: boolean): void;

    sendUtf8(user: RelayUser, packet: string): void;

    loadData(realmId: number, entityName: string): string;

    saveData(realmId: number, entityName: string, expireTime: number, data: string): void;

}