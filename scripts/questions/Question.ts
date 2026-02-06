export abstract class Question {
    public readonly id: string;
    public readonly text: string;

    constructor(id: string, text: string) {
        this.id = id;
        this.text = text;
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