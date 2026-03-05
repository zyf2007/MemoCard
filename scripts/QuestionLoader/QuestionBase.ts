
import { generateMD5 } from '../utils/CryptoUtils';

export class QuestionBase {
    public name: string;
    public id: string;

    constructor(name: string, id?: string) {
        this.name = name;
        const timeString = new Date().toISOString();
        this.id = id || generateMD5(name+timeString).slice(0,8) ;
    }

}