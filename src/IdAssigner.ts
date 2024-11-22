export class IdAssigner {

    private id: number = 0;

    private readonly availableIds: number[] = [];

    public constructor(minimumId: number = 0) {
        this.id = minimumId;
    }

    public assign(): number {
        if (this.availableIds.length > 0) {
            return this.availableIds.shift();
        }
        return this.id++;
    }

    public unassign(id: number): void {
        this.availableIds.push(id);
        this.availableIds.sort((a, b) => a - b);
    }

    public reserve(id: number): void {
        while (this.id <= id) {
            this.availableIds.push(this.id);
            this.id++;
        }
        const i = this.availableIds.indexOf(id);
        this.availableIds.splice(i, 1);
    }

}