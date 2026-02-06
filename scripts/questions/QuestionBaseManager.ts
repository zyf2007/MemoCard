import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { LazySingletonBase } from "../utils/LazySingletonBase";
import { ChoiceQuestion } from "./ChoiceQuestion";
import { FillingQuestion } from "./FillingQuestion";
import { Question } from "./Question";

export type AddQuestionRequest = ChoiceQuestion | FillingQuestion;

export class QuestionBaseManager extends LazySingletonBase<QuestionBaseManager> {
    private readonly STORAGE_KEY = "QuestionBase";
    private questions: Question[] = [];
    public getQuestionBaseNames(): string[]{
        return [ "测试题库1", "测试题库2", "测试题库3", "测试题库4"];
    }
    constructor() {
        super();
        this.init();
    }

    private async init() {
        await this.readData();
    }

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
            this.questions = [];
        }
        return ret;
    }

    private async readData() {
        const value = await AsyncStorage.getItem(this.STORAGE_KEY);
        this.questions = this.parseJsonString(value ?? "[]");
    }

    async saveQuestion(question: AddQuestionRequest) {
        try {
            this.questions.push(question);
            await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.questions));
            Alert.alert("成功", "题目保存成功");
        } catch (error) {
            Alert.alert("错误", `保存失败：${(error as Error).message}`);
        }
    }

    public importQuestions(questions: string) {
        this.questions = this.questions.concat(this.parseJsonString(questions));
    }
    getQuestions(): Question[] {
        // 返回副本，防止外部直接修改内部状态
        return [...this.questions];
    }
}