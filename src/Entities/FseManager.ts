import fs from 'fs';
import { Fse } from './Fse';
import RelayUser from '../RelayUser';

export default class FseManager {

    private readonly interval: NodeJS.Timeout = null;

    private readonly fseList: Map<string, Fse> = new Map<string, Fse>();

    private readonly emptyBuffer = Buffer.alloc(0);

    public constructor(
        public readonly path: string,
        private readonly maxSize: number
    ) {
        this.interval = setInterval(() => this.persistFses(), 5 * 60 * 1000);
    }

    public getData(realmId: number, entityName: string): Buffer {

        if (!this.isValidEntityName(entityName)) {
            return this.emptyBuffer;
        }

        const fse = this.getOrCreateFse(realmId, entityName);
        return Buffer.from(fse.toUint8Array());
    }

    public setData(realmId: number, entityName: string, data: Buffer): readonly RelayUser[] {

        if (!this.isValidEntityName(entityName)) {
            return;
        }

        const fse = this.getOrCreateFse(realmId, entityName);
        fse.setBytes(0, new Uint8Array(data.buffer, data.byteOffset, data.length));

        if (!fs.existsSync(fse.fileName)) {
            fse.save();
        }

        return fse.getSubscribedUsers();
    }

    public updateData(realmId: number, entityName: string, position: number, data: Buffer): readonly RelayUser[] {

        if (data.length === 0 || !this.isValidEntityName(entityName)) {
            return;
        }

        if (position + data.length > this.maxSize) {
            throw new Error('FSE update would cause the file to be too large. FSE update aborted.');
        }

        const fse = this.getOrCreateFse(realmId, entityName);
        fse.setBytes(position, new Uint8Array(data.buffer, data.byteOffset, data.length));

        return fse.getSubscribedUsers();
    }

    public handleRealmDeleted(realmId: number) {
        for (const fileName of fs.readdirSync(this.path)) {
            if (fileName.startsWith(`realm.${realmId}.`) && fileName.endsWith('.fse')) {
                fs.unlinkSync(`${this.path}/${fileName}`);
            }
        }
        const keysToDelete = [];
        for (const name of this.fseList.keys()) {
            if (name.startsWith(`${realmId}-`)) {
                keysToDelete.push(name);
            }
        }
        for (const key of keysToDelete) {
            this.fseList.delete(key);
        }
    }

    public subscribeUser(user: RelayUser, entityName: string): void {
        const fse = this.getOrCreateFse(user.realm.id, entityName);
        fse.subscribeUser(user);
    }

    public unsubscribeUser(user: RelayUser, entityName: string): void {
        const fseName = `${user.realm.id}-${entityName}`;
        const fse = this.fseList.get(fseName);
        if (fse) {
            fse.unsubscribeUser(user);
        }
    }

    public unsubscribeUserFromAll(user: RelayUser): void {
        for (const fse of this.fseList.values()) {
            fse.unsubscribeUser(user);
        }
    }

    private getOrCreateFse(realmId: number, entityName: string): Fse {
        const fseName = `${realmId}-${entityName}`;
        const existingFse = this.fseList.get(fseName);
        if (existingFse) {
            return existingFse;
        }
        const fileName = this.getFullFileName(realmId, entityName);
        const newFse = Fse.loadOrCreate(fileName);
        this.fseList.set(fseName, newFse);
        return newFse;
    }

    private getFullFileName(realmId: number, entityName: string): string {
        const fileName = `realm.${realmId}.${entityName}.fse`;
        return `${this.path}/${fileName}`;
    }

    private isValidEntityName(name: string): boolean {
        return /^\w+$/.test(name);
    }

    private persistFses(): void {
        const fseListToRemove = [];
        for (const name of this.fseList.keys()) {
            const fse = this.fseList.get(name);
            if (!fse.save()) {
                fseListToRemove.push(name);
            }
        }
        for (const fseToRemove of fseListToRemove) {
            this.fseList.delete(fseToRemove);
        }
    }

}