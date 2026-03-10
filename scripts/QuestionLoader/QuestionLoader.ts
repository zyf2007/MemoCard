import AsyncStorage from "@react-native-async-storage/async-storage";
import { QuestionFactory, QuestionStorageData } from "../QuestionFactory/questionFactory";
import { Question } from "../questions";
import { LazySingletonBase } from "../utils/LazySingletonBase";
import { QuestionBaseLoader } from "./QuestionBaseLoader";

export class QuestionLoader extends LazySingletonBase<QuestionLoader> {
    readonly BaseMapKey = "QuestionBase - ";
    private readonly cache: Map<string, Question[]> = new Map();

    constructor() {
        super();
    }

    public async LoadQuestionBase(baseId: string, baseName: string) {
        if (this.cache.has(baseId)) {
            return [...this.cache.get(baseId)!];
        }

        const rawQuestions = JSON.parse(
            await AsyncStorage.getItem(this.BaseMapKey + baseId) || "[]"
        ) as QuestionStorageData[];
        const questions = rawQuestions.map((item) => QuestionFactory.createFromStorage(item, baseName));
        this.cache.set(baseId, questions);
        return [...questions];
    }

    public async GetQuestionById(questionId: string) {
        const baseId = questionId.slice(0, 8);
        const baseName = (await QuestionBaseLoader.getInstance().GetBaseById(baseId))?.name;
        if (!baseName) {
            return undefined;
        }

        const questions = await this.LoadQuestionBase(baseId, baseName);
        return questions.find((question) => question.id === questionId);
    }

    public async SaveQuestionBase(baseId: string, questions: Question[]) {
        this.cache.set(baseId, [...questions]);
        await AsyncStorage.setItem(
            this.BaseMapKey + baseId,
            JSON.stringify(questions.map((question) => QuestionFactory.toStorage(question)))
        );
    }

    public async DeleteQuestionBase(baseId: string) {
        this.UnLoadQuestionBase(baseId);
        await AsyncStorage.removeItem(this.BaseMapKey + baseId);
    }

    public UnLoadQuestionBase(baseId: string) {
        this.cache.delete(baseId);
    }

    public UnLoadAllQuestionBases() {
        this.cache.clear();
    }
}
