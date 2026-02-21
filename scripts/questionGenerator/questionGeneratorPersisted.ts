export class QuestionGeneratorPersisted {

    public enabledQuestionBaseNames: string[] = [];

    FromJson(json: any) {
        this.enabledQuestionBaseNames = json.enabledQuestionBaseNames || [];
    }
}