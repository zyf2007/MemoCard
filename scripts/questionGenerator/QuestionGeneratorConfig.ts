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
    public weightMin: number = 1;
    public weightMax: number = 10;
    public initialWeight: number = 6;
    FromJson(json: any) {
        console.log("[QuestionGeneratorPersisted] FromJson ", json.enabledQuestionBaseIds);
        this.enabledQuestionBaseIds = new Set(json.enabledQuestionBaseIds || []);
        this.questionData = new Map(json.flatQuestionData || []);
        console.log(this.questionData) 
        this.lastInitTime = json.lastInitTime;
        this.randomFactor = typeof json.randomFactor === "number" ? json.randomFactor : 1.5;
        this.weightMin = typeof json.weightMin === "number" ? json.weightMin : 1;
        this.weightMax = typeof json.weightMax === "number" ? json.weightMax : 10;
        this.initialWeight = typeof json.initialWeight === "number" ? json.initialWeight : 6;
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
            weightMin: this.weightMin,
            weightMax: this.weightMax,
            initialWeight: this.initialWeight,
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
