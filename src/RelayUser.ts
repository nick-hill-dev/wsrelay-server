import { connection } from "websocket";
import RelayRealm from "./RelayRealm";
import { JWTPayload } from "jose";

export default class RelayUser {

    public name: string = null;

    public jwt: JWTPayload = null;

    public realm: RelayRealm = null;

    public constructor(
        public readonly id: number,
        public readonly connection: connection
    ) {
    }

}