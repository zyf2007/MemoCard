import { Question } from "./Question";

export class FillingQuestion extends Question {
    public readonly correctAnswer: string;

    constructor(id: string, text: string, correctAnswer: string) {
        super(id, text);


        this.correctAnswer = correctAnswer.trim();
    }

    public get type(): "filling" {
        return "filling";
    }

    public override toJSON(): object {
        return {
            ...super.toJSON(),
            correctAnswer: this.correctAnswer,
        };
    }

    // 3.2 静态解析方法
    public static fromJSON(json: unknown): FillingQuestion {
        if (typeof json !== "object" || json === null || !("id" in json) || !("text" in json) || !("correctAnswer" in json)) {
            throw new Error(`无效的填空题数据：${JSON.stringify(json)}`);
        }

        const data = json as any;
        return new FillingQuestion(
            data.id as string,
            data.text as string,
            data.correctAnswer as string
        );
    }
}