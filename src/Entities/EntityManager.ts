import fs from 'fs';

export default class EntityManager {

    public constructor(public readonly path: string) {
        this.upgrade();
    }

    public loadData(realmId: number, entityName: string): string {
        if (!this.isValidEntityName(entityName)) {
            return '';
        }
        let fileName = this.getFullFileName(realmId, entityName);
        if (!fs.existsSync(fileName)) {
            return '';
        }

        return this.loadAndProcessDataInternal(fileName);
    }

    public saveData(realmId: number, entityName: string, time: number, data: string): void {
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

        this.saveDataInternal(fileName, time, data);
    }

    public handleRealmDeleted(realmId: number) {
        for (let fileName of fs.readdirSync(this.path)) {
            if (fileName.startsWith(`realm.${realmId}.`) && (fileName.endsWith('.entity') || fileName.endsWith('.e'))) {
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

    private loadAndProcessDataInternal(fileName: string): string {
        const allData = fs.readFileSync(fileName, 'utf8');
        const spaceIndex = allData.indexOf(' ');

        const metaData = parseInt(allData.substring(0, spaceIndex));
        if (metaData !== 0 && this.getTicks(new Date()) > metaData) {
            fs.unlinkSync(fileName);
            return '';
        }

        return allData.substring(spaceIndex + 1);
    }

    private saveDataInternal(fileName: string, time: number, data: string): void {
        let metadata = 0;
        if (time !== 0) {
            let date = new Date();
            date.setSeconds(date.getSeconds() + time);
            metadata = this.getTicks(date);
        }
        fs.writeFileSync(fileName, metadata + " " + data);
    }

    private getFullFileName(realmId: number, entityName: string): string {
        const fileName = `realm.${realmId}.${entityName}.e`;
        return `${this.path}/${fileName}`;
    }

    private isValidEntityName(name: string): boolean {
        return /^\w+$/.test(name);
    }

    private getTicks(date: Date): number {
        return (621355968e9 + date.getTime() * 1e4);
    }

}