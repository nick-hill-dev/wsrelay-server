import RelayUser from "./RelayUser";

export default class Realm {

    public users: RelayUser[] = [];

    public constructor(
        public readonly id: number
    ) {
    }

}