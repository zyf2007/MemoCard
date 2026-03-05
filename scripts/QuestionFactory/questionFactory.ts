import { generateMD5 } from '../utils/CryptoUtils';
import { ChoiceQuestion } from './choiceQuestion';
import { FillingQuestion } from './fillingQuestion';
import { Question } from './question';

// 题型枚举
export enum QuestionType {
  Choice = 'choice',
  Filling = 'filling',
}

export type ChoiceQuestionData = {
  id: string;
  bankId: string;
  content: string;
  options: string[];
  correctIndex: number;
};

export type FillingQuestionData = {
  id: string;
  bankId: string;
  content: string;
  correctAnswer: string;
};

export type QuestionData =
  | ({ type: QuestionType.Choice } & ChoiceQuestionData)
  | ({ type: QuestionType.Filling } & FillingQuestionData);


export type CreateChoiceParams = Omit<ChoiceQuestionData, 'id'>;
export type CreateFillingParams = Omit<FillingQuestionData, 'id'>;


export class QuestionFactory {
  /**
   * 从 已解析的对象 创建题目（反序列化）
   */
  public static createFromObject(data: QuestionData): Question {
    switch (data.type) {
      case QuestionType.Choice:
        return new ChoiceQuestion(
          data.id,
          data.bankId,
          data.content,
          data.options,
          data.correctIndex
        );

      case QuestionType.Filling:
        return new FillingQuestion(
          data.id,
          data.bankId,
          data.content,
          data.correctAnswer
        );

      default:
        throw new Error('不支持的题目类型');
    }
  }

  /**
   * 只传入题库信息创建题目（自动生成 id）
   */
  public static createFromBank(
    type: QuestionType.Choice,
    params: CreateChoiceParams
  ): ChoiceQuestion;

  public static createFromBank(
    type: QuestionType.Filling,
    params: CreateFillingParams
  ): FillingQuestion;

  public static createFromBank(
    type: QuestionType,
    params: CreateChoiceParams | CreateFillingParams
  ): Question {
    // 生成规则 ID
    const now = new Date().toISOString();
    const hash = generateMD5(params.content + now).slice(0, 8);
    const id = `${params.bankId}-${hash}`;

    switch (type) {
      case QuestionType.Choice: {
        const p = params as CreateChoiceParams;
        return new ChoiceQuestion(
          id,
          p.bankId,
          p.content,
          p.options,
          p.correctIndex
        );
      }

      case QuestionType.Filling: {
        const p = params as CreateFillingParams;
        return new FillingQuestion(id, p.bankId, p.content, p.correctAnswer);
      }

      default:
        throw new Error('不支持的题目类型');
    }
  }
}