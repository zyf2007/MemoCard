import {
  ParsedQuestionBaseTransferPayload,
  QuestionBaseTransferMeta,
} from "./types";
import { ensureNonEmptyString, ensureRecord } from "./validators";

export function parseQuestionBaseTransferPayload(rawData: unknown): ParsedQuestionBaseTransferPayload {
  const data = ensureRecord(rawData, "JSON 顶层必须为对象");

  const baseName = ensureNonEmptyString(data.baseName, "题库名称（baseName）不能为空，且必须为字符串类型");
  if (!Array.isArray(data.questions)) {
    throw new Error("题目列表（questions）必须为数组类型");
  }
  if (data.questions.length === 0) {
    throw new Error("题目列表（questions）不能为空，请至少包含1道题目");
  }

  const formatVersion = typeof data.formatVersion === "number" ? data.formatVersion : undefined;
  const rawMeta = data.meta;
  const meta: QuestionBaseTransferMeta = {};
  if (rawMeta !== undefined) {
    const metaObj = ensureRecord(rawMeta, "元信息（meta）必须为对象类型");
    if (metaObj.author !== undefined) {
      meta.author = ensureNonEmptyString(metaObj.author, "元信息作者（meta.author）必须为非空字符串");
    }
    if (metaObj.questionCount !== undefined) {
      if (typeof metaObj.questionCount !== "number" || !Number.isInteger(metaObj.questionCount) || metaObj.questionCount < 0) {
        throw new Error("元信息题目数量（meta.questionCount）必须为非负整数");
      }
      meta.questionCount = metaObj.questionCount;
    }
  }

  const questions = data.questions.map((question, index) => {
    const item = ensureRecord(question, `第${index + 1}题格式错误：必须为对象`);
    const text = ensureNonEmptyString(item.text, `第${index + 1}题校验失败：题干（text）不能为空，且必须为字符串类型`);
    const type = item.type;

    if (item.id !== undefined) {
      throw new Error(`第${index + 1}题校验失败：题目不允许包含 id 字段`);
    }

    if (type === "choice") {
      if (!Array.isArray(item.choices) || item.choices.length !== 4) {
        throw new Error(`第${index + 1}题校验失败：选择题必须包含4个选项（choices数组长度必须为4）`);
      }
      const choices = item.choices.map((choice, choiceIndex) =>
        ensureNonEmptyString(choice, `第${index + 1}题校验失败：第${choiceIndex + 1}个选项不能为空，且必须为字符串类型`)
      );

      if (
        typeof item.correctChoiceIndex !== "number" ||
        !Number.isInteger(item.correctChoiceIndex) ||
        item.correctChoiceIndex < 1 ||
        item.correctChoiceIndex > 4
      ) {
        throw new Error(`第${index + 1}题校验失败：选择题正确答案索引（correctChoiceIndex）必须为1-4之间的整数`);
      }

      return {
        text,
        type: "choice" as const,
        choices,
        correctChoiceIndex: item.correctChoiceIndex,
      };
    }

    if (type === "filling") {
      const correctAnswer = ensureNonEmptyString(
        item.correctAnswer,
        `第${index + 1}题校验失败：填空题正确答案（correctAnswer）不能为空，且必须为字符串类型`
      );
      return {
        text,
        type: "filling" as const,
        correctAnswer,
      };
    }

    throw new Error(`第${index + 1}题校验失败：类型（type）必须为\"choice\"或\"filling\"`);
  });

  return {
    formatVersion,
    baseName,
    meta,
    questions,
  };
}

export function parseQuestionBaseTransferJson(jsonStr: string): ParsedQuestionBaseTransferPayload {
  let rawData: unknown;
  try {
    rawData = JSON.parse(jsonStr);
  } catch (parseError) {
    throw new Error(`JSON 格式错误：${(parseError as Error).message}`);
  }

  return parseQuestionBaseTransferPayload(rawData);
}
