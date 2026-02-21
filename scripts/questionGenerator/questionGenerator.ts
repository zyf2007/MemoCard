import AsyncStorage from "@react-native-async-storage/async-storage";
import { QuestionBaseManager } from "../questions";
import { LazySingletonBase } from "../utils/LazySingletonBase";
import { QuestionGeneratorPersisted } from "./questionGeneratorPersisted";
const DEBUG_MODE = true;
export class QuestionGenerator extends LazySingletonBase<QuestionGenerator> {
    private readonly baseManager: QuestionBaseManager;
    private readonly config: QuestionGeneratorPersisted = new QuestionGeneratorPersisted();
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
        this.baseManager.onQuestionBaseListUpdated.subscribe(() => this.verifyQuestionBases());
    }

    private async persistConfig() {
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config));
    }

    public async enableQuestionBase(questionBaseName: string) {
        this.config.enabledQuestionBaseNames.push(questionBaseName);
        await this.persistConfig();
    }

    public async disableQuestionBase(questionBaseName: string) {
        this.config.enabledQuestionBaseNames = this.config.enabledQuestionBaseNames.filter((name) => name !== questionBaseName);
        await this.persistConfig();
    }

    private async verifyQuestionBases() {
        this.config.enabledQuestionBaseNames = this.config.enabledQuestionBaseNames.filter((name) => this.baseManager.hasQuestionBase(name));
        await this.persistConfig();
        if (DEBUG_MODE) {
            console.log("[QuestionGenerator] verifyQuestionBases ", this.config.enabledQuestionBaseNames);
        }
    }
    public isQuestionBaseEnabled(questionBaseName: string) {
        return this.config.enabledQuestionBaseNames.includes(questionBaseName);
    }


}