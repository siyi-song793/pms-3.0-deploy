import { getLocalDateKey } from '@common/utils/date';
import { getWaterByDate, createWaterRecord, deleteWaterRecord, clearWaterByDate, getWaterStats } from '@service/db-time';
import type { WaterRecord } from '../../db/schema/tables';

const WATER_GOAL = 2000;
const WATER_CATS: { id: WaterCategory; name: string; icon: string }[] = [
  { id: 'pure', name: '纯净水', icon: '💧' },
  { id: 'tea', name: '茶饮', icon: '🍵' },
  { id: 'coffee', name: '咖啡', icon: '☕' },
  { id: 'juice', name: '果汁', icon: '🧃' },
  { id: 'milktea', name: '奶茶', icon: '🧋' },
  { id: 'dairy', name: '奶制品', icon: '🥛' },
  { id: 'alcohol', name: '酒精饮品', icon: '🍺' }
];
const WATER_SCENES: { id: 'home' | 'outside'; name: string; solid: boolean }[] = [
  { id: 'home', name: '居家自制', solid: true },
  { id: 'outside', name: '外部外购', solid: false }
];
const QUICK_AMOUNTS = [100, 200, 300, 500];

type WaterCategory = 'pure' | 'tea' | 'coffee' | 'juice' | 'milktea' | 'dairy' | 'alcohol';

export class WaterPage {
  private dateKey = getLocalDateKey();
  private records: WaterRecord[] = [];
  private selectedCat: WaterCategory = 'pure';
  private selectedScene: 'home' | 'outside' = 'home';
  private customAmount = 0;

  async render(container: HTMLElement) {
    await this.loadData();
    container.innerHTML = this.buildHTML();
    this.bindEvents(container);
  }

  private async loadData() {
    this.records = await getWaterByDate(this.dateKey);
  }

  private getTotal(): number {
    return this.records.reduce((s, r) => s + r.amount, 0);
  }

  private buildHTML(): string {
    const total = this.getTotal();
    const pct = Math.min(100, Math.round(total / WATER_GOAL * 100));
    const remain = Math.max(0, WATER_GOAL - total);
    return `
      <div class="water-page">
        <!-- 第一层：统计进度卡片 -->
        <div class="water-progress-card">
          <div class="water-progress-header">
            <span class="water-progress-label">💧 今日饮水</span>
            <span class="water-progress-goal">目标 ${WATER_GOAL}ml</span>
          </div>
          <div class="water-progress-amount">
            <span class="water-progress-current">${total}</span>
            <span class="water-progress-unit">ml</span>
          </div>
          <div class="water-progress-bar-wrap">
            <div class="water-progress-bar" style="width:${pct}%"></div>
          </div>
          <div class="water-progress-footer">
            <span>已喝 ${pct}%</span>
            <span>剩余 ${remain}ml</span>
          </div>
        </div>

        <!-- 第二层：快捷录入区 -->
        <div class="water-quick-section">
          <div class="water-section-title">快速录入</div>
          <div class="water-scene-toggle">
            <button class="water-scene-btn ${this.selectedScene === 'home' ? 'active solid' : ''}" data-scene="home">🏠 居家自制</button>
            <button class="water-scene-btn ${this.selectedScene === 'outside' ? 'active dash' : ''}" data-scene="outside">🏪 外部外购</button>
          </div>
          <div class="water-cat-scroll" id="water-cat-scroll">
            ${WATER_CATS.map(c => `
              <button class="water-cat-pill ${this.selectedCat === c.id ? 'active' : ''}" data-cat="${c.id}">
                ${c.icon} ${c.name}
              </button>
            `).join('')}
          </div>
          <div class="water-amount-bar">
            ${QUICK_AMOUNTS.map(a => `
              <button class="water-amount-btn" data-amount="${a}">${a}ml</button>
            `).join('')}
          </div>
          <div class="water-custom-amount">
            <input type="number" class="water-amount-input" id="water-custom-input" placeholder="自定义水量（ml）" min="1" max="5000">
          </div>
          <button class="water-submit-btn" id="water-submit-btn">确认录入</button>
        </div>

        <!-- 第三层：当日记录列表 -->
        <div class="water-record-section">
          <div class="water-section-title">今日记录 (${this.records.length})</div>
          <div class="water-record-list" id="water-record-list">
            ${this.records.length === 0 ? `
              <div class="empty-state">
                <div class="empty-icon">💧</div>
                <div class="empty-text">还没有饮水记录</div>
                <div class="empty-hint">使用上方快捷按钮开始记录吧</div>
              </div>
            ` : this.records.map(r => {
              const cat = WATER_CATS.find(c => c.id === r.category);
              const scene = WATER_SCENES.find(s => s.id === r.scene);
              return `
                <div class="water-record-item">
                  <span class="wr-icon">${cat ? cat.icon : '💧'}</span>
                  <div class="wr-info">
                    <span class="wr-cat">${cat ? cat.name : r.category}</span>
                    <span class="wr-scene">${scene ? scene.name : r.scene}</span>
                  </div>
                  <span class="wr-amount">${r.amount}ml</span>
                  <button class="wr-del-btn" data-id="${r.id}">删除</button>
                </div>
              `;
            }).reverse().join('')}
          </div>
        </div>

        <!-- 第四层：底部批量操作栏 -->
        <div class="water-batch-bar" id="water-batch-bar">
          <button class="water-batch-btn danger" id="water-clear-btn" ${this.records.length === 0 ? 'disabled' : ''}>
            🗑️ 清空当日记录
          </button>
        </div>
      </div>
    `;
  }

  private bindEvents(container: HTMLElement) {
    container.addEventListener('click', async (e: Event) => {
      const target = e.target as HTMLElement;

      // 场景切换
      if (target.classList.contains('water-scene-btn')) {
        this.selectedScene = (target.dataset.scene as 'home' | 'outside') || 'home';
        await this.refresh(container);
        return;
      }

      // 品类选择
      if (target.classList.contains('water-cat-pill')) {
        this.selectedCat = (target.dataset.cat as WaterCategory) || 'pure';
        await this.refresh(container);
        return;
      }

      // 快捷水量
      if (target.classList.contains('water-amount-btn')) {
        const amount = parseInt(target.dataset.amount || '0');
        if (amount > 0) {
          this.customAmount = 0;
          const input = container.querySelector('#water-custom-input') as HTMLInputElement;
          if (input) input.value = '';
          await this.doAdd(container, amount);
        }
        return;
      }

      // 提交自定义水量
      if (target.id === 'water-submit-btn') {
        const input = container.querySelector('#water-custom-input') as HTMLInputElement;
        const amount = parseInt(input?.value || '0');
        if (amount > 0) {
          await this.doAdd(container, amount);
          if (input) input.value = '';
        }
        return;
      }

      // 删除单条
      if (target.classList.contains('wr-del-btn')) {
        const id = parseInt(target.dataset.id || '0');
        if (id) {
          await deleteWaterRecord(id);
          await this.refresh(container);
        }
        return;
      }

      // 清空当日
      if (target.id === 'water-clear-btn') {
        if (confirm('确定清空今日所有饮水记录？')) {
          await clearWaterByDate(this.dateKey);
          await this.refresh(container);
        }
        return;
      }
    });
  }

  private async doAdd(container: HTMLElement, amount: number) {
    await createWaterRecord({
      dateKey: this.dateKey,
      category: this.selectedCat,
      scene: this.selectedScene,
      amount,
      createTime: Date.now()
    });
    await this.refresh(container);
  }

  private async refresh(container: HTMLElement) {
    await this.loadData();
    const newHTML = this.buildHTML();
    const oldEl = container.querySelector('.water-page');
    if (oldEl) {
      const temp = document.createElement('div');
      temp.innerHTML = newHTML;
      const newEl = temp.firstElementChild;
      if (newEl) {
        oldEl.replaceWith(newEl);
        this.bindEvents(newEl as HTMLElement);
      }
    }
  }
}