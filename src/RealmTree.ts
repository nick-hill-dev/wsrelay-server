export class RealmTree {

    public childRealms: RealmTree[] = [];

    public constructor(
        public readonly id: number,
        public readonly parentRealm: RealmTree,
        public readonly persisted: boolean
    ) {
    }

    public enumerate(): RealmTree[] {
        const result: RealmTree[] = [];
        const stack: RealmTree[] = [this];
        while (stack.length > 0) {
            const tree = stack.pop();
            result.push(tree);
            stack.unshift(...tree.childRealms);
        }
        return result;
    }

}