import AsyncStorage from '@react-native-async-storage/async-storage';
import { Question } from "../questions";
import { LazySingletonBase } from "../utils/LazySingletonBase";

// 定义统计数据的类型接口，让数据结构更清晰
interface DailyBaseStats {
  total: number;    // 总答题数
  correct: number;  // 正确答题数
}

// 每日统计数据结构：日期 -> 题库 -> 答题统计
interface DailyStatistics {
  [date: string]: {
    [frombase: string]: DailyBaseStats;
  };
}

// AsyncStorage 的存储键名
const STORAGE_KEY = 'question_statistics';

export class Statistics extends LazySingletonBase<Statistics> {
  // 内存中的统计数据缓存
  private cachedStats: DailyStatistics = {};

  constructor() {
    super();
    // 初始化时从本地加载数据
    this.loadFromStorage();
  }

  /**
   * 从 AsyncStorage 加载统计数据到内存缓存
   */
  private async loadFromStorage() {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData) {
        this.cachedStats = JSON.parse(storedData);
      }
    } catch (error) {
      console.error('[Statistics] 加载统计数据失败:', error);
      this.cachedStats = {}; // 加载失败时初始化空对象
    }
  }

  /**
   * 将内存中的统计数据保存到 AsyncStorage
   */
  private async saveToStorage() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.cachedStats));
    } catch (error) {
      console.error('[Statistics] 保存统计数据失败:', error);
    }
  }

  /**
   * 获取当前日期（格式：YYYY-MM-DD）
   */
  private getCurrentDate(): string {
    const now = new Date();
    return now.toISOString().split('T')[0]; // 简化的日期格式化
  }

  /**
   * 记录答题完成事件（核心方法）
   * @param question 题目对象
   * @param isCorrect 是否正确
   */
  public async finishQuestion(question: Question, isCorrect: boolean) {
    const date = this.getCurrentDate();
    const frombase = question.frombase || 'unknown'; // 兜底处理

    console.log(`[Statistics] finishQuestion: ${question.id}, from ${frombase}, isCorrect: ${isCorrect}`);

    // 初始化日期层级数据
    if (!this.cachedStats[date]) {
      this.cachedStats[date] = {};
    }

    // 初始化题库层级数据
    if (!this.cachedStats[date][frombase]) {
      this.cachedStats[date][frombase] = { total: 0, correct: 0 };
    }

    // 更新统计数据
    this.cachedStats[date][frombase].total += 1;
    if (isCorrect) {
      this.cachedStats[date][frombase].correct += 1;
    }

    // 持久化到本地存储
    await this.saveToStorage();
  }

  /**
   * 获取指定日期的题库统计数据
   * @param date 日期（格式：YYYY-MM-DD），不传则获取当天
   * @returns 该日期的所有题库统计数据
   */
  public async getDailyStats(date?: string): Promise<{ [frombase: string]: DailyBaseStats }> {
    const targetDate = date || this.getCurrentDate();
    // 确保数据是最新的
    await this.loadFromStorage();
    return this.cachedStats[targetDate] || {};
  }

  /**
   * 获取指定日期范围的统计数据（用于绘制趋势图）
   * @param startDate 开始日期（YYYY-MM-DD）
   * @param endDate 结束日期（YYYY-MM-DD）
   * @returns 日期范围内的所有统计数据
   */
  public async getStatsInDateRange(startDate: string, endDate: string): Promise<DailyStatistics> {
    await this.loadFromStorage();
    const result: DailyStatistics = {};
    
    // 遍历缓存中的日期，筛选出在范围内的
    Object.keys(this.cachedStats).forEach(date => {
      if (date >= startDate && date <= endDate) {
        result[date] = this.cachedStats[date];
      }
    });

    return result;
  }

  /**
   * 获取所有题库的累计统计数据（用于绘制汇总饼图/柱状图）
   * @returns 所有题库的总答题数和正确率
   */
  public async getTotalStatsByBase(): Promise<{ [frombase: string]: DailyBaseStats }> {
    await this.loadFromStorage();
    const totalStats: { [frombase: string]: DailyBaseStats } = {};

    // 遍历所有日期和题库，累加数据
    Object.values(this.cachedStats).forEach(dailyStats => {
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

  /**
   * 计算正确率（辅助方法）
   * @param stats 答题统计数据
   * @returns 正确率（0-100），无数据时返回0
   */
  public calculateAccuracy(stats: DailyBaseStats): number {
    if (stats.total === 0) return 0;
    return Number(((stats.correct / stats.total) * 100).toFixed(2)); // 保留两位小数
  }

  /**
   * 清空所有统计数据（谨慎使用）
   */
  public async clearAllStats() {
    this.cachedStats = {};
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log('[Statistics] 所有统计数据已清空');
  }
    
    
     /**
   * 获取所有统计过的题库列表（去重）
   */
  public async getAllQuestionBases(): Promise<string[]> {
    await this.loadFromStorage();
    const bases = new Set<string>();
    
    Object.values(this.cachedStats).forEach(dailyStats => {
      Object.keys(dailyStats).forEach(base => bases.add(base));
    });
    
    return Array.from(bases).sort();
  }

  /**
   * 获取最近 N 天的每日统计数据（用于折线图）
   * @param days 天数（默认7天）
   * @returns 按日期排序的数组
   */
  public async getRecentDailyStats(days: number = 7): Promise<
    {
      date: string;
      total: number;
      correct: number;
      accuracy: number;
      byBase: { [frombase: string]: DailyBaseStats };
    }[]
  > {
    await this.loadFromStorage();
    const result = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = this.cachedStats[dateStr] || {};
      let total = 0;
      let correct = 0;
      
      Object.values(dayData).forEach(stats => {
        total += stats.total;
        correct += stats.correct;
      });
      
      result.push({
        date: dateStr,
        total,
        correct,
        accuracy: total > 0 ? Number(((correct / total) * 100).toFixed(2)) : 0,
        byBase: dayData
      });
    }
    
    return result;
  }

  /**
   * 获取最近 N 天进步最快的题库（按正确率提升排序）
   * @param days 天数（默认7天）
   * @returns 排序后的题库提升数据
   */
  public async getMostImprovedBases(days: number = 7): Promise<
    {
      frombase: string;
      oldAccuracy: number;
      newAccuracy: number;
      improvement: number;
      totalQuestions: number;
    }[]
  > {
    const recentStats = await this.getRecentDailyStats(days);
    const baseStats: { 
      [key: string]: { 
        earlyCorrect: number; 
        earlyTotal: number; 
        lateCorrect: number; 
        lateTotal: number;
        totalQuestions: number;
      } 
    } = {};

    // 分割数据：前半段 vs 后半段
    const midPoint = Math.floor(recentStats.length / 2);
    
    recentStats.forEach((day, index) => {
      Object.entries(day.byBase).forEach(([base, stats]) => {
        if (!baseStats[base]) {
          baseStats[base] = { 
            earlyCorrect: 0, earlyTotal: 0, 
            lateCorrect: 0, lateTotal: 0,
            totalQuestions: 0 
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

    // 计算进步幅度
    return Object.entries(baseStats)
      .map(([frombase, stats]) => {
        const oldAcc = stats.earlyTotal > 0 ? (stats.earlyCorrect / stats.earlyTotal) * 100 : 0;
        const newAcc = stats.lateTotal > 0 ? (stats.lateCorrect / stats.lateTotal) * 100 : 0;
        return {
          frombase,
          oldAccuracy: Number(oldAcc.toFixed(2)),
          newAccuracy: Number(newAcc.toFixed(2)),
          improvement: Number((newAcc - oldAcc).toFixed(2)),
          totalQuestions: stats.totalQuestions
        };
      })
      .filter(item => item.totalQuestions > 0) // 至少做过题
      .sort((a, b) => b.improvement - a.improvement); // 按提升幅度降序
  }

  /**
   * 获取 GitHub 风格热力图数据（最近一年）
   * @returns 用于热力图的数据点数组
   */
  public async getContributionGraphData(): Promise<
    { date: string; count: number }[]
  > {
    await this.loadFromStorage();
    const result: { date: string; count: number }[] = [];
    const today = new Date();
    
    // 生成最近365天的数据
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = this.cachedStats[dateStr];
      let count = 0;
      
      if (dayData) {
        count = Object.values(dayData).reduce((sum, stats) => sum + stats.total, 0);
      }
      
      result.push({ date: dateStr, count });
    }
    
    return result;
  }

  /**
   * 获取指定题库的详细统计（用于用户选择查看）
   * @param frombase 题库名称
   * @param days 天数（默认30天）
   */
  public async getBaseDetailStats(frombase: string, days: number = 30): Promise<{
    recentTrend: { date: string; total: number; correct: number; accuracy: number }[];
    totalStats: DailyBaseStats;
    streak: { current: number; longest: number };
  }> {
    await this.loadFromStorage();
    const recentStats = await this.getRecentDailyStats(days);
    
    const trend = recentStats.map(day => {
      const baseData = day.byBase[frombase] || { total: 0, correct: 0 };
      return {
        date: day.date,
        total: baseData.total,
        correct: baseData.correct,
        accuracy: baseData.total > 0 ? Number(((baseData.correct / baseData.total) * 100).toFixed(2)) : 0
      };
    });

    // 计算连续打卡
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    // 从今天往前算当前连续天数
    const reversedTrend = [...trend].reverse();
    for (const day of reversedTrend) {
      if (day.total > 0) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    // 计算历史最长连续
    for (const day of trend) {
      if (day.total > 0) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    const totalStats = trend.reduce((acc, day) => ({
      total: acc.total + day.total,
      correct: acc.correct + day.correct
    }), { total: 0, correct: 0 });

    return {
      recentTrend: trend,
      totalStats,
      streak: { current: currentStreak, longest: longestStreak }
    };
  }

  /**
   * 获取总体成就数据（用于顶部概览卡片）
   */
  public async getOverallAchievements(): Promise<{
    totalQuestions: number;
    totalCorrect: number;
    overallAccuracy: number;
    activeDays: number;
    totalBases: number;
    favoriteBase: string | null;
  }> {
    await this.loadFromStorage();
    const totalStats = await this.getTotalStatsByBase();
    
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

    const activeDays = Object.keys(this.cachedStats).filter(
      date => Object.values(this.cachedStats[date]).some(s => s.total > 0)
    ).length;

    return {
      totalQuestions,
      totalCorrect,
      overallAccuracy: totalQuestions > 0 ? Number(((totalCorrect / totalQuestions) * 100).toFixed(2)) : 0,
      activeDays,
      totalBases: Object.keys(totalStats).length,
      favoriteBase
    };
  }

}