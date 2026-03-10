import { generateMD5 } from '../utils/CryptoUtils';

export class QuestionBase {
    public name: string;
    public id: string;

    constructor(name: string, id?: string) {
        this.name = name.trim();
        const timeString = new Date().toISOString();
        this.id = id || generateMD5(`${this.name}${timeString}`).slice(0, 8);
    }

    public toJSON(): { id: string; name: string } {
        return {
            id: this.id,
            name: this.name,
        };
    }
}
