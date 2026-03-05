import AsyncStorage from "@react-native-async-storage/async-storage";
import { LazySingletonBase } from "../utils/LazySingletonBase";

class QuestionLoader extends LazySingletonBase<QuestionLoader> {
    readonly BaseMapKey = "QuestionBase - ";
    constructor(){
        super();
    }

    public async LoadQuestionBase(baseId: string) {
        const s = JSON.parse(await AsyncStorage.getItem(this.BaseMapKey + baseId) || "[]");
    }
    public UnLoadQuestionBase() {
        
    }
}