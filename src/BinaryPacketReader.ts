export class BinaryPacketReader {

    private position: number = 0;

    public constructor(private readonly buffer: Buffer) {
    }

    public readByte(): number {
        return this.buffer[this.position++];
    }

    public readUint16(): number {
        const result = this.buffer.readUInt16BE(this.position);
        this.position += 2;
        return result;
    }

    public readUint32(): number {
        const result = this.buffer.readUInt32BE(this.position);
        this.position += 4;
        return result;
    }

    public readUint(byteCount: 1 | 2 | 4): number {
        if (byteCount === 1) {
            return this.readByte();
        } else if (byteCount === 2) {
            return this.readUint16();
        } else {
            return this.readUint32();
        }
    }

    public readString(lengthBytes: 1 | 2 | 4 = 2): string {
        return this.readBuffer(lengthBytes).toString('utf8');
    }

    public readBuffer(lengthBytes: 1 | 2 | 4 = 2): Buffer {
        const size = this.readUint(lengthBytes);
        const result = this.buffer.subarray(this.position, this.position + size);
        this.position += size;
        return result;
    }

}