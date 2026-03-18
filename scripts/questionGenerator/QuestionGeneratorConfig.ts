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
    public lastInitTime: string = "";
    public enabledQuestionBaseIds: Set<string> = new Set();
    public questionData:Map<string,QuestionConfig> = new Map();
    public randomFactor: number = 1.5;
    FromJson(json: any) {
        console.log("[QuestionGeneratorPersisted] FromJson ", json.enabledQuestionBaseIds);
        this.enabledQuestionBaseIds = new Set(json.enabledQuestionBaseIds || []);
        this.questionData = new Map(json.flatQuestionData || []);
        console.log(this.questionData) 
        this.lastInitTime = json.lastInitTime;
        this.randomFactor = typeof json.randomFactor === "number" ? json.randomFactor : 1.5;
        console.log("[QuestionGeneratorConfig] LoadedFromJson LastInitTime", this.lastInitTime);

        if (new Date().toDateString() !== this.lastInitTime) {
            console.log("[QuestionGeneratorConfig] LastInitTime is not today, reset all questions");
            this.questionData.forEach((value) => {
                value.todayFinished = false; 
            });
            this.lastInitTime = new Date().toDateString();
        }
        
    }

    ToJson() {
        return {
            enabledQuestionBaseIds: [...this.enabledQuestionBaseIds],
            flatQuestionData: [...this.questionData],
            lastInitTime: this.lastInitTime,
            randomFactor: this.randomFactor,
        };
    }

    public RemoveInvalidQuestions(validQuestionIds: Set<string>) {
        const invalidQuestionIds: Set<string> = new Set();
        this.questionData.forEach((value, key) => {
            if (!validQuestionIds.has(value.questionId)) {
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
