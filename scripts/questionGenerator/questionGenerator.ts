import AsyncStorage from "@react-native-async-storage/async-storage";
import { QuestionBaseManager } from "../questions";
import { EventDispatcher } from "../utils/EventSystem";
import { LazySingletonBase } from "../utils/LazySingletonBase";
import { QuestionConfig, QuestionGeneratorConfig } from "./QuestionGeneratorConfig";

const DEBUG_MODE = true;

export class QuestionGenerator extends LazySingletonBase<QuestionGenerator> {
    private readonly baseManager: QuestionBaseManager;
    private readonly config: QuestionGeneratorConfig = new QuestionGeneratorConfig();
    private readonly STORAGE_KEY = "QUESTION_GENERATOR";
    private readonly readyPromise: Promise<void>;
    private readonly _availableQuestionIdsTmp: string[] = [];

    public onQuestionCountChanged = new EventDispatcher<[number]>();

    constructor() {
        super();
        this.baseManager = QuestionBaseManager.getInstance();
        this.readyPromise = this.Init();
    }

    public async ready() {
        await this.readyPromise;
    }

    private async Init() {
        await this.baseManager.ready();
        const value = await AsyncStorage.getItem(this.STORAGE_KEY);
        const rawJson = value ? JSON.parse(value) : [];
        this.config.FromJson(rawJson);
        await this.migrateLegacyEnabledQuestionBases(rawJson);
        await this.verifyQuestionBases();
        await this.updateAvailableQuestionList();
        this.subscribeEvents();
    }

    private async persistConfig() {
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config.ToJson()));
    }

    private async migrateLegacyEnabledQuestionBases(rawJson: any) {
        const legacyNames = Array.isArray(rawJson?.enabledQuestionBaseNames)
            ? rawJson.enabledQuestionBaseNames as string[]
            : [];

        if (this.config.enabledQuestionBaseIds.size > 0 || legacyNames.length === 0) {
            return;
        }

        const bases = await this.baseManager.getAllQuestionBases();
        legacyNames.forEach((name) => {
            bases
                .filter((base) => base.baseName === name)
                .forEach((base) => this.config.enabledQuestionBaseIds.add(base.baseId));
        });
    }

    private subscribeEvents() {
        this.baseManager.onQuestionBaseListUpdated.on(() => {
            void this.verifyQuestionBases();
            void this.updateAvailableQuestionList();
        });
        this.baseManager.onQuestionUpdated.on(() => {
            void this.updateAvailableQuestionList();
        });
    }

    public async resetAllQuestions() {
        await this.ready();
        this.config.questionData.clear();
        console.log("[QuestionGenerator] resetAllQuestions");
        await this.updateAvailableQuestionList();
    }

    public async enableQuestionBase(questionBaseId: string) {
        await this.ready();
        this.config.enabledQuestionBaseIds.add(questionBaseId);
        await this.updateAvailableQuestionList();
        await this.persistConfig();
    }

    public async disableQuestionBase(questionBaseId: string) {
        await this.ready();
        this.config.enabledQuestionBaseIds.delete(questionBaseId);
        await this.updateAvailableQuestionList();
        await this.persistConfig();
    }

    public isQuestionBaseEnabled(questionBaseId: string) {
        return this.config.enabledQuestionBaseIds.has(questionBaseId);
    }

    public getEnabledQuestionBaseIds() {
        return [...this.config.enabledQuestionBaseIds];
    }

    public getQuestionId(index: number) {
        return this._availableQuestionIdsTmp[index];
    }

    public getConfigSnapshot() {
        return {
            randomFactor: this.config.randomFactor,
            weightMin: this.config.weightMin,
            weightMax: this.config.weightMax,
            initialWeight: this.config.initialWeight,
        };
    }

    public async updateGeneratorConfig(config: {
        randomFactor?: number;
        weightMin?: number;
        weightMax?: number;
        initialWeight?: number;
    }) {
        await this.ready();
        let shouldClampWeights = false;
        if (typeof config.randomFactor === "number") {
            this.config.randomFactor = Math.max(0, config.randomFactor);
        }
        if (typeof config.weightMin === "number") {
            this.config.weightMin = Math.max(1, Math.floor(config.weightMin));
            shouldClampWeights = true;
        }
        if (typeof config.weightMax === "number") {
            this.config.weightMax = Math.max(1, Math.floor(config.weightMax));
            shouldClampWeights = true;
        }
        if (this.config.weightMax < this.config.weightMin) {
            const temp = this.config.weightMax;
            this.config.weightMax = this.config.weightMin;
            this.config.weightMin = temp;
            shouldClampWeights = true;
        }
        if (typeof config.initialWeight === "number") {
            const initial = Math.floor(config.initialWeight);
            this.config.initialWeight = this.clamp(initial, this.config.weightMin, this.config.weightMax);
        }
        if (shouldClampWeights) {
            this.config.questionData.forEach((value) => {
                value.weight = this.clamp(value.weight, this.config.weightMin, this.config.weightMax);
            });
        }
        await this.persistConfig();
    }

    public async finishQuestion(index: number, correct: boolean) {
        await this.ready();
        const questionId = this._availableQuestionIdsTmp[index];
        if (!questionId) {
            return;
        }

        const questionConfig = this.config.questionData.get(questionId)!;
        questionConfig.todayFinished = correct;
        if (correct) {
            questionConfig.weight = this.clamp(questionConfig.weight - 1, this.config.weightMin, this.config.weightMax);
        } else {
            questionConfig.weight = this.clamp(questionConfig.weight + 1, this.config.weightMin, this.config.weightMax);
        }

        await this.persistConfig();
        console.log("[QuestionGenerator] finishQuestion ", questionId, this.config.questionData.get(questionId)!.todayFinished);
    }

    public getAvailableQuestionCount() {
        return this._availableQuestionIdsTmp.length;
    }

    private shuffleQuestionsByWeight(): void {
        const randomFactor = this.config.randomFactor;
        this._availableQuestionIdsTmp.sort((a, b) => {
            const weightA = this.config.questionData.get(a)!.weight;
            const weightB = this.config.questionData.get(b)!.weight;
            const scoreA = weightA + (Math.random() - 0.5) * 2 * randomFactor;
            const scoreB = weightB + (Math.random() - 0.5) * 2 * randomFactor;
            return scoreB - scoreA;
        });
    }

    private async verifyQuestionBases() {
        await this.baseManager.ready();
        this.config.enabledQuestionBaseIds = new Set(
            [...this.config.enabledQuestionBaseIds].filter((id) => this.baseManager.getQuestionBaseById(id))
        );
        if (DEBUG_MODE) {
            console.log("[QuestionGenerator] verifyQuestionBases ", this.config.enabledQuestionBaseIds);
        }
        await this.persistConfig();
    }

    public async updateAvailableQuestionList() {
        await this.baseManager.ready();
        this._availableQuestionIdsTmp.length = 0;
        const bases = await this.baseManager.getAllQuestionBases();
        const enabledBases = bases.filter((base) => this.config.enabledQuestionBaseIds.has(base.baseId));
        const questionLists = await Promise.all(enabledBases.map((base) => base.ensureQuestionsLoaded()));
        const allQuestions = questionLists.flat();
        const validQuestionIds = new Set(allQuestions.map((question) => question.id));
        this.config.RemoveInvalidQuestions(validQuestionIds);

        allQuestions
            .filter((q) => !(this.config.questionData.has(q.id) && this.config.questionData.get(q.id)!.todayFinished))
            .map((question) => question.id)
            .forEach((questionId) => {
                if (!this.config.questionData.has(questionId)) {
                    this.config.questionData.set(questionId, new QuestionConfig(questionId, this.config.initialWeight));
                }
                this._availableQuestionIdsTmp.push(questionId);
            });

        console.log("[QuestionGenerator] updateAvailableQuestionList ", this._availableQuestionIdsTmp.length, "Question(s)");
        this.shuffleQuestionsByWeight();
        this.onQuestionCountChanged.emit(this._availableQuestionIdsTmp.length);
        await this.persistConfig();
    }

    private clamp(value: number, min: number, max: number) {
        return Math.min(Math.max(value, min), max);
    }
}
