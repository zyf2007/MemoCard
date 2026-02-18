import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import uuid from 'react-native-uuid';
import { Func } from "../utils/FuncSystem";
import { LazySingletonBase } from "../utils/LazySingletonBase";
import { QuestionBase } from "./QuestionBase";
export class QuestionBaseManager extends LazySingletonBase<QuestionBaseManager> {
    private readonly STORAGE_KEY = "QuestionBase";
    // 题库列表：外部只读，内部可写
    private _questionBases: QuestionBase[] = [];
    public get questionBases(): QuestionBase[] {
        return [...this._questionBases];
    }

    public onQuestionBaseListUpdated: Func<() => void> = new Func<() => void>();
    constructor() {
        super();
        this.init();
    }

    // 初始化：读取本地存储的题库数据
    private async init() {
        await this.readData();
    }

    // 读取本地数据（原有逻辑）
    private async readData() {
        try {
            const value = await AsyncStorage.getItem(this.STORAGE_KEY);
            const rawJson = value ? JSON.parse(value) : [];

            // 重构：读取数据时为每个题库绑定onUpdate回调
            this._questionBases = rawJson.map((item: any) => {
                return new QuestionBase(
                    item.baseName,
                    item.questions,
                    this.persistData
                );
            });
        } catch (error) {
            Alert.alert("错误", `读取题库数据失败：${(error as Error).message}`);
            this._questionBases = [];
        }
    }

    // 核心：持久化所有题库数据（private，仅内部/回调调用）
    public persistData = (async (): Promise<boolean> => {
        try {
            const serializableData = this._questionBases.map(base => ({
                baseName: base.baseName,
                questions: base.getRawQuestions().map(q => q.toJSON())
            }));
            await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(serializableData));
            return true;
        } catch (error) {
            Alert.alert("错误", `写入题库数据失败：${(error as Error).message}`);
            return false;
        }
    });

    /** 获取所有题库名称 */
    public getQuestionBaseNames(): string[] {
        return this._questionBases.map(item => item.baseName);
    }

    /** 根据名称获取题库实例（核心：支持链式调用） */
    public getQuestionBaseByName(baseName: string): QuestionBase | undefined {
        return this._questionBases.find(base => base.baseName === baseName);
    }

    /** 创建新题库（自动绑定持久化回调） */
    public async createQuestionBase(baseName: string): Promise<boolean> {
        if (this.getQuestionBaseByName(baseName)) {
            Alert.alert("警告", `名称「${baseName}」的题库已存在`);
            return false;
        }

        // 给新题库绑定onUpdate回调（指向Manager的persistData）
        const newQuestionBase = new QuestionBase(
            baseName,
            [],
            this.persistData
        );
        this._questionBases.push(newQuestionBase);
        // 触发列表更新回调
        this.onQuestionBaseListUpdated.invoke();

        // 创建后立即持久化
        return await this.persistData();
    }

    /** 删除整个题库 */
    public async deleteQuestionBase(baseName: string): Promise<boolean> {
        const initialLength = this._questionBases.length;
        this._questionBases = this._questionBases.filter(base => base.baseName !== baseName);

        const isDeleted = this._questionBases.length < initialLength;
        if (isDeleted) {
            // 删除成功则触发列表更新回调
            this.onQuestionBaseListUpdated.invoke();
            return await this.persistData(); // 删除成功则持久化
        }
        Alert.alert("警告", `未找到名称为「${baseName}」的题库`);
        return false;
    }

    /** 修改题库名称（代理调用QuestionBase的rename方法） */
    public async renameQuestionBase(oldName: string, newName: string): Promise<boolean> {
        const targetBase = this.getQuestionBaseByName(oldName);
        if (!targetBase) {
            Alert.alert("警告", `未找到名称为「${oldName}」的题库`);
            return false;
        }
        if (this.getQuestionBaseByName(newName)) {
            Alert.alert("警告", `名称「${newName}」已存在`);
            return false;
        }
        // 直接调用QuestionBase的rename方法（自动触发持久化）
        await targetBase.rename(newName);
        // 触发列表更新回调
        this.onQuestionBaseListUpdated.invoke();
        return true;
    }


    public async importQuestionBaseFromJson(jsonStr: string): Promise<boolean> {
        try {
            // 1. 解析JSON字符串并做基础校验
            let rawData: any;
            try {
                rawData = JSON.parse(jsonStr);
            } catch (parseError) {
                throw new Error(`JSON格式错误：${(parseError as Error).message}`);
            }

            // 2. 校验题库核心字段
            if (!rawData.baseName || typeof rawData.baseName !== "string" || rawData.baseName.trim() === "") {
                throw new Error("题库名称（baseName）不能为空，且必须为字符串类型");
            }
            if (!Array.isArray(rawData.questions)) {
                throw new Error("题目列表（questions）必须为数组类型");
            }
            if (rawData.questions.length === 0) {
                throw new Error("题目列表（questions）不能为空，请至少包含1道题目");
            }

            // 3. 检查题库名称是否已存在
            const baseName = rawData.baseName.trim();
            if (this.getQuestionBaseByName(baseName)) {
                Alert.alert("警告", `名称「${baseName}」的题库已存在，无法重复创建`);
                return false;
            }

            // 4. 对每道题目进行完整性校验，并自动生成ID
            const validatedQuestions: any[] = [];
            let invalidCount = 0;
            for (let i = 0; i < rawData.questions.length; i++) {
                const question = rawData.questions[i];
                const questionIndex = i + 1; // 便于提示第几题出错

                try {
                    // 基础字段校验
                    if (typeof question !== "object" || question === null) {
                        throw new Error("非对象类型");
                    }
                    if (!question.text || typeof question.text !== "string" || question.text.trim() === "") {
                        throw new Error("题干（text）不能为空，且必须为字符串类型");
                    }
                    if (!question.type || !["choice", "filling"].includes(question.type)) {
                        throw new Error(`类型（type）必须为"choice"（选择题）或"filling"（填空题）`);
                    }

                    // 按题型细分校验
                    if (question.type === "choice") {
                        // 选择题校验
                        if (!Array.isArray(question.choices) || question.choices.length !== 4) {
                            throw new Error("选择题必须包含4个选项（choices数组长度必须为4）");
                        }
                        // 校验每个选项
                        for (let j = 0; j < question.choices.length; j++) {
                            if (typeof question.choices[j] !== "string" || question.choices[j].trim() === "") {
                                throw new Error(`选择题第${j + 1}个选项不能为空，且必须为字符串类型`);
                            }
                        }
                        // 校验正确答案索引
                        if (typeof question.correctChoiceIndex !== "number" ||
                            question.correctChoiceIndex < 1 ||
                            question.correctChoiceIndex > 4) {
                            throw new Error("选择题正确答案索引（correctChoiceIndex）必须为1-4之间的数字");
                        }

                        // 生成UUID并组装校验后的选择题数据
                        validatedQuestions.push({
                            id: uuid.v1() as string, // 自动生成ID
                            text: question.text.trim(),
                            type: "choice",
                            choices: question.choices.map((c: string) => c.trim()),
                            correctChoiceIndex: question.correctChoiceIndex
                        });

                    } else if (question.type === "filling") {
                        // 填空题校验
                        if (!question.correctAnswer || typeof question.correctAnswer !== "string" || question.correctAnswer.trim() === "") {
                            throw new Error("填空题正确答案（correctAnswer）不能为空，且必须为字符串类型");
                        }

                        // 生成UUID并组装校验后的填空题数据
                        validatedQuestions.push({
                            id: uuid.v1() as string, // 自动生成ID
                            text: question.text.trim(),
                            type: "filling",
                            correctAnswer: question.correctAnswer.trim()
                        });
                    }

                } catch (questionError) {
                    invalidCount++;
                    Alert.alert(
                        `第${questionIndex}题校验失败`,
                        (questionError as Error).message,
                        [{ text: "知道了" }]
                    );
                }
            }

            // 5. 若无效题目数等于总题目数，终止导入
            if (invalidCount === rawData.questions.length) {
                throw new Error("所有题目均校验失败，终止题库导入");
            }

            // 6. 创建新题库并导入校验后的题目
            const newQuestionBase = new QuestionBase(
                baseName,
                validatedQuestions,
                this.persistData
            );
            this._questionBases.push(newQuestionBase);

            // 7. 触发回调和持久化
            this.onQuestionBaseListUpdated.invoke();
            const persistResult = await this.persistData();

            if (persistResult) {
                const successCount = validatedQuestions.length;
                Alert.alert(
                    "导入成功",
                    `题库「${baseName}」创建成功！\n有效题目数：${successCount}道\n无效题目数：${invalidCount}道`
                );
            }
            return persistResult;

        } catch (error) {
            Alert.alert("导入失败", `解析或创建题库时出错：${(error as Error).message}`);
            return false;
        }
    }
}