const fs = require('fs');

export default class FseManager {

    public constructor(
        public readonly path: string,
        public readonly maxSize: number) {
    }

    public loadData(realmId: number, entityName: string): Buffer {
        if (!this.isValidEntityName(entityName)) {
            return Buffer.alloc(0);
        }
        let fileName = this.getFullFileName(realmId, entityName);
        if (!fs.existsSync(fileName)) {
            return Buffer.alloc(0);
        }

        return this.loadAndProcessDataInternal(fileName);
    }

    public saveData(realmId: number, entityName: string, data: Buffer): void {
        if (!this.isValidEntityName(entityName)) {
            return;
        }
        const fileName = this.getFullFileName(realmId, entityName);
        if (data.length === 0) {
            if (fs.existsSync(fileName)) {
                fs.unlinkSync(fileName);
            }
            return;
        }

        this.saveDataInternal(fileName, data);
    }

    public updateData(realmId: number, entityName: string, start: number, data: Buffer): void {
        if (data.length === 0 || !this.isValidEntityName(entityName)) {
            return;
        }
        if (start + data.length > this.maxSize) {
            throw new Error('FSE update would cause the file to be too large. FSE update aborted.');
        }
        const fileName = this.getFullFileName(realmId, entityName);
        // TODO: Implement
        throw new Error('Not yet implemented fully.');
    }

    public deleteData(realmId: number) {
        for (let fileName of fs.readdirSync(this.path)) {
            if (fileName.startsWith(`realm.${realmId}.`) && fileName.endsEith('.fse')) {
                fs.unlinkSync(`${this.path}/${fileName}`);
            }
        }
    }

    private loadAndProcessDataInternal(fileName: string): Buffer {
        const allData = fs.readFileSync(fileName);
        // TODO: Implement capabilities?
        //const capabilities = allData[0];
        //if (capabilities !== 1) {
        //return Buffer.alloc(0);
        //}
        return allData.subarray(0);
    }

    private saveDataInternal(fileName: string, data: Buffer): void {
        fs.writeFileSync(fileName, data);
    }

    private getFullFileName(realmId: number, entityName: string): string {
        const fileName = `realm.${realmId}.${entityName}.fse`;
        return `${this.path}/${fileName}`;
    }

    private isValidEntityName(name: string): boolean {
        return /^\w+$/.test(name);
    }

}