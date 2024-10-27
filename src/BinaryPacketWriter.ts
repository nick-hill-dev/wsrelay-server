export class BinaryPacketWriter {

    private readonly bytes: number[] = [];

    public writeByte(data: number): void {
        this.bytes.push(data);
    }

    public writeUint32(data: number): void {
        if (data < 0 || data > 0xFFFFFFFF) {
            throw new Error("Number out of range for a 32-bit unsigned integer.");
        }

        this.bytes.push((data >> 24) & 0xFF);
        this.bytes.push((data >> 16) & 0xFF);
        this.bytes.push((data >> 8) & 0xFF);
        this.bytes.push(data & 0xFF);
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