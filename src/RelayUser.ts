import RelayRealm from "./RelayRealm";

export default class RelayUser {

    public realm: RelayRealm = null;

    public constructor(
        public readonly id: number,
        public readonly remoteAddress: string
    ) {
    }

}