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

export class Statistics extends LazySingletonBase<Statistics> {
  private cachedStats: DailyStatistics = {};
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
        this.cachedStats = storedData ? JSON.parse(storedData) : {};
      } catch (error) {
        console.error("[Statistics] 加载统计数据失败:", error);
        this.cachedStats = {};
      } finally {
        this.hasLoaded = true;
        this.loadPromise = null;
      }
    })();

    await this.loadPromise;
  }

  private async saveToStorage() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.cachedStats));
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
      const dayData = this.cachedStats[dateStr] || {};

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
    Object.values(this.cachedStats).forEach((dailyStats) => {
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

    const activeDays = Object.keys(this.cachedStats).filter((date) =>
      Object.values(this.cachedStats[date]).some((s) => s.total > 0)
    ).length;

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

    if (!this.cachedStats[date]) {
      this.cachedStats[date] = {};
    }
    if (!this.cachedStats[date][frombase]) {
      this.cachedStats[date][frombase] = { total: 0, correct: 0 };
    }

    this.cachedStats[date][frombase].total += 1;
    if (isCorrect) {
      this.cachedStats[date][frombase].correct += 1;
    }

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
    Object.values(this.cachedStats).forEach((dailyStats) => {
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
}
