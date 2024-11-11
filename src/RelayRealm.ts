import RelayUser from "./RelayUser";

export default class RelayRealm {

    public readonly users: RelayUser[] = [];

    public readonly childRealms: RelayRealm[] = [];

    public constructor(
        public readonly parentRealm: RelayRealm,
        public readonly id: number,
        public readonly persist: boolean
    ) {
    }

}