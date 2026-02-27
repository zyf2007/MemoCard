import { Alert } from "react-native";
import { Func } from "../utils/FuncSystem";
import { ChoiceQuestion } from "./ChoiceQuestion";
import { FillingQuestion } from "./FillingQuestion";
import { Question } from "./Question";

export class QuestionBase {
    //#region Init / Persistence
    private _baseName: string;
    public get baseName(): string {
        return this._baseName;
    }
    private set baseName(newName: string) {
        this._baseName = newName;
    }


    private _questions: Question[] = [];
    public get questions(): Question[] {
        return [...this._questions];
    }

    // 解析JSON为题目列表
    private parseJsonString(s: string): Question[] {
        const ret: Question[] = [];
        try {
            const rawQuestions = JSON.parse(s);
            for (const item of rawQuestions) {
                try {
                    let parsedQuestion: Question;
                    switch (item.type) {
                        case "choice":
                            parsedQuestion = ChoiceQuestion.fromJSON(item, this.baseName);
                            break;
                        case "filling":
                            parsedQuestion = FillingQuestion.fromJSON(item, this.baseName);
                            break;
                        default:
                            throw new Error(`未知的题目类型: ${item.type}`);
                    }
                    ret.push(parsedQuestion);
                } catch (parseError) {
                    Alert.alert("数据解析警告", (parseError as Error).message);
                }
            }
        } catch (error) {
            Alert.alert("错误", `读取失败：${(error as Error).message}`);
            return [];
        }
        return ret;
    }

    /**
     * 构造函数
     * @param baseName 题库名称
     * @param rawQuestions 初始题目数据
     * @param onUpdate 修改后触发的持久化回调
     */
    constructor(baseName: string, rawQuestions: any) {
        this._baseName = baseName;
        this._questions = this.parseJsonString(JSON.stringify(rawQuestions));
    }
    //#endregion Init

    //#region Events
    // 修改回调：触发数据持久化
    public readonly onUpdate: Func<() => void> = new Func();
    //#endregion Events

    //#region API
    

    /** 导入多题（批量添加） */
    public importQuestions(questions: string) {
        this._questions = this._questions.concat(this.parseJsonString(questions));
        this.onUpdate.invoke();
    }

    /** 添加单题 */
    public addQuestion(question: Question){
        const existingIndex = this._questions.findIndex(q => q.id === question.id);

        if (existingIndex >= 0) {
            this._questions[existingIndex] = question;
            console.log(`已更新题目 ID: ${question.id}`);
        } else {
            console.log(`已添加新题目 ID: ${question.id}`);
            this._questions.push(question);
        }

        this.onUpdate.invoke();
    }

    /** 按ID删除题目 */
    public removeQuestionById(questionId: string){
        const initialLength = this._questions.length;
        this._questions = this._questions.filter(q => q.id !== questionId);
        const isRemoved = this._questions.length < initialLength;
        if (isRemoved) {
            this.onUpdate.invoke();
        }
        else {
            console.log(`[QuestionBase] ${this.baseName} 未找到题目 ID: ${questionId}`);
        }
    }

    /** 修改题库名称（内置，操作后触发持久化） */
    public rename(newName: string){
        this._baseName = newName;
        this.onUpdate.invoke();
    }

    public getRawQuestions(): Question[] {
        return this._questions;
    }
    //#endregion API


}