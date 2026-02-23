import AsyncStorage from "@react-native-async-storage/async-storage";
import { Question, QuestionBaseManager } from "../questions";
import { Func } from "../utils/FuncSystem";
import { LazySingletonBase } from "../utils/LazySingletonBase";
import { QuestionConfig, QuestionGeneratorConfig } from "./QuestionGeneratorConfig";
const DEBUG_MODE = true;

export class QuestionGenerator extends LazySingletonBase<QuestionGenerator> {
    //#region Init / Persist
    private readonly baseManager: QuestionBaseManager;
    private readonly config: QuestionGeneratorConfig = new QuestionGeneratorConfig();
    private readonly STORAGE_KEY = "QUESTION_GENERATOR";
    constructor() {
        super();
        this.baseManager = QuestionBaseManager.getInstance();
        this.Init();
    }

    private async Init() {
        const value = await AsyncStorage.getItem(this.STORAGE_KEY);
        const rawJson = value ? JSON.parse(value) : [];
        this.config.FromJson(rawJson);
        await this.verifyQuestionBases();
        this.updateAvailableQuestionList();
        this.subscribeEvents();
    }

    private async persistConfig() {
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config.ToJson()));
    }


    //#endregion Init / Persist

    //#region Event
    public onQuestionCountChanged: Func<(count: number) => void> = new Func();
    private subscribeEvents() {
        this.baseManager.onQuestionBaseListUpdated.subscribe(() => this.verifyQuestionBases());
        this.baseManager.onQuestionUpdated.subscribe(() => this.updateAvailableQuestionList());
    }
    //#endregion Event

    //#region API
    // test
    public resetAllQuestions() {
        this.config.questionData.clear();
        console.log("[QuestionGenerator] resetAllQuestions");
        this.updateAvailableQuestionList();
    }

    public async enableQuestionBase(questionBaseName: string) {
        this.config.enabledQuestionBaseNames.add(questionBaseName);
        this.updateAvailableQuestionList();
        await this.persistConfig();
    }

    public async disableQuestionBase(questionBaseName: string) {
        this.config.enabledQuestionBaseNames.delete(questionBaseName);
        this.updateAvailableQuestionList();
        await this.persistConfig();
    }


    public isQuestionBaseEnabled(questionBaseName: string) {
        return this.config.enabledQuestionBaseNames.has(questionBaseName);
    }
    public getEnabledQuestionBaseNames() {
        return [...this.config.enabledQuestionBaseNames];
    }

    public getQuestion(index: number) {
        return this._availableQuestionsTmp[index];
    }
    public finishQuestion(index: number, correct: boolean) {
        this.config.questionData.get(this._availableQuestionsTmp[index].id)!.todayFinished = correct;
        if (this.config.questionData.get(this._availableQuestionsTmp[index].id)!.weight > 1 &&
            this.config.questionData.get(this._availableQuestionsTmp[index].id)!.weight < 10) {
            if (correct) {
                this.config.questionData.get(this._availableQuestionsTmp[index].id)!.weight -= 1;
            } else {
                this.config.questionData.get(this._availableQuestionsTmp[index].id)!.weight += 1;
            }
        }

        this.persistConfig();
        console.log("[QuestionGenerator] finishQuestion ", this._availableQuestionsTmp[index].id, this.config.questionData.get(this._availableQuestionsTmp[index].id)!.todayFinished);
    }
    public getAvailableQuestionCount() {
        return this._availableQuestionsTmp.length;
    }
    //#endregion API

    private shuffleQuestionsByWeight(): void {
        const randomFactor = 1.5;
        this._availableQuestionsTmp.sort((a, b) => {
            const weightA = this.config.questionData.get(a.id)!.weight;
            const weightB = this.config.questionData.get(b.id)!.weight;
            const scoreA = weightA + (Math.random() - 0.5) * 2 * randomFactor;
            const scoreB = weightB + (Math.random() - 0.5) * 2 * randomFactor;
            return scoreB - scoreA;
        });
    }

    private async verifyQuestionBases() {
        this.config.enabledQuestionBaseNames = new Set([...this.config.enabledQuestionBaseNames].filter((name) => this.baseManager.hasQuestionBase(name)));
        await this.persistConfig();
        if (DEBUG_MODE) {
            console.log("[QuestionGenerator] verifyQuestionBases ", this.config.enabledQuestionBaseNames);
        }
    }
    private readonly _availableQuestionsTmp: Question[] = [];
    public updateAvailableQuestionList() {
        this._availableQuestionsTmp.length = 0;
        this.baseManager.getAllQuestionBases()
            // 过滤出已启用的问题库
            .filter(base => this.config.enabledQuestionBaseNames.has(base.baseName))
            // 拿到所有问题
            .flatMap(base => base.getRawQuestions())
            // 拿到没有记录和今天还没做过的问题
            .filter(q => {
                console.log(q.id, this.config.questionData.has(q.id) && this.config.questionData.get(q.id)!.todayFinished)
                return !(this.config.questionData.has(q.id) && this.config.questionData.get(q.id)!.todayFinished)
            })
            // 加入可以抽取的问题列表
            .map(question => { this._availableQuestionsTmp.push(question); return question; })
            // 在config中存入做题记录
            .forEach((q) => { if (!this.config.questionData.has(q.id)) this.config.questionData.set(q.id, new QuestionConfig(q.id)) });
        console.log("[QuestionGenerator] updateAvailableQuestionList ", this._availableQuestionsTmp.length, "Question(s)");
        // 按权重随机排序
        this.shuffleQuestionsByWeight();
        // console.log("[QuestionGenerator] updateAvailableQuestionConfig ", this.config.questionData);
        this.onQuestionCountChanged.invoke(this._availableQuestionsTmp.length);
        this.persistConfig();
    }
}