import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateMD5 } from "../utils/CryptoUtils";
import { LazySingletonBase } from "../utils/LazySingletonBase";
import { isHttpOrHttpsUrl } from "../utils/url";
import { normalizeCacheMap, normalizeRepositoryConfig, parseIndexPayload } from "./parsers";
import {
  OnlineQuestionBaseCatalogItem,
  OnlineQuestionBaseIndexCacheItem,
  OnlineQuestionBaseRepositoryConfig,
  DEFAULT_REPOSITORY,
} from "./types";
import { buildIndexUrl, buildQuestionBaseFileUrl, deriveRepositoryName } from "./url";

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
            .map((repo) => normalizeRepositoryConfig(repo))
            .filter((repo): repo is OnlineQuestionBaseRepositoryConfig => repo !== null);
        }
      } catch (error) {
        console.warn("[OnlineQuestionBaseRepositoryManager] 读取仓库配置失败", error);
      }
    }

    if (repoConfigJson === null) {
      this.repositories = [DEFAULT_REPOSITORY];
      await this.persistRepositories();
    }

    if (cacheJson) {
      try {
        const parsed = JSON.parse(cacheJson) as unknown;
        this.indexCache = normalizeCacheMap(parsed);
      } catch (error) {
        console.warn("[OnlineQuestionBaseRepositoryManager] 读取索引缓存失败", error);
      }
    }
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
    if (!isHttpOrHttpsUrl(repoUrl)) {
      throw new Error("仓库地址必须是 http/https");
    }

    if (this.repositories.some((repo) => repo.repoUrl === repoUrl)) {
      throw new Error("该仓库已存在");
    }

    const id = generateMD5(`${repoUrl}-${Date.now()}`).slice(0, 12);
    const name = params.name?.trim() || deriveRepositoryName(repoUrl) || `仓库-${id.slice(0, 6)}`;
    const branch = params.branch?.trim() || "main";
    const indexPath = params.indexPath?.trim() || "index.json";

    this.repositories.push({ id, name, repoUrl, branch, indexPath });
    await this.persistRepositories();
  }

  public async removeRepository(repoId: string) {
    await this.ready();
    this.repositories = this.repositories.filter((repo) => repo.id !== repoId);
    delete this.indexCache[repoId];
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

        const indexUrl = buildIndexUrl(repo);
        const response = await fetch(indexUrl);
        if (!response.ok) {
          throw new Error(`请求失败（${response.status}）`);
        }
        const indexJson = await response.json();
        const index = parseIndexPayload(indexJson);
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

    const fileUrl = buildQuestionBaseFileUrl(repo, questionBase);
    if (!fileUrl) {
      throw new Error("题库文件地址无效，请检查仓库索引");
    }

    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`下载失败（${response.status}）`);
    }

    return response.text();
  }

  public getQuestionBaseDownloadUrl(repoId: string, itemId: string) {
    const repo = this.repositories.find((item) => item.id === repoId);
    if (!repo) {
      return null;
    }
    const cacheItem = this.indexCache[repoId];
    if (!cacheItem) {
      return null;
    }
    const questionBase = cacheItem.index.questionBases.find((item) => item.id === itemId);
    if (!questionBase) {
      return null;
    }

    return buildQuestionBaseFileUrl(repo, questionBase);
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
}
