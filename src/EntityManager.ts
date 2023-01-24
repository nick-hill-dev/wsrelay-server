const fs = require('fs');

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

        let allData = fs.readFileSync(fileName, 'utf8');
        let spaceIndex = allData.indexOf(' ');

        let metaData = parseInt(allData.substring(0, spaceIndex));
        if (metaData !== 0 && this.getTicks(new Date()) > metaData) {
            fs.unlinkSync(fileName);
            return '';
        }

        return allData.substring(spaceIndex + 1);
    }

    public saveData(realmId: number, entityName: string, time: number, message: string): void {
        if (!this.isValidEntityName(entityName)) {
            return;
        }
        let fileName = this.getFullFileName(realmId, entityName);
        if (message === '') {
            if (fs.existsSync(fileName)) {
                fs.unlinkSync(fileName);
            }
        } else {
            let metadata = 0;
            if (time !== 0) {
                let date = new Date();
                date.setSeconds(date.getSeconds() + time);
                metadata = this.getTicks(date);
            }
            fs.writeFileSync(fileName, metadata + " " + message);
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

    private getFullFileName(realmId: number, entityName: string): string {
        let fileName = `realm.${realmId}.${entityName}.e`;
        return `${this.path}/${fileName}`;
    }

    private isValidEntityName(name: string): boolean {
        return /^\w+$/.test(name);
    }

    private getTicks(date: Date): number {
        return (621355968e9 + date.getTime() * 1e4);
    }

}