import QuickCrypto from "react-native-quick-crypto";

export const generateMD5 = (str: string): string => {
    return QuickCrypto.createHash('md5')
        .update(str)
        .digest('hex') as unknown as string
};