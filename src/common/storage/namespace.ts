/**
 * @file 命名空间隔离本地存储工具
 * @desc Layer4 基础设施层｜解决全局Storage命名空间污染、多版本数据冲突问题
 * @BUG修复 原工程无该工具导致PMS2.0/3.0本地数据覆盖冲突
 */
export class NamespaceStorage {
  private readonly nsPrefix: string;
  private readonly storage: Storage;

  /**
   * 构造命名空间存储实例
   * @param namespace 命名空间标识，建议带版本后缀
   * @param useSession 是否使用sessionStorage，默认localStorage
   */
  constructor(namespace: string, useSession = false) {
    this.nsPrefix = `${namespace}__`;
    this.storage = useSession ? sessionStorage : localStorage;
  }

  /** 带命名空间前缀生成真实key */
  private getRealKey(key: string): string {
    return `${this.nsPrefix}${key}`;
  }

  /** 设置存储项（自动JSON序列化） */
  set<T = unknown>(key: string, value: T): void {
    const realKey = this.getRealKey(key);
    try {
      const valStr = JSON.stringify(value);
      this.storage.setItem(realKey, valStr);
    } catch (e) {
      console.error(`[NamespaceStorage][${this.nsPrefix}] 存储序列化失败:`, key, e);
    }
  }

  /** 获取存储项（自动JSON反序列化） */
  get<T = unknown>(key: string, defaultValue: T | null = null): T | null {
    const realKey = this.getRealKey(key);
    const valStr = this.storage.getItem(realKey);
    if (!valStr) return defaultValue;
    try {
      return JSON.parse(valStr) as T;
    } catch (e) {
      console.error(`[NamespaceStorage][${this.nsPrefix}] 存储解析失败:`, key, e);
      this.remove(key);
      return defaultValue;
    }
  }

  /** 删除指定存储项 */
  remove(key: string): void {
    const realKey = this.getRealKey(key);
    this.storage.removeItem(realKey);
  }

  /** 清空当前命名空间下所有存储，不影响全局其他命名空间 */
  clearNamespace(): void {
    const keysToRemove: string[] = [];
    // 遍历所有storage key，筛选当前命名空间
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key?.startsWith(this.nsPrefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => this.storage.removeItem(k));
  }

  /** 判断key是否存在 */
  has(key: string): boolean {
    return this.storage.getItem(this.getRealKey(key)) !== null;
  }
}

// 全局默认实例（PMS3.0主命名空间）
export const pmsLocalStorage = new NamespaceStorage('pms3_global_v3');
