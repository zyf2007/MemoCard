import AsyncStorage from "@react-native-async-storage/async-storage";
import { LazySingletonBase } from "../utils/LazySingletonBase";

type AppBackupPayload = {
  format: "MemoCardBackup";
  version: 1;
  exportedAt: string;
  data: Record<string, string>;
};

type ImportSummary = {
  importedKeyCount: number;
  removedKeyCount: number;
};

export class AppDataTransferManager extends LazySingletonBase<AppDataTransferManager> {
  private readonly exactManagedKeys = new Set([
    "QuestionBaseMap",
    "QUESTION_GENERATOR",
    "question_statistics",
    "OnlineQuestionBaseRepoConfigV1",
    "OnlineQuestionBaseIndexCacheV1",
  ]);

  private readonly managedKeyPrefixes = ["QuestionBase - "];

  constructor() {
    super();
  }

  public async exportToJson() {
    const payload = await this.exportPayload();
    return JSON.stringify(payload, null, 2);
  }

  public async importFromJson(jsonText: string): Promise<ImportSummary> {
    const payload = this.parsePayload(jsonText);
    const incomingEntries = Object.entries(payload.data).filter(([key]) => this.isManagedStorageKey(key));
    if (incomingEntries.length === 0) {
      throw new Error("备份文件中没有可导入的应用数据");
    }

    const existingManagedKeys = await this.getCurrentManagedStorageKeys();
    await AsyncStorage.multiRemove(existingManagedKeys);
    await AsyncStorage.multiSet(incomingEntries);

    return {
      importedKeyCount: incomingEntries.length,
      removedKeyCount: existingManagedKeys.length,
    };
  }

  private async exportPayload(): Promise<AppBackupPayload> {
    const keys = await this.getCurrentManagedStorageKeys();
    const entries = await AsyncStorage.multiGet(keys);
    const data = Object.fromEntries(entries.filter(([, value]) => value !== null) as [string, string][]);

    return {
      format: "MemoCardBackup",
      version: 1,
      exportedAt: new Date().toISOString(),
      data,
    };
  }

  private parsePayload(jsonText: string): AppBackupPayload {
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(jsonText);
    } catch (error) {
      throw new Error(`JSON 解析失败：${(error as Error).message}`);
    }

    if (!parsed || typeof parsed !== "object") {
      throw new Error("备份内容格式无效");
    }

    const payload = parsed as Partial<AppBackupPayload>;
    if (payload.format !== "MemoCardBackup") {
      throw new Error("备份格式不兼容（缺少 MemoCardBackup 标识）");
    }
    if (payload.version !== 1) {
      throw new Error(`备份版本不支持：${String(payload.version)}`);
    }
    if (!payload.data || typeof payload.data !== "object") {
      throw new Error("备份数据区缺失");
    }

    const normalizedData: Record<string, string> = {};
    Object.entries(payload.data as Record<string, unknown>).forEach(([key, value]) => {
      if (typeof key !== "string" || typeof value !== "string") {
        return;
      }
      normalizedData[key] = value;
    });

    return {
      format: "MemoCardBackup",
      version: 1,
      exportedAt: typeof payload.exportedAt === "string" ? payload.exportedAt : new Date().toISOString(),
      data: normalizedData,
    };
  }

  private async getCurrentManagedStorageKeys() {
    const keys = await AsyncStorage.getAllKeys();
    return keys.filter((key) => this.isManagedStorageKey(key));
  }

  private isManagedStorageKey(key: string) {
    if (this.exactManagedKeys.has(key)) {
      return true;
    }
    return this.managedKeyPrefixes.some((prefix) => key.startsWith(prefix));
  }
}
