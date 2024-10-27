export class BinaryPacketWriter {

    private readonly bytes: number[] = [];

    public writeByte(data: number): void {
        this.bytes.push(data);
    }

    public writeString(data: string): void {
        this.writeBuffer(Buffer.from(data, 'utf8'));
    }

    public writeBuffer(data: Buffer): void {
        if (data.length >= 256) {
            throw new Error('Buffer data is too long to be encoded in a binary packet.');
        }
        this.bytes.push(data.length);
        for (const byte of data) {
            this.bytes.push(byte);
        }
    }

    public toBuffer(): Buffer {
        return Buffer.from(this.bytes);
    }

}