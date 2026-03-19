export interface QuestionBaseTransferMeta {
  author?: string;
  questionCount?: number;
}

export type QuestionBaseTransferQuestion =
  | {
      text: string;
      type: "choice";
      choices: string[];
      correctChoiceIndex: number;
    }
  | {
      text: string;
      type: "filling";
      correctAnswer: string;
    };

export interface ParsedQuestionBaseTransferPayload {
  formatVersion?: number;
  baseName: string;
  meta: QuestionBaseTransferMeta;
  questions: QuestionBaseTransferQuestion[];
}

export interface QuestionBaseTransferPayloadForExport {
  formatVersion: number;
  baseName: string;
  meta: QuestionBaseTransferMeta;
  questions: Array<
    | {
        text: string;
        type: "choice";
        choices: string[];
        correctChoiceIndex: number;
      }
    | {
        text: string;
        type: "filling";
        correctAnswer: string;
      }
  >;
}

export type RawRecord = Record<string, unknown>;
