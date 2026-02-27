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

    public toJSON(): object {
        return {
            id: this.id,
            text: this.text,
            type: this.type,
        };
    }

}