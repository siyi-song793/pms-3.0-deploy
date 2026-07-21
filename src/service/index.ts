// src/service/index.ts
// 导出子模块（子模块已经有自己的 index.ts）
export * from './db-asset';
export * from './db-time';
export * from './middleware/permission';

// 给 main.ts 调用的初始化函数
export function initServices() {
  console.log('✅ Services 初始化完成');
}