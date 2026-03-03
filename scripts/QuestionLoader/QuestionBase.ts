
import QuickCrypto from 'react-native-quick-crypto';
const generateMD5 = (str: string) => {
    return QuickCrypto.createHash('md5')
        .update(str)
        .digest('hex') as unknown as string
};
export class QuestionBase {
    public name: string;
    public id: string;

    constructor(name: string, id?: string) {
        this.name = name;
        this.id = id ? id : generateMD5(name);
    }

}