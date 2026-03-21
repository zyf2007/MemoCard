import AsyncStorage from "@react-native-async-storage/async-storage";
import { QuestionBaseManager } from "../questions";
import { EventDispatcher } from "../utils/EventSystem";
import { LazySingletonBase } from "../utils/LazySingletonBase";
import { QuestionConfig, QuestionGeneratorConfig } from "./QuestionGeneratorConfig";

const DEBUG_MODE = true;
const WEIGHT_MIN = 1;
const WEIGHT_MAX = 10;
const INITIAL_WEIGHT = 6;

export class QuestionGenerator extends LazySingletonBase<QuestionGenerator> {
    private readonly baseManager: QuestionBaseManager;
    private readonly config: QuestionGeneratorConfig = new QuestionGeneratorConfig();
    private readonly STORAGE_KEY = "QUESTION_GENERATOR";
    private readonly readyPromise: Promise<void>;
    private readonly _availableQuestionIdsTmp: string[] = [];
    private updateAvailableQuestionListToken = 0;

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
            void this.handleQuestionPoolChanged(true);
        });
        this.baseManager.onQuestionBaseCreated.on((baseId) => {
            void this.handleQuestionPoolChanged(false, baseId);
        });
        this.baseManager.onQuestionUpdated.on(() => {
            void this.handleQuestionPoolChanged(false);
        });
    }

    private resetTodayProgressForAllQuestions() {
        this.config.questionData.forEach((questionConfig) => {
            questionConfig.todayFinished = false;
        });
    }

    private async handleQuestionPoolChanged(shouldVerifyBases: boolean, autoEnableBaseId?: string) {
        await this.ready();
        if (autoEnableBaseId) {
            this.config.enabledQuestionBaseIds.add(autoEnableBaseId);
        }
        if (shouldVerifyBases) {
            await this.verifyQuestionBases();
        }
        this.resetTodayProgressForAllQuestions();
        await this.updateAvailableQuestionList();
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
            roundQuestionCount: this.config.roundQuestionCount,
            hideQuestionAfterSingleCorrectPerDay: this.config.hideQuestionAfterSingleCorrectPerDay,
        };
    }

    public async updateGeneratorConfig(config: {
        randomFactor?: number;
        roundQuestionCount?: number;
        hideQuestionAfterSingleCorrectPerDay?: boolean;
    }) {
        await this.ready();
        if (typeof config.randomFactor === "number") {
            this.config.randomFactor = Math.max(0, config.randomFactor);
        }
        if (typeof config.roundQuestionCount === "number") {
            this.config.roundQuestionCount = this.clamp(Math.floor(config.roundQuestionCount), 1, 500);
        }
        if (typeof config.hideQuestionAfterSingleCorrectPerDay === "boolean") {
            this.config.hideQuestionAfterSingleCorrectPerDay = config.hideQuestionAfterSingleCorrectPerDay;
        }
        await this.updateAvailableQuestionList();
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
            questionConfig.weight = this.clamp(questionConfig.weight - 1, WEIGHT_MIN, WEIGHT_MAX);
        } else {
            questionConfig.weight = this.clamp(questionConfig.weight + 1, WEIGHT_MIN, WEIGHT_MAX);
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
        const token = ++this.updateAvailableQuestionListToken;
        await this.baseManager.ready();

        const bases = await this.baseManager.getAllQuestionBases();
        const enabledBases = bases.filter((base) => this.config.enabledQuestionBaseIds.has(base.baseId));
        const questionLists = await Promise.all(enabledBases.map((base) => base.ensureQuestionsLoaded()));
        const allQuestions = questionLists.flat();

        const validQuestionIds = new Set(allQuestions.map((question) => question.id));
        const nextQuestionData = new Map(this.config.questionData);
        [...nextQuestionData.keys()]
            .filter((questionId) => !validQuestionIds.has(questionId))
            .forEach((questionId) => nextQuestionData.delete(questionId));

        const nextAvailableQuestionIds: string[] = [];
        allQuestions.forEach((question) => {
            const questionId = question.id;
            const existingConfig = nextQuestionData.get(questionId);
            if (this.config.hideQuestionAfterSingleCorrectPerDay && existingConfig?.todayFinished) {
                return;
            }

            const nextConfig = existingConfig || new QuestionConfig(questionId, INITIAL_WEIGHT);
            nextConfig.weight = this.clamp(nextConfig.weight, WEIGHT_MIN, WEIGHT_MAX);
            nextQuestionData.set(questionId, nextConfig);
            nextAvailableQuestionIds.push(questionId);
        });

        // Drop stale async runs to avoid duplicate append caused by interleaving updates.
        if (token !== this.updateAvailableQuestionListToken) {
            return;
        }

        this.config.questionData = nextQuestionData;
        this._availableQuestionIdsTmp.length = 0;
        this._availableQuestionIdsTmp.push(...nextAvailableQuestionIds);

        console.log("[QuestionGenerator] updateAvailableQuestionList ", this._availableQuestionIdsTmp.length, "Question(s)");
        this.shuffleQuestionsByWeight();
        const roundQuestionCount = this.clamp(Math.floor(this.config.roundQuestionCount), 1, 500);
        if (this._availableQuestionIdsTmp.length > roundQuestionCount) {
            this._availableQuestionIdsTmp.length = roundQuestionCount;
        }
        this.onQuestionCountChanged.emit(this._availableQuestionIdsTmp.length);
        await this.persistConfig();
    }

    private clamp(value: number, min: number, max: number) {
        return Math.min(Math.max(value, min), max);
    }
}
