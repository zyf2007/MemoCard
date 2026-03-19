import { ChoiceQuestion } from "../questions/ChoiceQuestion";
import { FillingQuestion } from "../questions/FillingQuestion";
import { Question } from "../questions/Question";
import {
  QuestionBaseTransferMeta,
  QuestionBaseTransferPayloadForExport,
} from "./types";

export function buildQuestionBaseTransferPayload(
  baseName: string,
  questions: Question[],
  meta?: QuestionBaseTransferMeta
): QuestionBaseTransferPayloadForExport {
  const normalizedBaseName = baseName.trim();
  const payloadMeta: QuestionBaseTransferMeta = {
    ...(meta || {}),
    questionCount: questions.length,
  };

  const payloadQuestions = questions.map((question) => {
    if (question.type === "choice") {
      const choiceQuestion = question as ChoiceQuestion;
      return {
        text: choiceQuestion.text,
        type: "choice" as const,
        choices: [...choiceQuestion.choices],
        correctChoiceIndex: choiceQuestion.correctChoiceIndex,
      };
    }

    const fillingQuestion = question as FillingQuestion;
    return {
      text: fillingQuestion.text,
      type: "filling" as const,
      correctAnswer: fillingQuestion.correctAnswer,
    };
  });

  return {
    formatVersion: 2,
    baseName: normalizedBaseName,
    meta: payloadMeta,
    questions: payloadQuestions,
  };
}
