export abstract class Question {
    public readonly id: string;
    public readonly text: string;
    public readonly frombase: string;
    constructor(id: string, text: string, frombase: string = "undefined") {
        this.id = id;
        this.text = text;
        this.frombase = frombase;
    }

    public abstract get type(): "choice" | "filling";

    /**
     * 题目展示前的可选后处理，默认不做任何处理。
     * 子类可按需覆写，例如选择题乱序选项。
     */
    public postProcessForDisplay(): Question {
        return this;
    }

    public toJSON(): object {
        return {
            id: this.id,
            text: this.text,
            type: this.type,
        };
    }

}
