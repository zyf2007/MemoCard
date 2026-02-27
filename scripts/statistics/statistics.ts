import { Question } from "../questions";
import { LazySingletonBase } from "../utils/LazySingletonBase";

export class Statistics extends LazySingletonBase<Statistics>{
    constructor(){
        super();
    }

    public finishQuestion(question:Question, isCorrect:boolean){
        console.log(`[Statistics] finishQuestion: ${question.id},from ${question.frombase}, isCorrect: ${isCorrect}`);  
    }
}