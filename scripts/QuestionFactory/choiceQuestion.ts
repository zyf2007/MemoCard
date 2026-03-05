import { Question } from "./question";
import { QuestionType } from "./questionFactory";

export class ChoiceQuestion extends Question {
  public readonly type = QuestionType.Choice;
  public readonly options: string[];
  public readonly correctIndex: number;

  constructor(
    id: string,
    bankId: string,
    content: string,
    options: string[],
    correctIndex: number
  ) {
    super(id, bankId, content);
    this.options = options;
    this.correctIndex = correctIndex;
  }

  // toJson 只返回对象
  public toJson() {
    return {
      id: this.id,
      bankId: this.bankId,
      type: this.type,
      content: this.content,
      options: this.options,
      correctIndex: this.correctIndex,
    };
  }
}