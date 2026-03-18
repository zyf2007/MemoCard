import { generateQuestionBaseId } from "../utils/IdGenerator";

export interface QuestionBaseMetaInfo {
    author?: string;
    importedFrom?: string;
    subscriptionUrl?: string;
    subscriptionLabel?: string;
    lastSyncedAt?: string;
}

export class QuestionBase {
    public name: string;
    public id: string;
    public meta: QuestionBaseMetaInfo;

    constructor(name: string, id?: string, meta?: QuestionBaseMetaInfo) {
        this.name = name.trim();
        this.id = id || generateQuestionBaseId(this.name);
        this.meta = { ...(meta || {}) };
    }

    public toJSON(): { id: string; name: string; meta?: QuestionBaseMetaInfo } {
        const normalizedMeta: QuestionBaseMetaInfo = {};
        if (this.meta.author?.trim()) {
            normalizedMeta.author = this.meta.author.trim();
        }
        if (this.meta.importedFrom?.trim()) {
            normalizedMeta.importedFrom = this.meta.importedFrom.trim();
        }
        if (this.meta.subscriptionUrl?.trim()) {
            normalizedMeta.subscriptionUrl = this.meta.subscriptionUrl.trim();
        }
        if (this.meta.subscriptionLabel?.trim()) {
            normalizedMeta.subscriptionLabel = this.meta.subscriptionLabel.trim();
        }
        if (this.meta.lastSyncedAt?.trim()) {
            normalizedMeta.lastSyncedAt = this.meta.lastSyncedAt.trim();
        }

        return {
            id: this.id,
            name: this.name,
            meta: Object.keys(normalizedMeta).length > 0 ? normalizedMeta : undefined,
        };
    }
}
