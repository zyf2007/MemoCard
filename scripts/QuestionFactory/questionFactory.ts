import { generateMD5 } from "../utils/CryptoUtils";
import { ChoiceQuestion } from "../questions/ChoiceQuestion";
import { FillingQuestion } from "../questions/FillingQuestion";
import { Question } from "../questions/Question";

export enum QuestionType {
  Choice = "choice",
  Filling = "filling",
}

export type QuestionStorageData =
  | {
      id: string;
      text: string;
      type: "choice";
      choices: string[];
      correctChoiceIndex: number;
    }
  | {
      id: string;
      text: string;
      type: "filling";
      correctAnswer: string;
    };

export class QuestionFactory {
  public static createQuestionId(baseId: string, seed: string) {
    return `${baseId}${generateMD5(`${seed}${new Date().toISOString()}`).slice(0, 8)}`;
  }

  public static createChoiceQuestion(params: {
    baseId: string;
    baseName: string;
    text: string;
    choices: string[];
    correctChoiceIndex: number;
    id?: string;
  }) {
    return new ChoiceQuestion(
      params.text,
      params.choices,
      params.correctChoiceIndex,
      params.id || QuestionFactory.createQuestionId(params.baseId, `${params.text}${params.choices.join("")}`),
      params.baseName
    );
  }

  public static createFillingQuestion(params: {
    baseId: string;
    baseName: string;
    text: string;
    correctAnswer: string;
    id?: string;
  }) {
    return new FillingQuestion(
      params.id || QuestionFactory.createQuestionId(params.baseId, `${params.text}${params.correctAnswer}`),
      params.text,
      params.correctAnswer,
      params.baseName
    );
  }

  public static createFromStorage(data: QuestionStorageData, baseName: string): Question {
    if (data.type === "choice") {
      return ChoiceQuestion.fromJSON(data, baseName);
    }

    return FillingQuestion.fromJSON(data, baseName);
  }

  public static toStorage(question: Question): QuestionStorageData {
    return question.toJSON() as QuestionStorageData;
  }
}
