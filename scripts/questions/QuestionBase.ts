import { QuestionBase as QuestionBaseMeta } from "../QuestionLoader/QuestionBase";
import { QuestionLoader } from "../QuestionLoader/QuestionLoader";
import { generateMD5 } from "../utils/CryptoUtils";
import { EventDispatcher } from "../utils/EventSystem";
import { ChoiceQuestion } from "./ChoiceQuestion";
import { FillingQuestion } from "./FillingQuestion";
import { Question } from "./Question";

export class QuestionBase {
    private _baseName: string;
    private readonly _baseId: string;
    private _questions: Question[] = [];
    private hasLoadedQuestions = false;

    public readonly onUpdate = new EventDispatcher();

    constructor(meta: QuestionBaseMeta) {
        this._baseName = meta.name;
        this._baseId = meta.id;
    }

    public get baseName(): string {
        return this._baseName;
    }

    public get baseId(): string {
        return this._baseId;
    }

    public get questions(): Question[] {
        return [...this._questions];
    }

    public async ensureQuestionsLoaded(forceReload: boolean = false) {
        if (this.hasLoadedQuestions && !forceReload) {
            return [...this._questions];
        }

        this._questions = await QuestionLoader.getInstance().LoadQuestionBase(this._baseId, this._baseName);
        const migratedQuestions = this.migrateLegacyQuestionIds(this._questions);
        if (migratedQuestions) {
            this._questions = migratedQuestions;
            await QuestionLoader.getInstance().SaveQuestionBase(this._baseId, this._questions);
        }
        this.hasLoadedQuestions = true;
        return [...this._questions];
    }

    public async importQuestions(questions: Question[]) {
        await this.ensureQuestionsLoaded();
        this._questions = this._questions.concat(questions);
        await this.persist();
    }

    public async addQuestion(question: Question) {
        await this.ensureQuestionsLoaded();
        const existingIndex = this._questions.findIndex((q) => q.id === question.id);

        if (existingIndex >= 0) {
            this._questions[existingIndex] = question;
        } else {
            this._questions.push(question);
        }

        await this.persist();
    }

    public async removeQuestionById(questionId: string) {
        await this.ensureQuestionsLoaded();
        const initialLength = this._questions.length;
        this._questions = this._questions.filter((q) => q.id !== questionId);
        if (this._questions.length !== initialLength) {
            await this.persist();
        }
    }

    public rename(newName: string) {
        this._baseName = newName.trim();
    }

    public getRawQuestions(): Question[] {
        return [...this._questions];
    }

    public unloadQuestions() {
        this._questions = [];
        this.hasLoadedQuestions = false;
        QuestionLoader.getInstance().UnLoadQuestionBase(this._baseId);
    }

    private async persist() {
        await QuestionLoader.getInstance().SaveQuestionBase(this._baseId, this._questions);
        this.onUpdate.emit();
    }

    private migrateLegacyQuestionIds(questions: Question[]) {
        const usedIds = new Set<string>();
        let hasMigration = false;
        const migrated = questions.map((question, index) => {
            if (question.id.startsWith(this._baseId)) {
                usedIds.add(question.id);
                return question;
            }

            hasMigration = true;
            let migratedId = `${this._baseId}${generateMD5(`${question.id}`).slice(0, 8)}`;
            while (usedIds.has(migratedId)) {
                migratedId = `${this._baseId}${generateMD5(`${question.id}-${index}-${usedIds.size}`).slice(0, 8)}`;
            }
            usedIds.add(migratedId);

            if (question.type === "choice") {
                const choiceQuestion = question as ChoiceQuestion;
                return new ChoiceQuestion(
                    choiceQuestion.text,
                    choiceQuestion.choices,
                    choiceQuestion.correctChoiceIndex,
                    migratedId,
                    this._baseName
                );
            }

            const fillingQuestion = question as FillingQuestion;
            return new FillingQuestion(
                migratedId,
                fillingQuestion.text,
                fillingQuestion.correctAnswer,
                this._baseName
            );
        });

        return hasMigration ? migrated : null;
    }
}
