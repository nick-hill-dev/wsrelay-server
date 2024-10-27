export class BinaryPacketReader {

    private position: number = 0;

    public constructor(private readonly buffer: Buffer) {
    }

    public readByte(): number {
        return this.buffer[this.position++];
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