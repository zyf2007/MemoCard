import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateMD5 } from "../utils/CryptoUtils";
import { LazySingletonBase } from "../utils/LazySingletonBase";

type RawRecord = Record<string, unknown>;

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

interface OnlineQuestionBaseIndexCacheItem {
  fetchedAt: number;
  index: OnlineQuestionBaseIndex;
}

export interface OnlineQuestionBaseCatalogItem extends OnlineQuestionBaseIndexItem {
  repoId: string;
  repoName: string;
}

const DEFAULT_REPOSITORY: OnlineQuestionBaseRepositoryConfig = {
  id: "default-community",
  name: "官方社区题库",
  repoUrl: "https://github.com/zyf2007/MemoCard-QuestionBases",
  branch: "main",
  indexPath: "index.json",
};

function ensureRecord(value: unknown, errorMessage: string): RawRecord {
  if (typeof value !== "object" || value === null) {
    throw new Error(errorMessage);
  }
  return value as RawRecord;
}

function ensureOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new Error("字符串字段格式错误");
  }
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

export class OnlineQuestionBaseRepositoryManager extends LazySingletonBase<OnlineQuestionBaseRepositoryManager> {
  private static readonly REPO_CONFIG_KEY = "OnlineQuestionBaseRepoConfigV1";
  private static readonly INDEX_CACHE_KEY = "OnlineQuestionBaseIndexCacheV1";

  private repositories: OnlineQuestionBaseRepositoryConfig[] = [];
  private indexCache: Record<string, OnlineQuestionBaseIndexCacheItem> = {};
  private readonly readyPromise: Promise<void>;

  constructor() {
    super();
    this.readyPromise = this.loadState();
  }

  public async ready() {
    await this.readyPromise;
  }

  private async loadState() {
    const [repoConfigJson, cacheJson] = await Promise.all([
      AsyncStorage.getItem(OnlineQuestionBaseRepositoryManager.REPO_CONFIG_KEY),
      AsyncStorage.getItem(OnlineQuestionBaseRepositoryManager.INDEX_CACHE_KEY),
    ]);

    if (repoConfigJson) {
      try {
        const parsed = JSON.parse(repoConfigJson) as unknown;
        if (Array.isArray(parsed)) {
          this.repositories = parsed
            .map((repo) => this.normalizeRepositoryConfig(repo))
            .filter((repo): repo is OnlineQuestionBaseRepositoryConfig => repo !== null);
        }
      } catch (error) {
        console.warn("[OnlineQuestionBaseRepositoryManager] 读取仓库配置失败", error);
      }
    }

    if (this.repositories.length === 0) {
      this.repositories = [DEFAULT_REPOSITORY];
      await this.persistRepositories();
    }

    if (cacheJson) {
      try {
        const parsed = JSON.parse(cacheJson) as unknown;
        this.indexCache = this.normalizeCacheMap(parsed);
      } catch (error) {
        console.warn("[OnlineQuestionBaseRepositoryManager] 读取索引缓存失败", error);
      }
    }
  }

  private normalizeRepositoryConfig(raw: unknown): OnlineQuestionBaseRepositoryConfig | null {
    try {
      const data = ensureRecord(raw, "仓库配置必须为对象");
      const id = ensureOptionalString(data.id);
      const name = ensureOptionalString(data.name);
      const repoUrl = ensureOptionalString(data.repoUrl);
      const branch = ensureOptionalString(data.branch);
      const indexPath = ensureOptionalString(data.indexPath);

      if (!id || !name || !repoUrl) {
        return null;
      }

      return {
        id,
        name,
        repoUrl,
        branch: branch || "main",
        indexPath: indexPath || "index.json",
      };
    } catch {
      return null;
    }
  }

  private normalizeCacheMap(raw: unknown): Record<string, OnlineQuestionBaseIndexCacheItem> {
    if (typeof raw !== "object" || raw === null) {
      return {};
    }

    const output: Record<string, OnlineQuestionBaseIndexCacheItem> = {};
    for (const [repoId, cacheItem] of Object.entries(raw as RawRecord)) {
      try {
        const parsedCache = ensureRecord(cacheItem, "缓存项必须为对象");
        const fetchedAt = parsedCache.fetchedAt;
        if (typeof fetchedAt !== "number" || !Number.isFinite(fetchedAt)) {
          continue;
        }

        const index = this.parseIndexPayload(parsedCache.index);
        output[repoId] = { fetchedAt, index };
      } catch {
        continue;
      }
    }

    return output;
  }

  private async persistRepositories() {
    await AsyncStorage.setItem(
      OnlineQuestionBaseRepositoryManager.REPO_CONFIG_KEY,
      JSON.stringify(this.repositories)
    );
  }

  private async persistIndexCache() {
    await AsyncStorage.setItem(
      OnlineQuestionBaseRepositoryManager.INDEX_CACHE_KEY,
      JSON.stringify(this.indexCache)
    );
  }

  public getRepositories() {
    return [...this.repositories];
  }

  public async addRepository(params: {
    repoUrl: string;
    name?: string;
    branch?: string;
    indexPath?: string;
  }) {
    await this.ready();
    const repoUrl = params.repoUrl.trim();
    if (!repoUrl) {
      throw new Error("仓库地址不能为空");
    }
    if (!/^https?:\/\//i.test(repoUrl)) {
      throw new Error("仓库地址必须是 http/https");
    }

    if (this.repositories.some((repo) => repo.repoUrl === repoUrl)) {
      throw new Error("该仓库已存在");
    }

    const id = generateMD5(`${repoUrl}-${Date.now()}`).slice(0, 12);
    const name = params.name?.trim() || this.deriveRepositoryName(repoUrl) || `仓库-${id.slice(0, 6)}`;
    const branch = params.branch?.trim() || "main";
    const indexPath = params.indexPath?.trim() || "index.json";

    this.repositories.push({ id, name, repoUrl, branch, indexPath });
    await this.persistRepositories();
  }

  public async removeRepository(repoId: string) {
    await this.ready();
    this.repositories = this.repositories.filter((repo) => repo.id !== repoId);
    delete this.indexCache[repoId];
    if (this.repositories.length === 0) {
      this.repositories = [DEFAULT_REPOSITORY];
    }
    await Promise.all([this.persistRepositories(), this.persistIndexCache()]);
  }

  public getCatalogFromCache(): OnlineQuestionBaseCatalogItem[] {
    return this.buildCatalogItems(this.indexCache);
  }

  public getCatalogItem(repoId: string, itemId: string) {
    const cacheItem = this.indexCache[repoId];
    if (!cacheItem) {
      return null;
    }

    const repo = this.repositories.find((item) => item.id === repoId);
    if (!repo) {
      return null;
    }

    const matched = cacheItem.index.questionBases.find((item) => item.id === itemId);
    if (!matched) {
      return null;
    }

    return {
      ...matched,
      repoId,
      repoName: repo.name,
    };
  }

  public async fetchCatalog(options?: { force?: boolean }) {
    await this.ready();
    const force = options?.force === true;
    const nextCache: Record<string, OnlineQuestionBaseIndexCacheItem> = { ...this.indexCache };
    const errors: string[] = [];

    for (const repo of this.repositories) {
      try {
        if (!force && nextCache[repo.id]) {
          continue;
        }

        const indexUrl = this.buildIndexUrl(repo);
        const response = await fetch(indexUrl);
        if (!response.ok) {
          throw new Error(`请求失败（${response.status}）`);
        }
        const indexJson = await response.json();
        const index = this.parseIndexPayload(indexJson);
        nextCache[repo.id] = {
          fetchedAt: Date.now(),
          index,
        };
      } catch (error) {
        errors.push(`${repo.name}：${(error as Error).message}`);
      }
    }

    this.indexCache = nextCache;
    await this.persistIndexCache();

    return {
      items: this.buildCatalogItems(this.indexCache),
      errors,
    };
  }

  public async fetchQuestionBaseJson(repoId: string, itemId: string) {
    await this.ready();
    const repo = this.repositories.find((item) => item.id === repoId);
    if (!repo) {
      throw new Error("仓库不存在");
    }
    const cacheItem = this.indexCache[repoId];
    if (!cacheItem) {
      throw new Error("仓库索引不存在，请先刷新索引");
    }
    const questionBase = cacheItem.index.questionBases.find((item) => item.id === itemId);
    if (!questionBase) {
      throw new Error("在线题库不存在");
    }

    const fileUrl = this.buildQuestionBaseFileUrl(repo, questionBase);
    if (!fileUrl) {
      throw new Error("题库文件地址无效，请检查仓库索引");
    }

    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`下载失败（${response.status}）`);
    }

    return response.text();
  }

  private buildCatalogItems(cacheMap: Record<string, OnlineQuestionBaseIndexCacheItem>) {
    const items: OnlineQuestionBaseCatalogItem[] = [];
    for (const repo of this.repositories) {
      const index = cacheMap[repo.id]?.index;
      if (!index) {
        continue;
      }
      for (const item of index.questionBases) {
        items.push({
          ...item,
          repoId: repo.id,
          repoName: repo.name,
        });
      }
    }

    return items;
  }

  private deriveRepositoryName(repoUrl: string) {
    const githubRepoMatch = repoUrl.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git|\/)?$/i);
    if (githubRepoMatch) {
      return `${githubRepoMatch[1]}/${githubRepoMatch[2]}`;
    }
    return undefined;
  }

  private buildIndexUrl(repo: OnlineQuestionBaseRepositoryConfig) {
    const rawPrefix = this.buildRawPrefix(repo);
    if (!rawPrefix) {
      return repo.repoUrl;
    }

    const normalizedIndexPath = repo.indexPath.replace(/^\/+/, "");
    return `${rawPrefix}${normalizedIndexPath}`;
  }

  private buildQuestionBaseFileUrl(repo: OnlineQuestionBaseRepositoryConfig, item: OnlineQuestionBaseIndexItem) {
    if (item.downloadUrl && /^https?:\/\//i.test(item.downloadUrl)) {
      return item.downloadUrl;
    }

    const rawPrefix = this.buildRawPrefix(repo);
    if (!rawPrefix || !item.filePath) {
      return null;
    }

    return `${rawPrefix}${item.filePath.replace(/^\/+/, "")}`;
  }

  private buildRawPrefix(repo: OnlineQuestionBaseRepositoryConfig) {
    const githubRepoMatch = repo.repoUrl.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git|\/)?$/i);
    if (!githubRepoMatch) {
      return null;
    }

    const owner = githubRepoMatch[1];
    const repository = githubRepoMatch[2];
    const branch = repo.branch.trim() || "main";
    return `https://raw.githubusercontent.com/${owner}/${repository}/${branch}/`;
  }

  private parseIndexPayload(rawData: unknown): OnlineQuestionBaseIndex {
    const data = ensureRecord(rawData, "索引文件必须为 JSON 对象");
    const rawList = Array.isArray(data.questionBases) ? data.questionBases : data.bases;
    if (!Array.isArray(rawList)) {
      throw new Error("索引文件缺少 questionBases 数组");
    }

    const formatVersion = typeof data.formatVersion === "number" ? data.formatVersion : 1;
    const updatedAt = ensureOptionalString(data.updatedAt);
    const questionBases: OnlineQuestionBaseIndexItem[] = rawList.map((item, index) => {
      const record = ensureRecord(item, `索引第${index + 1}项格式错误`);
      const id = ensureOptionalString(record.id) || generateMD5(`${record.baseName ?? record.filePath ?? index}`).slice(0, 12);
      const baseName = ensureOptionalString(record.baseName);
      if (!baseName) {
        throw new Error(`索引第${index + 1}项缺少 baseName`);
      }

      const rawCount = record.questionCount;
      if (typeof rawCount !== "number" || !Number.isInteger(rawCount) || rawCount < 0) {
        throw new Error(`索引第${index + 1}项 questionCount 必须为非负整数`);
      }

      const tags = Array.isArray(record.tags)
        ? record.tags.filter((tag): tag is string => typeof tag === "string" && tag.trim() !== "").map((tag) => tag.trim())
        : undefined;

      const filePath = ensureOptionalString(record.filePath);
      const downloadUrl = ensureOptionalString(record.downloadUrl);
      if (!filePath && !downloadUrl) {
        throw new Error(`索引第${index + 1}项必须至少提供 filePath 或 downloadUrl`);
      }

      return {
        id,
        baseName,
        description: ensureOptionalString(record.description),
        author: ensureOptionalString(record.author),
        questionCount: rawCount,
        filePath,
        downloadUrl,
        tags,
        updatedAt: ensureOptionalString(record.updatedAt),
      };
    });

    return {
      formatVersion,
      updatedAt,
      questionBases,
    };
  }
}
