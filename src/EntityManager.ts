import { EntityType } from "./EntityType";

const fs = require('fs');

export default class EntityManager {

    public constructor(public readonly path: string) {
        this.upgrade();
    }

    public loadData<T extends EntityType>(realmId: number, type: T, entityName: string): T extends 'utf8' ? string : Buffer;
    public loadData(realmId: number, type: EntityType, entityName: string): string | Buffer {
        if (!this.isValidEntityName(entityName)) {
            return '';
        }
        let fileName = this.getFullFileName(realmId, type, entityName);
        if (!fs.existsSync(fileName)) {
            return '';
        }

        if (type === 'utf8') {
            return this.loadAndProcessUtf8DataInternal(fileName);
        } else {
            return this.loadAndProcessBinaryDataInternal(fileName);
        }
    }

    public saveData<T extends EntityType>(realmId: number, type: T, entityName: string, time: number, data: T extends 'utf8' ? string : Buffer): void;
    public saveData(realmId: number, type: EntityType, entityName: string, time: number, data: string | Buffer): void {
        if (!this.isValidEntityName(entityName)) {
            return;
        }
        const fileName = this.getFullFileName(realmId, type, entityName);
        if (data.length === 0) {
            if (fs.existsSync(fileName)) {
                fs.unlinkSync(fileName);
            }
            return;
        }

        if (type === 'utf8') {
            this.saveUtf8DataInternal(fileName, time, <string>data);
        } else {
            this.saveBinaryDataInternal(fileName, <Buffer>data);
        }
    }

    public deleteData(realmId: number) {
        for (let fileName of fs.readdirSync(this.path)) {
            if (fileName.startsWith(`realm.${realmId}.`)) {
                fs.unlinkSync(`${this.path}/${fileName}`);
            }
        }
    }

    private upgrade(): void {
        for (let oldFileName of fs.readdirSync(this.path)) {
            if (oldFileName.endsWith('.entity')) {
                let data = fs.readFileSync(oldFileName, 'utf8');
                let newFileName = oldFileName.substring(0, oldFileName.lastIndexOf('.')) + '.e';
                fs.writeFileSync(`${this.path}/${newFileName}`, `0 ${data}`);
                fs.unlinkSync(`${this.path}/${oldFileName}`);
            }
        }
    }

    private loadAndProcessUtf8DataInternal(fileName: string): string {
        const allData = fs.readFileSync(fileName, 'utf8');
        const spaceIndex = allData.indexOf(' ');

        const metaData = parseInt(allData.substring(0, spaceIndex));
        if (metaData !== 0 && this.getTicks(new Date()) > metaData) {
            fs.unlinkSync(fileName);
            return '';
        }

        return allData.substring(spaceIndex + 1);
    }

    private loadAndProcessBinaryDataInternal(fileName: string): Buffer {
        const allData = fs.readFileSync(fileName);
        // TODO: Implement capabilities
        //const capabilities = allData[0];
        //if (capabilities !== 1) {
            //return Buffer.alloc(0);
        //}
        return allData.subarray(0);
    }

    private saveUtf8DataInternal(fileName: string, time: number, data: string): void {
        let metadata = 0;
        if (time !== 0) {
            let date = new Date();
            date.setSeconds(date.getSeconds() + time);
            metadata = this.getTicks(date);
        }
        fs.writeFileSync(fileName, metadata + " " + data);
    }

    private saveBinaryDataInternal(fileName: string, data: Buffer): void {
        fs.writeFileSync(fileName, data);
    }

    private getFullFileName(realmId: number, type: EntityType, entityName: string): string {
        const ext = type === 'binary' ? 'be' : 'e';
        const fileName = `realm.${realmId}.${entityName}.${ext}`;
        return `${this.path}/${fileName}`;
    }

    private isValidEntityName(name: string): boolean {
        return /^\w+$/.test(name);
    }

    private getTicks(date: Date): number {
        return (621355968e9 + date.getTime() * 1e4);
    }

}