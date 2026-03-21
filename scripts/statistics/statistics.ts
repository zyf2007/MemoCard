import AsyncStorage from "@react-native-async-storage/async-storage";
import { Question } from "../questions";
import { LazySingletonBase } from "../utils/LazySingletonBase";

interface DailyBaseStats {
  total: number;
  correct: number;
}

interface DailyStatistics {
  [date: string]: {
    [frombase: string]: DailyBaseStats;
  };
}

type ArchivedStatistics = {
  byBase: { [frombase: string]: DailyBaseStats };
  activeDays: number;
};

type StatisticsStorageV2 = {
  formatVersion: 2;
  recentDaily: DailyStatistics;
  archived: ArchivedStatistics;
};

type ImprovedBaseStats = {
  frombase: string;
  oldAccuracy: number;
  newAccuracy: number;
  improvement: number;
  totalQuestions: number;
};

type OverallAchievements = {
  totalQuestions: number;
  totalCorrect: number;
  overallAccuracy: number;
  activeDays: number;
  totalBases: number;
  favoriteBase: string | null;
};

type RecentDailyStats = {
  date: string;
  total: number;
  correct: number;
  accuracy: number;
  byBase: { [frombase: string]: DailyBaseStats };
};

type DashboardData = {
  achievements: OverallAchievements;
  trend7: RecentDailyStats[];
  trend30: RecentDailyStats[];
  improvedBases: ImprovedBaseStats[];
  distribution: { [frombase: string]: DailyBaseStats };
  bases: string[];
};

const STORAGE_KEY = "question_statistics";
const RECENT_DAYS_TO_KEEP = 30;

export class Statistics extends LazySingletonBase<Statistics> {
  private cachedRecentStats: DailyStatistics = {};
  private archivedStats: ArchivedStatistics = {
    byBase: {},
    activeDays: 0,
  };
  private hasLoaded = false;
  private loadPromise: Promise<void> | null = null;

  constructor() {
    super();
    void this.ensureLoaded();
  }

  private async ensureLoaded() {
    if (this.hasLoaded) {
      return;
    }
    if (this.loadPromise) {
      await this.loadPromise;
      return;
    }

    this.loadPromise = (async () => {
      try {
        const storedData = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = storedData ? JSON.parse(storedData) : null;
        const migrated = this.normalizeAndMigrateStorage(parsed);
        this.cachedRecentStats = migrated.recentDaily;
        this.archivedStats = migrated.archived;
        await this.pruneAndArchiveOldStats();
        await this.saveToStorage();
      } catch (error) {
        console.error("[Statistics] 加载统计数据失败:", error);
        this.cachedRecentStats = {};
        this.archivedStats = {
          byBase: {},
          activeDays: 0,
        };
      } finally {
        this.hasLoaded = true;
        this.loadPromise = null;
      }
    })();

    await this.loadPromise;
  }

  private async saveToStorage() {
    try {
      const payload: StatisticsStorageV2 = {
        formatVersion: 2,
        recentDaily: this.cachedRecentStats,
        archived: this.archivedStats,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.error("[Statistics] 保存统计数据失败:", error);
    }
  }

  private getCurrentDate(): string {
    return new Date().toISOString().split("T")[0];
  }

  private buildRecentDailyStats(days: number): RecentDailyStats[] {
    const result: RecentDailyStats[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayData = this.cachedRecentStats[dateStr] || {};

      let total = 0;
      let correct = 0;
      Object.values(dayData).forEach((stats) => {
        total += stats.total;
        correct += stats.correct;
      });

      result.push({
        date: dateStr,
        total,
        correct,
        accuracy: total > 0 ? Number(((correct / total) * 100).toFixed(2)) : 0,
        byBase: dayData,
      });
    }

    return result;
  }

  private buildTotalStatsByBase(): { [frombase: string]: DailyBaseStats } {
    const totalStats: { [frombase: string]: DailyBaseStats } = {};
    Object.entries(this.archivedStats.byBase).forEach(([frombase, stats]) => {
      totalStats[frombase] = { total: stats.total, correct: stats.correct };
    });
    Object.values(this.cachedRecentStats).forEach((dailyStats) => {
      Object.entries(dailyStats).forEach(([frombase, stats]) => {
        if (!totalStats[frombase]) {
          totalStats[frombase] = { total: 0, correct: 0 };
        }
        totalStats[frombase].total += stats.total;
        totalStats[frombase].correct += stats.correct;
      });
    });
    return totalStats;
  }

  private buildMostImprovedBases(recentStats: RecentDailyStats[]): ImprovedBaseStats[] {
    const baseStats: {
      [key: string]: {
        earlyCorrect: number;
        earlyTotal: number;
        lateCorrect: number;
        lateTotal: number;
        totalQuestions: number;
      };
    } = {};

    const midPoint = Math.floor(recentStats.length / 2);
    recentStats.forEach((day, index) => {
      Object.entries(day.byBase).forEach(([base, stats]) => {
        if (!baseStats[base]) {
          baseStats[base] = {
            earlyCorrect: 0,
            earlyTotal: 0,
            lateCorrect: 0,
            lateTotal: 0,
            totalQuestions: 0,
          };
        }

        if (index < midPoint) {
          baseStats[base].earlyCorrect += stats.correct;
          baseStats[base].earlyTotal += stats.total;
        } else {
          baseStats[base].lateCorrect += stats.correct;
          baseStats[base].lateTotal += stats.total;
        }
        baseStats[base].totalQuestions += stats.total;
      });
    });

    return Object.entries(baseStats)
      .map(([frombase, stats]) => {
        const oldAcc = stats.earlyTotal > 0 ? (stats.earlyCorrect / stats.earlyTotal) * 100 : 0;
        const newAcc = stats.lateTotal > 0 ? (stats.lateCorrect / stats.lateTotal) * 100 : 0;
        return {
          frombase,
          oldAccuracy: Number(oldAcc.toFixed(2)),
          newAccuracy: Number(newAcc.toFixed(2)),
          improvement: Number((newAcc - oldAcc).toFixed(2)),
          totalQuestions: stats.totalQuestions,
        };
      })
      .filter((item) => item.totalQuestions > 0)
      .sort((a, b) => b.improvement - a.improvement);
  }

  private buildOverallAchievements(totalStats: { [frombase: string]: DailyBaseStats }): OverallAchievements {
    let totalQuestions = 0;
    let totalCorrect = 0;
    let maxCount = 0;
    let favoriteBase: string | null = null;

    Object.entries(totalStats).forEach(([base, stats]) => {
      totalQuestions += stats.total;
      totalCorrect += stats.correct;
      if (stats.total > maxCount) {
        maxCount = stats.total;
        favoriteBase = base;
      }
    });

    const recentActiveDays = Object.keys(this.cachedRecentStats).filter((date) =>
      Object.values(this.cachedRecentStats[date]).some((s) => s.total > 0)
    ).length;
    const activeDays = this.archivedStats.activeDays + recentActiveDays;

    return {
      totalQuestions,
      totalCorrect,
      overallAccuracy: totalQuestions > 0 ? Number(((totalCorrect / totalQuestions) * 100).toFixed(2)) : 0,
      activeDays,
      totalBases: Object.keys(totalStats).length,
      favoriteBase,
    };
  }

  public async finishQuestion(question: Question, isCorrect: boolean) {
    await this.ensureLoaded();
    const date = this.getCurrentDate();
    const frombase = question.frombase || "unknown";

    if (!this.cachedRecentStats[date]) {
      this.cachedRecentStats[date] = {};
    }
    if (!this.cachedRecentStats[date][frombase]) {
      this.cachedRecentStats[date][frombase] = { total: 0, correct: 0 };
    }

    this.cachedRecentStats[date][frombase].total += 1;
    if (isCorrect) {
      this.cachedRecentStats[date][frombase].correct += 1;
    }

    await this.pruneAndArchiveOldStats();
    await this.saveToStorage();
  }

  public async getRecentDailyStats(days: number = 7): Promise<RecentDailyStats[]> {
    await this.ensureLoaded();
    return this.buildRecentDailyStats(days);
  }

  public async getMostImprovedBases(days: number = 7): Promise<ImprovedBaseStats[]> {
    await this.ensureLoaded();
    const recentStats = this.buildRecentDailyStats(days);
    return this.buildMostImprovedBases(recentStats);
  }

  public async getTotalStatsByBase(): Promise<{ [frombase: string]: DailyBaseStats }> {
    await this.ensureLoaded();
    return this.buildTotalStatsByBase();
  }

  public async getAllQuestionBases(): Promise<string[]> {
    await this.ensureLoaded();
    const bases = new Set<string>();
    Object.keys(this.archivedStats.byBase).forEach((base) => bases.add(base));
    Object.values(this.cachedRecentStats).forEach((dailyStats) => {
      Object.keys(dailyStats).forEach((base) => bases.add(base));
    });
    return Array.from(bases).sort();
  }

  public async getOverallAchievements(): Promise<OverallAchievements> {
    await this.ensureLoaded();
    return this.buildOverallAchievements(this.buildTotalStatsByBase());
  }

  public async getDashboardData(): Promise<DashboardData> {
    await this.ensureLoaded();
    const trend7 = this.buildRecentDailyStats(7);
    const trend30 = this.buildRecentDailyStats(30);
    const distribution = this.buildTotalStatsByBase();
    const bases = Object.keys(distribution).sort();
    const achievements = this.buildOverallAchievements(distribution);
    const improvedBases = this.buildMostImprovedBases(trend7);

    return {
      achievements,
      trend7,
      trend30,
      improvedBases,
      distribution,
      bases,
    };
  }

  private normalizeAndMigrateStorage(raw: unknown): StatisticsStorageV2 {
    const fallback: StatisticsStorageV2 = {
      formatVersion: 2,
      recentDaily: {},
      archived: {
        byBase: {},
        activeDays: 0,
      },
    };

    if (!raw || typeof raw !== "object") {
      return fallback;
    }

    const maybeV2 = raw as Partial<StatisticsStorageV2>;
    if (maybeV2.formatVersion === 2) {
      return {
        formatVersion: 2,
        recentDaily: this.normalizeDailyStatistics(maybeV2.recentDaily),
        archived: this.normalizeArchivedStatistics(maybeV2.archived),
      };
    }

    const legacyDailyStats = this.normalizeDailyStatistics(raw);
    return this.migrateLegacyStats(legacyDailyStats);
  }

  private normalizeArchivedStatistics(raw: unknown): ArchivedStatistics {
    if (!raw || typeof raw !== "object") {
      return { byBase: {}, activeDays: 0 };
    }

    const parsed = raw as Partial<ArchivedStatistics>;
    return {
      byBase: this.normalizeDailyBaseStatsMap(parsed.byBase),
      activeDays: Number.isFinite(parsed.activeDays) ? Math.max(0, Math.floor(parsed.activeDays || 0)) : 0,
    };
  }

  private normalizeDailyStatistics(raw: unknown): DailyStatistics {
    if (!raw || typeof raw !== "object") {
      return {};
    }

    const result: DailyStatistics = {};
    Object.entries(raw as Record<string, unknown>).forEach(([date, dayValue]) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return;
      }
      if (!dayValue || typeof dayValue !== "object") {
        return;
      }

      const byBase = this.normalizeDailyBaseStatsMap(dayValue);
      if (Object.keys(byBase).length > 0) {
        result[date] = byBase;
      }
    });

    return result;
  }

  private normalizeDailyBaseStatsMap(raw: unknown): { [frombase: string]: DailyBaseStats } {
    if (!raw || typeof raw !== "object") {
      return {};
    }

    const result: { [frombase: string]: DailyBaseStats } = {};
    Object.entries(raw as Record<string, unknown>).forEach(([frombase, stats]) => {
      if (!frombase || typeof frombase !== "string") {
        return;
      }
      if (!stats || typeof stats !== "object") {
        return;
      }

      const typedStats = stats as Partial<DailyBaseStats>;
      const total = Number.isFinite(typedStats.total) ? Math.max(0, Math.floor(typedStats.total || 0)) : 0;
      const correctRaw = Number.isFinite(typedStats.correct) ? Math.max(0, Math.floor(typedStats.correct || 0)) : 0;
      const correct = Math.min(correctRaw, total);
      if (total <= 0) {
        return;
      }

      result[frombase] = { total, correct };
    });
    return result;
  }

  private migrateLegacyStats(legacyStats: DailyStatistics): StatisticsStorageV2 {
    const cutoff = this.getRecentCutoffDate();
    const recentDaily: DailyStatistics = {};
    const archived: ArchivedStatistics = { byBase: {}, activeDays: 0 };

    Object.entries(legacyStats).forEach(([date, byBase]) => {
      if (date >= cutoff) {
        recentDaily[date] = byBase;
        return;
      }

      let dayActive = false;
      Object.entries(byBase).forEach(([frombase, stats]) => {
        if (!archived.byBase[frombase]) {
          archived.byBase[frombase] = { total: 0, correct: 0 };
        }
        archived.byBase[frombase].total += stats.total;
        archived.byBase[frombase].correct += stats.correct;
        if (stats.total > 0) {
          dayActive = true;
        }
      });
      if (dayActive) {
        archived.activeDays += 1;
      }
    });

    return {
      formatVersion: 2,
      recentDaily,
      archived,
    };
  }

  private getRecentCutoffDate(): string {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (RECENT_DAYS_TO_KEEP - 1));
    return cutoffDate.toISOString().split("T")[0];
  }

  private async pruneAndArchiveOldStats() {
    const cutoff = this.getRecentCutoffDate();
    const datesToArchive = Object.keys(this.cachedRecentStats).filter((date) => date < cutoff);

    datesToArchive.forEach((date) => {
      const dayStats = this.cachedRecentStats[date];
      let dayActive = false;
      Object.entries(dayStats).forEach(([frombase, stats]) => {
        if (!this.archivedStats.byBase[frombase]) {
          this.archivedStats.byBase[frombase] = { total: 0, correct: 0 };
        }
        this.archivedStats.byBase[frombase].total += stats.total;
        this.archivedStats.byBase[frombase].correct += stats.correct;
        if (stats.total > 0) {
          dayActive = true;
        }
      });
      if (dayActive) {
        this.archivedStats.activeDays += 1;
      }
      delete this.cachedRecentStats[date];
    });
  }
}
