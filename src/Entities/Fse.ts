import fs from 'fs';
import RelayUser from '../RelayUser';

export class Fse {

    private buffer: Uint8Array;

    private length: number;

    private readonly subscribedUsers: RelayUser[] = [];

    public constructor(
        public readonly fileName: string,
        initialData: Uint8Array = undefined
    ) {
        if (initialData) {
            this.buffer = initialData;
            this.length = initialData.length;
        } else {
            this.buffer = new Uint8Array(128);
            this.length = 0;
        }
    }

    public setBytes(position: number, bytes: Uint8Array) {
        const requiredLength = position + bytes.length;
        if (requiredLength > this.buffer.length) {
            this.expandBuffer(requiredLength);
        }
        this.buffer.set(bytes, position);
        if (this.length < requiredLength) {
            this.length = requiredLength;
        }
    }

    public getSubscribedUsers(): readonly RelayUser[] {
        return this.subscribedUsers;
    }

    public subscribeUser(user: RelayUser): void {
        if (this.subscribedUsers.indexOf(user) === -1) {
            this.subscribedUsers.push(user);
        }
    }

    public unsubscribeUser(user: RelayUser): void {
        const index = this.subscribedUsers.indexOf(user);
        if (index !== -1) {
            this.subscribedUsers.splice(index, 1);
        }
    }

    public toUint8Array(): Uint8Array {
        return this.buffer.slice(0, this.length);
    }

    public static load(fileName: string): Fse {
        if (!fs.existsSync(fileName)) {
            return new Fse(fileName);
        }
        const data = fs.readFileSync(fileName);
        return new Fse(fileName, data);
    }

    public save(): boolean {
        const bytes = this.toUint8Array();
        if (bytes.length === 0) {
            if (fs.existsSync(this.fileName)) {
                fs.unlinkSync(this.fileName);
            }
            return false;
        } else {
            fs.writeFileSync(this.fileName, bytes);
            return true;
        }
    }

    private expandBuffer(minSize: number): void {
        while (this.buffer.length < minSize) {
            const newBuffer = new Uint8Array(this.buffer.length * 2);
            newBuffer.set(this.buffer, 0);
            this.buffer = newBuffer;
        }
    }

}