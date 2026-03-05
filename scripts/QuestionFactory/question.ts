export abstract class Question {
  public readonly id: string;
  public readonly bankId: string;
  public readonly content: string;

  constructor(id: string, bankId: string, content: string) {
    this.id = id;
    this.bankId = bankId;
    this.content = content;
  }

  public abstract toJson(): Record<string, any>;
}