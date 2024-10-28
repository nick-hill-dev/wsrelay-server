export class BinaryPacketWriter {

    private readonly bytes: number[] = [];

    public writeByte(data: number): void {
        if (data < 0 || data > 0xFF) {
            throw new Error('Number out of range for an 8-bit unsigned integer.');
        }
        this.bytes.push(data);
    }

    public writeUint16(data: number): void {
        if (data < 0 || data > 0xFFFF) {
            throw new Error('Number out of range for a 16-bit unsigned integer.');
        }

        this.bytes.push((data >> 8) & 0xFF);
        this.bytes.push(data & 0xFF);
    }

    public writeUint32(data: number): void {
        if (data < 0 || data > 0xFFFFFFFF) {
            throw new Error('Number out of range for a 32-bit unsigned integer.');
        }

        this.bytes.push((data >> 24) & 0xFF);
        this.bytes.push((data >> 16) & 0xFF);
        this.bytes.push((data >> 8) & 0xFF);
        this.bytes.push(data & 0xFF);
    }

    public writeUint(data: number, byteCount: 1 | 2 | 4): void {
        if (byteCount === 1) {
            this.writeByte(data);
        } else if (byteCount === 2) {
            this.writeUint16(data);
        } else {
            this.writeUint32(data);
        }
    }

    public writeString(data: string, lengthBytes: 1 | 2 | 4 = 2): void {
        this.writeBuffer(Buffer.from(data, 'utf8'), lengthBytes);
    }

    public writeBuffer(data: Buffer, lengthBytes: 1 | 2 | 4 = 2): void {
        this.writeUint(data.length, lengthBytes);

        for (const byte of data) {
            this.bytes.push(byte);
        }
    }

    public toBuffer(): Buffer {
        return Buffer.from(this.bytes);
    }

}