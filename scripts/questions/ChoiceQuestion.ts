import { Question } from "./Question";

export class ChoiceQuestion extends Question {
    public readonly choices: string[];
    public readonly correctChoiceIndex: number;

    constructor(id: string, text: string, choices: string[], correctChoiceIndex: number) {
        super(id, text);

        // 2.1 自身数据合法性校验
        if (!Array.isArray(choices) || choices.length === 0) {
            throw new Error("选择题选项不能为空");
        }
        if (typeof correctChoiceIndex !== "number" || correctChoiceIndex < 0 || correctChoiceIndex >= choices.length) {
            throw new Error("选择题正确答案索引无效");
        }

        this.choices = choices;
        this.correctChoiceIndex = correctChoiceIndex;
    }

    public get type(): "choice" {
        return "choice";
    }

    // 重写 toJSON，包含子类特有属性
    public override toJSON(): object {
        return {
            ...super.toJSON(),
            choices: this.choices,
            correctChoiceIndex: this.correctChoiceIndex,
        };
    }

    // 2.2 静态解析方法：从 JSON 数据创建实例
    public static fromJSON(json: unknown): ChoiceQuestion {
        if (typeof json !== "object" || json === null || !("id" in json) || !("text" in json) || !("choices" in json) || !("correctChoiceIndex" in json)) {
            throw new Error(`无效的选择题数据：${JSON.stringify(json)}`);
        }

        const data = json as any;
        return new ChoiceQuestion(
            data.id as string,
            data.text as string,
            data.choices as string[],
            data.correctChoiceIndex as number
        );
    }
}