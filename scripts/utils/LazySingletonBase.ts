/**
 * 懒加载单例模式基类
 * @template T 子类类型
 */
export abstract class LazySingletonBase<T> {
  // 静态属性：存储子类的唯一实例
  private static readonly instances = new Map<Function, any>();

  // 私有构造函数：防止外部通过 new 创建实例
  protected constructor() {}

  /**
   * 获取单例实例（核心懒加载方法）
   * @param derivedClass 子类的构造函数（用于区分不同子类的实例）
   * @param args 子类构造函数所需的参数
   * @returns 子类的唯一实例
   */
  public static getInstance<T>(this: new (...args: any[]) => T, ...args: any[]): T {
    // 检查当前子类是否已有实例
    if (!LazySingletonBase.instances.has(this)) {
      // 首次调用时创建实例（懒加载核心）
      const instance = new this(...args);
      LazySingletonBase.instances.set(this, instance);
    }
    // 返回已存在的实例
    return LazySingletonBase.instances.get(this);
  }

  /**
   * 可选：手动销毁实例（适用于需要重置单例的场景）
   */
  public static destroyInstance(): void {
    LazySingletonBase.instances.delete(this);
  }
}