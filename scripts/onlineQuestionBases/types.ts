export type RawRecord = Record<string, unknown>;

export interface OnlineQuestionBaseRepositoryConfig {
  id: string;
  name: string;
  repoUrl: string;
  branch: string;
  indexPath: string;
}

export interface OnlineQuestionBaseIndexItem {
  id: string;
  baseName: string;
  description?: string;
  author?: string;
  questionCount: number;
  filePath?: string;
  downloadUrl?: string;
  tags?: string[];
  updatedAt?: string;
}

export interface OnlineQuestionBaseIndex {
  formatVersion: number;
  updatedAt?: string;
  questionBases: OnlineQuestionBaseIndexItem[];
}

export interface OnlineQuestionBaseIndexCacheItem {
  fetchedAt: number;
  index: OnlineQuestionBaseIndex;
}

export interface OnlineQuestionBaseCatalogItem extends OnlineQuestionBaseIndexItem {
  repoId: string;
  repoName: string;
}

export const DEFAULT_REPOSITORY: OnlineQuestionBaseRepositoryConfig = {
  id: "default-community",
  name: "示例在线题库仓库",
  repoUrl: "https://github.com/zyf2007/MemoCard-QuestionBases",
  branch: "main",
  indexPath: "index.json",
};
