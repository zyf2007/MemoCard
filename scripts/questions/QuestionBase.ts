import { Alert } from "react-native";
import { Func } from "../utils/FuncSystem";
import { ChoiceQuestion } from "./ChoiceQuestion";
import { FillingQuestion } from "./FillingQuestion";
import { Question } from "./Question";

export class QuestionBase {
    // 题库名称：外部只读，内部可写
    private _baseName: string;
    public get baseName(): string {
        return this._baseName;
    }
    private set baseName(newName: string) {
        this._baseName = newName;
    }
    public onQuestionListUpdated: Func<() => void> = new Func();

    // 题目列表：外部只读，内部可写
    private _questions: Question[] = [];
    public get questions(): Question[] {
        return [...this._questions];
    }

    // 修改回调：触发数据持久化
    private readonly onUpdate: () => Promise<boolean>;

    /**
     * 构造函数
     * @param baseName 题库名称
     * @param rawQuestions 初始题目数据
     * @param onUpdate 修改后触发的持久化回调
     */
    constructor(baseName: string, rawQuestions: any, onUpdate: () => Promise<boolean>) {
        this._baseName = baseName;
        this._questions = this.parseJsonString(JSON.stringify(rawQuestions));
        this.onUpdate = onUpdate; // 绑定持久化回调
    }

    // 解析JSON为题目列表（原有逻辑）
    private parseJsonString(s: string): Question[] {
        const ret: Question[] = [];
        try {
            const rawQuestions = JSON.parse(s);
            for (const item of rawQuestions) {
                try {
                    let parsedQuestion: Question;
                    switch (item.type) {
                        case "choice":
                            parsedQuestion = ChoiceQuestion.fromJSON(item);
                            break;
                        case "filling":
                            parsedQuestion = FillingQuestion.fromJSON(item);
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

    /** 导入多题（批量添加） */
    public async importQuestions(questions: string): Promise<boolean> {
        this._questions = this._questions.concat(this.parseJsonString(questions));
        this.onQuestionListUpdated.invoke();
        return await this.onUpdate(); // 触发持久化
    }

    /** 添加单题 */
public async addQuestion(question: Question): Promise<boolean> {
    const existingIndex = this._questions.findIndex(q => q.id === question.id);
    
    if (existingIndex >= 0) {
        this._questions[existingIndex] = question;
    } else {
        this._questions.push(question);
    }
    
    this.onQuestionListUpdated.invoke();
    return await this.onUpdate();
}

    /** 按ID删除题目 */
    public async removeQuestionById(questionId: string): Promise<boolean> {
        const initialLength = this._questions.length;
        this._questions = this._questions.filter(q => q.id !== questionId);
        const isRemoved = this._questions.length < initialLength;
        if (isRemoved) {
            this.onQuestionListUpdated.invoke();
            return await this.onUpdate(); // 仅删除成功时触发持久化
        }
        return false;
    }

    // /** 按ID替换完整题目对象 */
    // public async replaceQuestionById(newQuestion: Question): Promise<boolean> {
    //     const targetIndex = this._questions.findIndex(q => q.id === newQuestion.id);
    //     if (targetIndex === -1) return false;

    //     this._questions[targetIndex] = newQuestion;
    //     this.onQuestionListUpdated.invoke();
    //     return await this.onUpdate(); // 触发持久化
    // }

    /** 修改题库名称（内置，操作后触发持久化） */
    public async rename(newName: string): Promise<boolean> {
        this._baseName = newName;
        return await this.onUpdate(); // 触发持久化
    }

    // 供Manager序列化使用的内部方法
    public getRawQuestions(): Question[] {
        return this._questions;
    }

    readonly test = async () => {
        return await this.onUpdate();
    }
}