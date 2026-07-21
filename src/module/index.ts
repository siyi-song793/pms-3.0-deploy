// src/module/index.ts
// 导出 today 模块
export * from './today/components/TodayPage';
export * from './today/components/RecycleBin';

// 导出 timeline 模块
export * from './timeline/components/TimelinePage';
export * from './timeline/service/timeline-service';

// 导出 calendar 模块
export * from './calendar/components/CalendarPage';
export * from './calendar/components/DataChart';
export * from './calendar/service/calendar-service';

// 导出 water 模块
export * from './water/components/WaterPage';

// 导出 finance 模块
export * from './finance/components/FinancePage';

// 给 main.ts 调用的初始化函数
export function initBusinessModules() {
  console.log('✅ Business modules 初始化完成');
}