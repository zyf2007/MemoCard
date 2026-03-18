import { Alert } from "react-native";
import { QuestionBaseLoader } from "../QuestionLoader/QuestionBaseLoader";
import { QuestionLoader } from "../QuestionLoader/QuestionLoader";
import { QuestionFactory } from "../QuestionFactory/questionFactory";
import { EventDispatcher } from "../utils/EventSystem";
import { LazySingletonBase } from "../utils/LazySingletonBase";
import { Question } from "./Question";
import { QuestionBase } from "./QuestionBase";
import { parseQuestionBaseTransferJson } from "./questionBaseTransfer";
import { QuestionBaseMetaInfo } from "../QuestionLoader/QuestionBase";

export interface QuestionBaseImportOptions {
    importedFrom?: string;
    subscriptionUrl?: string;
    subscriptionLabel?: string;
}

export class QuestionBaseManager extends LazySingletonBase<QuestionBaseManager> {
    public onQuestionBaseListUpdated = new EventDispatcher();
    public onQuestionUpdated = new EventDispatcher();
    public onQuestionBaseCreated = new EventDispatcher<[string]>();

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
                cachedBase.setMeta(base.meta || {});
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

    public getQuestionBaseList(): Array<{ id: string; name: string; meta: QuestionBaseMetaInfo }> {
        return [...this.baseCache.values()].map((item) => ({ id: item.baseId, name: item.baseName, meta: item.meta }));
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
        this.onQuestionBaseCreated.emit(newBase.id);
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

    public async importQuestionBaseFromJson(jsonStr: string, options?: QuestionBaseImportOptions): Promise<boolean> {
        await this.ready();

        try {
            const payload = parseQuestionBaseTransferJson(jsonStr);
            const baseName = payload.baseName;
            const author = payload.meta.author?.trim();
            const mergedMeta: QuestionBaseMetaInfo = {
                ...(author ? { author } : {}),
                ...(options?.importedFrom?.trim() ? { importedFrom: options.importedFrom.trim() } : {}),
                ...(options?.subscriptionUrl?.trim() ? { subscriptionUrl: options.subscriptionUrl.trim() } : {}),
                ...(options?.subscriptionLabel?.trim() ? { subscriptionLabel: options.subscriptionLabel.trim() } : {}),
                ...(options?.subscriptionUrl?.trim() ? { lastSyncedAt: new Date().toISOString() } : {}),
            };

            const newBaseMeta = await this.baseLoader.AddBase(baseName, mergedMeta);
            const validatedQuestions: Question[] = payload.questions.map((question) => {
                if (question.type === "choice") {
                    return QuestionFactory.createChoiceQuestion({
                        baseId: newBaseMeta.id,
                        baseName,
                        text: question.text,
                        choices: question.choices,
                        correctChoiceIndex: question.correctChoiceIndex,
                    });
                }

                return QuestionFactory.createFillingQuestion({
                    baseId: newBaseMeta.id,
                    baseName,
                    text: question.text,
                    correctAnswer: question.correctAnswer,
                });
            });

            await this.questionLoader.SaveQuestionBase(newBaseMeta.id, validatedQuestions);
            await this.syncBaseCache();
            this.onQuestionUpdated.emit();
            this.onQuestionBaseCreated.emit(newBaseMeta.id);

            Alert.alert(
                "导入成功",
                `题库「${baseName}」创建成功！\n有效题目数：${validatedQuestions.length}道`
            );
            return true;
        } catch (error) {
            Alert.alert("导入失败", `解析或创建题库时出错：${(error as Error).message}`);
            return false;
        }
    }

    public async refreshSubscribedQuestionBase(baseId: string): Promise<boolean> {
        await this.ready();
        const targetBase = this.getQuestionBaseById(baseId);
        if (!targetBase) {
            Alert.alert("更新失败", "未找到当前题库");
            return false;
        }

        const subscriptionUrl = targetBase.meta.subscriptionUrl?.trim();
        if (!subscriptionUrl) {
            Alert.alert("更新失败", "当前题库没有订阅链接");
            return false;
        }

        try {
            const response = await fetch(subscriptionUrl);
            if (!response.ok) {
                throw new Error(`请求失败（${response.status}）`);
            }

            const content = await response.text();
            const payload = parseQuestionBaseTransferJson(content);
            const validatedQuestions: Question[] = payload.questions.map((question) => {
                if (question.type === "choice") {
                    return QuestionFactory.createChoiceQuestion({
                        baseId: targetBase.baseId,
                        baseName: targetBase.baseName,
                        text: question.text,
                        choices: question.choices,
                        correctChoiceIndex: question.correctChoiceIndex,
                    });
                }

                return QuestionFactory.createFillingQuestion({
                    baseId: targetBase.baseId,
                    baseName: targetBase.baseName,
                    text: question.text,
                    correctAnswer: question.correctAnswer,
                });
            });

            await this.questionLoader.SaveQuestionBase(targetBase.baseId, validatedQuestions);
            await this.baseLoader.UpdateBaseMeta(targetBase.baseId, {
                ...(payload.meta.author?.trim() ? { author: payload.meta.author.trim() } : {}),
                lastSyncedAt: new Date().toISOString(),
            });

            await this.syncBaseCache();
            this.onQuestionUpdated.emit();
            Alert.alert("更新成功", `已更新题库，共 ${validatedQuestions.length} 道题`);
            return true;
        } catch (error) {
            Alert.alert("更新失败", `订阅更新失败：${(error as Error).message}`);
            return false;
        }
    }
}
