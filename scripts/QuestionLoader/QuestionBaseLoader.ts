import AsyncStorage from "@react-native-async-storage/async-storage";
import { LazySingletonBase } from "../utils/LazySingletonBase";
import { QuestionBase } from "./QuestionBase";

export class QuestionBaseLoader extends LazySingletonBase<QuestionBaseLoader>{
    readonly BaseMapKey = "QuestionBaseMap";
    private _questionBaseMap: Map<string, QuestionBase> = new Map();


    constructor(){
        super();
        this.loadQuestionBaseMap();
    }

    private async loadQuestionBaseMap() {
        const questionBaseMapString = await AsyncStorage.getItem(this.BaseMapKey) || "[]";
        const questionList = JSON.parse(questionBaseMapString);
        this._questionBaseMap = new Map(questionList);
        console.log("[QuestionLoader] LoadedQuestionBaseMap", this._questionBaseMap);
        this.Test();
    }

    private persistQuestionBaseMap() {
        AsyncStorage.setItem(this.BaseMapKey, JSON.stringify([...this._questionBaseMap]));
    }


    public Test() {
        // this.AddBase("test");
    }

    public GetBaseList() {
        return [...this._questionBaseMap];
    }

    public AddBase(baseName:string) {
        let q = new QuestionBase(baseName);
        this._questionBaseMap.set(q.id, q);
        this.persistQuestionBaseMap();
    }

    private clearQuestionBaseList() {
        this._questionBaseMap.clear();
        this.persistQuestionBaseMap();
    }

}

