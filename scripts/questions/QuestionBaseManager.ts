import { Alert } from "react-native";
import { QuestionBaseLoader } from "../QuestionLoader/QuestionBaseLoader";
import { QuestionLoader } from "../QuestionLoader/QuestionLoader";
import { QuestionFactory } from "../QuestionFactory/questionFactory";
import { EventDispatcher } from "../utils/EventSystem";
import { LazySingletonBase } from "../utils/LazySingletonBase";
import { Question } from "./Question";
import { QuestionBase } from "./QuestionBase";

export class QuestionBaseManager extends LazySingletonBase<QuestionBaseManager> {
    public onQuestionBaseListUpdated = new EventDispatcher();
    public onQuestionUpdated = new EventDispatcher();

    private readonly baseLoader: QuestionBaseLoader;
    private readonly questionLoader: QuestionLoader;
    private readonly readyPromise: Promise<void>;
    private readonly baseCache: Map<string, QuestionBase> = new Map();

    constructor() {
        super();
        this.baseLoader = QuestionBaseLoader.getInstance();
        this.questionLoader = QuestionLoader.getInstance();
        this.readyPromise = this.init();
    }

    public async ready() {
        await this.readyPromise;
    }

    private async init() {
        await this.baseLoader.ready();
        this.baseLoader.onQuestionBaseMapUpdated.on(() => {
            void (async () => {
                await this.syncBaseCache();
                this.onQuestionBaseListUpdated.emit();
            })();
        });
        await this.syncBaseCache();
    }

    private async syncBaseCache() {
        const baseList = await this.baseLoader.GetBaseList();
        const validIds = new Set(baseList.map((base) => base.id));

        for (const base of baseList) {
            const cachedBase = this.baseCache.get(base.id);
            if (cachedBase) {
                cachedBase.rename(base.name);
                continue;
            }

            const runtimeBase = new QuestionBase(base);
            runtimeBase.onUpdate.on(this.onQuestionBaseUpdated);
            this.baseCache.set(base.id, runtimeBase);
        }

        [...this.baseCache.keys()]
            .filter((baseId) => !validIds.has(baseId))
            .forEach((baseId) => this.baseCache.delete(baseId));
    }

    public onQuestionBaseUpdated = async () => {
        this.onQuestionUpdated.emit();
        return true;
    };

    public async getAllQuestionBases(): Promise<QuestionBase[]> {
        await this.ready();
        return [...this.baseCache.values()];
    }

    public get questionBases(): QuestionBase[] {
        return [...this.baseCache.values()];
    }

    public getQuestionBaseNames(): string[] {
        return [...this.baseCache.values()].map((item) => item.baseName);
    }

    public getQuestionBaseList(): Array<{ id: string; name: string }> {
        return [...this.baseCache.values()].map((item) => ({ id: item.baseId, name: item.baseName }));
    }

    public getQuestionBaseByName(baseName: string): QuestionBase | undefined {
        return [...this.baseCache.values()].find((base) => base.baseName === baseName);
    }

    public getQuestionBaseById(baseId: string): QuestionBase | undefined {
        return this.baseCache.get(baseId);
    }

    public async hasQuestionBase(baseName: string): Promise<boolean> {
        await this.ready();
        return this.getQuestionBaseByName(baseName) !== undefined;
    }

    public async getQuestionBaseQuestions(baseName: string, forceReload: boolean = false): Promise<Question[]> {
        await this.ready();
        const questionBase = this.getQuestionBaseByName(baseName);
        if (!questionBase) {
            return [];
        }

        return questionBase.ensureQuestionsLoaded(forceReload);
    }

    public async getQuestionById(questionId: string) {
        await this.ready();
        return this.questionLoader.GetQuestionById(questionId);
    }

    public async createQuestionBase(baseName: string): Promise<QuestionBase | null> {
        await this.ready();
        const trimmedName = baseName.trim();
        if (!trimmedName) {
            Alert.alert("警告", "题库名称不能为空");
            return null;
        }

        const newBase = await this.baseLoader.AddBase(trimmedName);
        await this.questionLoader.SaveQuestionBase(newBase.id, []);
        await this.syncBaseCache();
        return this.baseCache.get(newBase.id) || null;
    }

    public async deleteQuestionBase(baseIdOrName: string): Promise<boolean> {
        await this.ready();
        const targetBase = this.getQuestionBaseById(baseIdOrName) || this.getQuestionBaseByName(baseIdOrName);
        if (!targetBase) {
            Alert.alert("警告", `未找到指定题库`);
            return false;
        }

        const deleted = await this.baseLoader.RemoveBase(targetBase.baseId);
        if (!deleted) {
            return false;
        }

        await this.questionLoader.DeleteQuestionBase(targetBase.baseId);
        this.baseCache.delete(targetBase.baseId);
        this.onQuestionUpdated.emit();
        return true;
    }

    public async renameQuestionBase(oldName: string, newName: string): Promise<boolean> {
        await this.ready();
        const targetBase = this.getQuestionBaseByName(oldName);
        if (!targetBase) {
            Alert.alert("警告", `未找到名称为「${oldName}」的题库`);
            return false;
        }

        const trimmedName = newName.trim();
        if (!trimmedName) {
            Alert.alert("警告", "题库名称不能为空");
            return false;
        }

        const renamed = await this.baseLoader.RenameBase(targetBase.baseId, trimmedName);
        if (!renamed) {
            return false;
        }

        targetBase.rename(trimmedName);
        this.onQuestionUpdated.emit();
        return true;
    }

    public async importQuestionBaseFromJson(jsonStr: string): Promise<boolean> {
        await this.ready();

        try {
            let rawData: any;
            try {
                rawData = JSON.parse(jsonStr);
            } catch (parseError) {
                throw new Error(`JSON格式错误：${(parseError as Error).message}`);
            }

            if (!rawData.baseName || typeof rawData.baseName !== "string" || rawData.baseName.trim() === "") {
                throw new Error("题库名称（baseName）不能为空，且必须为字符串类型");
            }
            if (!Array.isArray(rawData.questions)) {
                throw new Error("题目列表（questions）必须为数组类型");
            }
            if (rawData.questions.length === 0) {
                throw new Error("题目列表（questions）不能为空，请至少包含1道题目");
            }

            const baseName = rawData.baseName.trim();

            const newBaseMeta = await this.baseLoader.AddBase(baseName);
            const validatedQuestions: Question[] = [];
            let invalidCount = 0;

            for (let i = 0; i < rawData.questions.length; i++) {
                const question = rawData.questions[i];
                const questionIndex = i + 1;

                try {
                    if (typeof question !== "object" || question === null) {
                        throw new Error("非对象类型");
                    }
                    if (!question.text || typeof question.text !== "string" || question.text.trim() === "") {
                        throw new Error("题干（text）不能为空，且必须为字符串类型");
                    }
                    if (!question.type || !["choice", "filling"].includes(question.type)) {
                        throw new Error(`类型（type）必须为"choice"（选择题）或"filling"（填空题）`);
                    }

                    if (question.type === "choice") {
                        if (!Array.isArray(question.choices) || question.choices.length !== 4) {
                            throw new Error("选择题必须包含4个选项（choices数组长度必须为4）");
                        }
                        for (let j = 0; j < question.choices.length; j++) {
                            if (typeof question.choices[j] !== "string" || question.choices[j].trim() === "") {
                                throw new Error(`选择题第${j + 1}个选项不能为空，且必须为字符串类型`);
                            }
                        }
                        if (typeof question.correctChoiceIndex !== "number" ||
                            question.correctChoiceIndex < 1 ||
                            question.correctChoiceIndex > 4) {
                            throw new Error("选择题正确答案索引（correctChoiceIndex）必须为1-4之间的数字");
                        }

                        validatedQuestions.push(
                            QuestionFactory.createChoiceQuestion({
                                baseId: newBaseMeta.id,
                                baseName,
                                text: question.text.trim(),
                                choices: question.choices.map((choice: string) => choice.trim()),
                                correctChoiceIndex: question.correctChoiceIndex,
                            })
                        );
                    } else {
                        if (!question.correctAnswer || typeof question.correctAnswer !== "string" || question.correctAnswer.trim() === "") {
                            throw new Error("填空题正确答案（correctAnswer）不能为空，且必须为字符串类型");
                        }

                        validatedQuestions.push(
                            QuestionFactory.createFillingQuestion({
                                baseId: newBaseMeta.id,
                                baseName,
                                text: question.text.trim(),
                                correctAnswer: question.correctAnswer.trim(),
                            })
                        );
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

            if (invalidCount === rawData.questions.length) {
                await this.baseLoader.RemoveBase(newBaseMeta.id);
                throw new Error("所有题目均校验失败，终止题库导入");
            }

            await this.questionLoader.SaveQuestionBase(newBaseMeta.id, validatedQuestions);
            await this.syncBaseCache();
            this.onQuestionUpdated.emit();

            Alert.alert(
                "导入成功",
                `题库「${baseName}」创建成功！\n有效题目数：${validatedQuestions.length}道\n无效题目数：${invalidCount}道`
            );
            return true;
        } catch (error) {
            Alert.alert("导入失败", `解析或创建题库时出错：${(error as Error).message}`);
            return false;
        }
    }
}
