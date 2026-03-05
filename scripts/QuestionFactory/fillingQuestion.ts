import { Question } from "./question";
import { QuestionType } from "./questionFactory";

export class FillingQuestion extends Question {
  public readonly type = QuestionType.Filling;
  public readonly correctAnswer: string;

  constructor(
    id: string,
    bankId: string,
    content: string,
    correctAnswer: string
  ) {
    super(id, bankId, content);
    this.correctAnswer = correctAnswer;
  }

  public toJson() {
    return {
      id: this.id,
      bankId: this.bankId,
      type: this.type,
      content: this.content,
      correctAnswer: this.correctAnswer,
    };
  }
}