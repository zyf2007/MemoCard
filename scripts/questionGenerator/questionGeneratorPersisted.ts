export class QuestionGeneratorPersisted {

    public enabledQuestionBaseNames: Set<string> = new Set();

    FromJson(json: any) {
        console.log("[QuestionGeneratorPersisted] FromJson ", json.enabledQuestionBaseNames);
        this.enabledQuestionBaseNames = new Set(json.enabledQuestionBaseNames || []);
    }

    ToJson() {
        return {
            enabledQuestionBaseNames: [...this.enabledQuestionBaseNames],
        };
    }
}