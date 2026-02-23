import { QuestionBaseManager } from "../questions";

export class QuestionConfig{
    questionId: string;
    weight: number;
    todayFinished: boolean;
    constructor(questionId: string, weight: number = 6, todayFinished: boolean = false) {
        this.questionId = questionId;
        this.weight = weight;
        this.todayFinished = todayFinished;
    }
}


export class QuestionGeneratorConfig {
    public lastInitTime: string = new Date().toDateString();
    public enabledQuestionBaseNames: Set<string> = new Set();
    public questionData:Map<string,QuestionConfig> = new Map();
    FromJson(json: any) {
        console.log("[QuestionGeneratorPersisted] FromJson ", json.enabledQuestionBaseNames);
        this.enabledQuestionBaseNames = new Set(json.enabledQuestionBaseNames || []);
        this.questionData = new Map(json.flatQuestionData || []);
        this.lastInitTime = json.lastInitTime || new Date().toDateString();
        console.log("[QuestionGeneratorConfig] LoadedFromJson LastInitTime", this.lastInitTime);
        if (new Date().toDateString() !== this.lastInitTime) {
            console.log("[QuestionGeneratorConfig] LastInitTime is not today, reset all questions");
            this.questionData.forEach((value) => {
                value.todayFinished = false; 
            });

            this.RemoveInvalidQuestions();
        }
    }

    ToJson() {
        return {
            enabledQuestionBaseNames: [...this.enabledQuestionBaseNames],
            flatQuestionData: [...this.questionData],
        };
    }

    public RemoveInvalidQuestions() {
        const invalidQuestionIds: Set<string> = new Set();
        this.questionData.forEach((value, key) => {
            if (!QuestionBaseManager.getInstance().getAllQuestions().some((q) => q.id === value.questionId)) {
                invalidQuestionIds.add(value.questionId);
            }
        });
        invalidQuestionIds.forEach((id) => {
            console.log("[QuestionGeneratorConfig] RemovedInvalidQuestion", id);
            this.questionData.delete(id);
        });
        console.log("[QuestionGeneratorConfig] RemovedInvalidQuestionsSize", invalidQuestionIds.size," CurrentQuestionDataSize", this.questionData.size);
    }
}