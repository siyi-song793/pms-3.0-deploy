/**
 * @file DOM工具集｜Layer4 基础设施层
 * @desc 包含XSS转义、移动端安全区域适配、输入防遮挡、DOM通用工具
 * @BUG修复 原文档缺失导致用户输入XSS漏洞、iOS底部遮挡BUG
 */

/**
 * HTML实体转义（防御XSS注入）
 * @param str 原始用户输入字符串
 * @returns 安全转义后的字符串
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;', // 修复：用双引号包裹单引号
    '/': '&#47;'
  };
  return str.replace(/[&<>"'/]/g, char => map[char]);
}

/**
 * HTML实体反转义（后台回显专用）
 * @param str 转义后的字符串
 * @returns 原始字符串
 */
export function unescapeHtml(str: string): string {
  if (!str) return '';
  const map: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'", // 修复：用双引号包裹单引号
    '&#47;': '/'
  };
  return str.replace(/&(amp|lt|gt|quot|#39|#47);/g, char => map[char]);
}

/**
 * 获取移动端底部安全区域高度（适配iOS刘海/底部指示条）
 * @returns 安全区域bottom像素值
 */
export function getSafeAreaBottom(): number {
  const style = getComputedStyle(document.documentElement);
  const safeBottom = style.getPropertyValue('--safe-area-inset-bottom').trim();
  return parseInt(safeBottom, 10) || 0;
}

/**
 * 输入框防键盘遮挡
 * 移动端唤起软键盘时，自动滚动输入框至可视区域
 * @param inputEl 目标输入DOM
 */
export function preventInputOcclusion(inputEl: HTMLElement): void {
  if (!inputEl) return;
  const resizeHandler = () => {
    setTimeout(() => {
      const rect = inputEl.getBoundingClientRect();
      const viewHeight = window.innerHeight;
      // 输入框底部超出视口则滚动
      if (rect.bottom > viewHeight - 20) {
        inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 80);
  };
  inputEl.addEventListener('focus', resizeHandler);
}

/**
 * 批量移除指定DOM的所有子节点
 * @param el 父容器DOM
 */
export function clearElementChildren(el: HTMLElement): void {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

/**
 * 判断是否为移动端视口
 */
export function isMobileViewport(): boolean {
  return window.matchMedia('(max-width: 768px)').matches;
}

/**
 * 判断是否为iOS设备
 */
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}