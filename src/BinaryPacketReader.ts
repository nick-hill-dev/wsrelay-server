export class BinaryPacketReader {

    private position: number = 0;

    public constructor(private readonly buffer: Buffer) {
    }

    public readByte(): number {
        return this.buffer[this.position++];
    }

    public readUint32(): number {
        const result = this.buffer.readUInt32BE(this.position);
        this.position += 4;
        return result;
    }

    public readString(): string {
        return this.readBuffer().toString('utf8');
    }

    public readBuffer(): Buffer {
        const size = this.readByte();
        const result = this.buffer.subarray(this.position, this.position + size);
        this.position += size;
        return result;
    }

}