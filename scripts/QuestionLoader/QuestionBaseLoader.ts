import AsyncStorage from "@react-native-async-storage/async-storage";
import { EventDispatcher } from "../utils/EventSystem";
import { LazySingletonBase } from "../utils/LazySingletonBase";
import { QuestionBase, QuestionBaseMetaInfo } from "./QuestionBase";

type StoredQuestionBase = {
    id?: string;
    name: string;
    meta?: QuestionBaseMetaInfo;
};

export class QuestionBaseLoader extends LazySingletonBase<QuestionBaseLoader> {
    readonly BaseMapKey = "QuestionBaseMap";
    private _questionBaseMap: Map<string, QuestionBase> = new Map();
    private readonly readyPromise: Promise<void>;
    public readonly onQuestionBaseMapUpdated = new EventDispatcher();

    constructor() {
        super();
        this.readyPromise = this.loadQuestionBaseMap();
    }

    public async ready() {
        await this.readyPromise;
    }

    private async loadQuestionBaseMap() {
        const questionBaseMapString = await AsyncStorage.getItem(this.BaseMapKey) || "[]";
        const questionList = JSON.parse(questionBaseMapString) as Array<[string, StoredQuestionBase]>;
        this._questionBaseMap = new Map(
            questionList.map(([id, rawBase]) => [id, new QuestionBase(rawBase.name, rawBase.id || id, rawBase.meta)])
        );
        console.log("[QuestionBaseLoader] LoadedQuestionBaseMap", this._questionBaseMap);
    }

    private async persistQuestionBaseMap() {
        await AsyncStorage.setItem(
            this.BaseMapKey,
            JSON.stringify(
                [...this._questionBaseMap.entries()].map(([id, base]) => [id, base.toJSON()])
            )
        );
    }

    public async GetBaseList() {
        await this.ready();
        return [...this._questionBaseMap.values()];
    }

    public async GetBaseById(baseId: string) {
        await this.ready();
        return this._questionBaseMap.get(baseId);
    }

    public async GetBaseByName(baseName: string) {
        await this.ready();
        return [...this._questionBaseMap.values()].find((base) => base.name === baseName);
    }

    public async HasBase(baseName: string) {
        return (await this.GetBaseByName(baseName)) !== undefined;
    }

    public async AddBase(baseName: string, meta?: QuestionBaseMetaInfo) {
        await this.ready();
        const questionBase = new QuestionBase(baseName.trim(), undefined, meta);
        this._questionBaseMap.set(questionBase.id, questionBase);
        await this.persistQuestionBaseMap();
        this.onQuestionBaseMapUpdated.emit();
        return questionBase;
    }

    public async RenameBase(baseId: string, newBaseName: string) {
        await this.ready();
        const targetBase = this._questionBaseMap.get(baseId);
        if (!targetBase) {
            return false;
        }

        targetBase.name = newBaseName.trim();
        await this.persistQuestionBaseMap();
        this.onQuestionBaseMapUpdated.emit();
        return true;
    }

    public async UpdateBaseMeta(baseId: string, metaPatch: Partial<QuestionBaseMetaInfo>) {
        await this.ready();
        const targetBase = this._questionBaseMap.get(baseId);
        if (!targetBase) {
            return false;
        }

        targetBase.meta = {
            ...targetBase.meta,
            ...metaPatch,
        };
        await this.persistQuestionBaseMap();
        this.onQuestionBaseMapUpdated.emit();
        return true;
    }

    public async RemoveBase(baseId: string) {
        await this.ready();
        const deleted = this._questionBaseMap.delete(baseId);
        if (!deleted) {
            return false;
        }

        await this.persistQuestionBaseMap();
        this.onQuestionBaseMapUpdated.emit();
        return true;
    }
}
