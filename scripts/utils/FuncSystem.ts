/**
 * 通用委托类（合并 Action 和 Func，支持有/无返回值）
 * @template T - 委托的函数类型（支持任意参数和返回值，包括 void）
 */
export class Func<T extends (...args: any[]) => any> {
  // 存储所有订阅的回调函数
  private callbacks: T[] = [];

  /**
   * 订阅回调函数（替代原 add/+=(
   * @param callback 要订阅的函数
   * @returns 取消订阅的函数（便捷用法：const unsubscribe = func.subscribe(...)）
   */
  subscribe(callback: T): () => void {
    if (typeof callback !== 'function') {
      throw new Error('订阅的必须是函数类型');
    }
    if (!this.callbacks.includes(callback)) {
      this.callbacks.push(callback);
    }
    // 返回取消订阅的快捷函数
    return () => this.unsubscribe(callback);
  }

  /**
   * 取消订阅回调函数（替代原 remove/-=）
   * @param callback 要取消订阅的函数
   */
  unsubscribe(callback: T): void {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  /**
   * 清空所有订阅的回调
   */
  clear(): void {
    this.callbacks = [];
  }

  /**
   * 执行所有订阅的回调（核心方法）
   * @param args 传递给回调函数的参数
   * @returns 最后一个回调的返回值（无回调时返回 undefined，无返回值时返回 void）
   */
  invoke(...args: Parameters<T>): ReturnType<T> | undefined {
    if (this.callbacks.length === 0) {
      return undefined;
    }

    let lastResult: ReturnType<T> | undefined;
    // 按订阅顺序执行所有回调
    this.callbacks.forEach(callback => {
      try {
        lastResult = callback(...args);
      } catch (error) {
        console.error('执行委托回调时出错:', error);
        // 出错不中断其他回调执行（和 C# 多播委托行为一致）
      }
    });

    return lastResult;
  }

  /**
   * 执行所有回调并返回所有结果（扩展方法）
   * @param args 传递给回调函数的参数
   * @returns 所有回调的返回值数组
   */
  invokeAll(...args: Parameters<T>): ReturnType<T>[] {
    return this.callbacks.map(callback => callback(...args));
  }

  /**
   * 获取当前订阅的回调数量
   */
  get count(): number {
    return this.callbacks.length;
  }

  /**
   * 直接调用实例时，自动执行 invoke（简化调用）
   */
  call(this: Func<T>, ...args: Parameters<T>): ReturnType<T> | undefined {
    return this.invoke(...args);
  }

  apply(this: Func<T>, _thisArg: any, args: Parameters<T>): ReturnType<T> | undefined {
    return this.invoke(...args);
  }
}