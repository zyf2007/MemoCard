import { generateMD5 } from "../utils/CryptoUtils";
import {
  OnlineQuestionBaseIndex,
  OnlineQuestionBaseIndexCacheItem,
  OnlineQuestionBaseIndexItem,
  OnlineQuestionBaseRepositoryConfig,
  RawRecord,
} from "./types";

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

export function normalizeRepositoryConfig(raw: unknown): OnlineQuestionBaseRepositoryConfig | null {
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

export function parseIndexPayload(rawData: unknown): OnlineQuestionBaseIndex {
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

export function normalizeCacheMap(raw: unknown): Record<string, OnlineQuestionBaseIndexCacheItem> {
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

      const index = parseIndexPayload(parsedCache.index);
      output[repoId] = { fetchedAt, index };
    } catch {
      continue;
    }
  }

  return output;
}
