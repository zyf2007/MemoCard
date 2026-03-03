import AsyncStorage from "@react-native-async-storage/async-storage";
import { LazySingletonBase } from "../utils/LazySingletonBase";
import { QuestionBase } from "./QuestionBase";

export class QuestionLoader extends LazySingletonBase<QuestionLoader>{
    readonly BaseMapKey = "QuestionBaseMap";



    constructor(){
        super();
    }

    private loadQuestionBaseMap() {
        AsyncStorage.getItem("")
    }


    public Test() {
        let q = new QuestionBase("test");
        console.log(q.id);
    }

}