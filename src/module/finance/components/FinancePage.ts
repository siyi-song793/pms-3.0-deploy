import { getLocalDateKey } from '@common/utils/date';
import { listAssetRecordsByDate, createAssetRecord, deleteAssetRecord, getFinanceStats } from '@service/db-asset';
import type { AssetRecord } from '../../db/schema/tables';

const INCOME_CATS = ['工资', '兼职', '奖金', '理财收益', '红包', '其他'];
const EXPENSE_CATS = ['餐饮', '交通', '购物', '日用', '娱乐', '生活', '其他'];

export class FinancePage {
  private dateKey = getLocalDateKey();
  private records: AssetRecord[] = [];
  private finType: 'income' | 'expense' = 'expense';
  private selectedCat = '';
  private monthStats = { income: 0, expense: 0, balance: 0 };
  private filterType: 'all' | 'income' | 'expense' = 'all';

  async render(container: HTMLElement) {
    await this.loadData();
    container.innerHTML = this.buildHTML();
    this.bindEvents(container);
  }

  private async loadData() {
    try {
      this.records = await listAssetRecordsByDate(this.dateKey);
    } catch (_e) {
      this.records = [];
    }
    try {
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const startKey = monthKey + '-01';
      const endKey = monthKey + '-31';
      const stats = await getFinanceStats(startKey, endKey);
      this.monthStats = { income: stats.income, expense: stats.expense, balance: stats.balance };
    } catch (_e) {
      // 月度统计降级，不阻塞页面
    }
  }

  private get todayIncome(): number { return this.records.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0); }
  private get todayExpense(): number { return this.records.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0); }

  private buildHTML(): string {
    const cats = this.finType === 'income' ? INCOME_CATS : EXPENSE_CATS;
    const filtered = this.filterType === 'all' ? this.records : this.records.filter(r => r.type === this.filterType);

    return `
      <div class="finance-page">
        <!-- 第一层：月度收支总览双卡片 -->
        <div class="finance-month-overview">
          <div class="finance-overview-card income-card">
            <div class="fo-label">本月收入</div>
            <div class="fo-amount income-amount">+${this.monthStats.income.toFixed(2)}</div>
          </div>
          <div class="finance-overview-card expense-card">
            <div class="fo-label">本月支出</div>
            <div class="fo-amount expense-amount">-${this.monthStats.expense.toFixed(2)}</div>
          </div>
        </div>

        <!-- 第二层：当日收支统计栏 -->
        <div class="finance-today-stats">
          <div class="ft-stat">
            <span class="ft-label">今日收入</span>
            <span class="ft-value income-amount">+${this.todayIncome.toFixed(2)}</span>
          </div>
          <div class="ft-stat">
            <span class="ft-label">今日支出</span>
            <span class="ft-value expense-amount">-${this.todayExpense.toFixed(2)}</span>
          </div>
          <div class="ft-stat">
            <span class="ft-label">今日结余</span>
            <span class="ft-value ${(this.todayIncome - this.todayExpense) >= 0 ? 'income-amount' : 'expense-amount'}">${(this.todayIncome - this.todayExpense) >= 0 ? '+' : ''}${(this.todayIncome - this.todayExpense).toFixed(2)}</span>
          </div>
        </div>

        <!-- 第三层：记账录入表单区 -->
        <div class="finance-form-section">
          <div class="finance-section-title">记一笔</div>
          <div class="finance-type-toggle">
            <button class="fin-type-btn ${this.finType === 'expense' ? 'active-expense' : ''}" data-type="expense">支出</button>
            <button class="fin-type-btn ${this.finType === 'income' ? 'active-income' : ''}" data-type="income">收入</button>
          </div>
          <div class="finance-amount-input-wrap">
            <input type="number" class="finance-amount-input" id="fin-amount" placeholder="输入金额" min="0.01" step="0.01">
          </div>
          <div class="fin-cat-scroll" id="fin-cat-scroll">
            ${cats.map(c => `
              <button class="fin-cat-pill ${this.selectedCat === c ? 'active' : ''}" data-cat="${c}">${c}</button>
            `).join('')}
          </div>
          <div class="finance-remark-wrap">
            <input type="text" class="finance-remark-input" id="fin-remark" placeholder="备注（选填）" maxlength="50">
          </div>
          <button class="finance-submit-btn" id="fin-submit-btn">提交</button>
        </div>

        <!-- 第四层：收支筛选栏 -->
        <div class="finance-filter-bar">
          <button class="fin-filter-btn ${this.filterType === 'all' ? 'active' : ''}" data-filter="all">全部</button>
          <button class="fin-filter-btn ${this.filterType === 'income' ? 'active' : ''}" data-filter="income">收入</button>
          <button class="fin-filter-btn ${this.filterType === 'expense' ? 'active' : ''}" data-filter="expense">支出</button>
        </div>

        <!-- 第五层：历史明细列表 -->
        <div class="finance-record-section">
          <div class="finance-section-title">明细记录 (${filtered.length})</div>
          <div class="finance-record-list" id="finance-record-list">
            ${filtered.length === 0 ? `
              <div class="empty-state">
                <div class="empty-icon">💰</div>
                <div class="empty-text">暂无记录</div>
                <div class="empty-hint">使用上方表单开始记账</div>
              </div>
            ` : filtered.map(r => `
              <div class="finance-record-item ${r.type === 'income' ? 'income-item' : 'expense-item'}">
                <span class="fr-type-tag ${r.type === 'income' ? 'income-tag' : 'expense-tag'}">${r.type === 'income' ? '收入' : '支出'}</span>
                <div class="fr-info">
                  <span class="fr-cat">${this.escHtml(r.category)}</span>
                  ${r.remark ? `<span class="fr-remark">${this.escHtml(r.remark)}</span>` : ''}
                </div>
                <span class="fr-amount ${r.type === 'income' ? 'income-amt' : 'expense-amt'}">${r.type === 'income' ? '+' : '-'}${r.amount.toFixed(2)}</span>
                <button class="fr-del-btn" data-id="${r.id}">删除</button>
              </div>
            `).reverse().join('')}
          </div>
        </div>
      </div>
    `;
  }

  private escHtml(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  private bindEvents(container: HTMLElement) {
    container.addEventListener('click', async (e: Event) => {
      const target = e.target as HTMLElement;

      if (target.classList.contains('fin-type-btn')) {
        this.finType = (target.dataset.type as 'income' | 'expense') || 'expense';
        this.selectedCat = '';
        await this.refresh(container);
        return;
      }

      if (target.classList.contains('fin-cat-pill')) {
        this.selectedCat = target.dataset.cat || '';
        container.querySelectorAll('.fin-cat-pill').forEach(p => p.classList.remove('active'));
        target.classList.add('active');
        return;
      }

      if (target.classList.contains('fin-filter-btn')) {
        this.filterType = (target.dataset.filter as 'all' | 'income' | 'expense') || 'all';
        await this.refresh(container);
        return;
      }

      if (target.id === 'fin-submit-btn') {
        const amountInput = container.querySelector('#fin-amount') as HTMLInputElement;
        const remarkInput = container.querySelector('#fin-remark') as HTMLInputElement;
        const amount = parseFloat(amountInput?.value || '0');
        if (amount <= 0 || !this.selectedCat) {
          if (amount <= 0) amountInput?.focus();
          else if (!this.selectedCat) {
            const scroll = container.querySelector('#fin-cat-scroll');
            scroll?.scrollIntoView({ behavior: 'smooth' });
          }
          return;
        }
        await createAssetRecord({
          dateKey: this.dateKey,
          type: this.finType,
          amount,
          category: this.selectedCat,
          remark: remarkInput?.value || '',
          createTime: Date.now()
        });
        this.selectedCat = '';
        await this.refresh(container);
        return;
      }

      if (target.classList.contains('fr-del-btn')) {
        const id = parseInt(target.dataset.id || '0');
        if (id) {
          await deleteAssetRecord(id);
          await this.refresh(container);
        }
        return;
      }
    });
  }

  private async refresh(container: HTMLElement) {
    await this.loadData();
    const oldEl = container.querySelector('.finance-page');
    if (oldEl) {
      const temp = document.createElement('div');
      temp.innerHTML = this.buildHTML();
      const newEl = temp.firstElementChild;
      if (newEl) {
        oldEl.replaceWith(newEl);
        this.bindEvents(newEl as HTMLElement);
      }
    }
  }
}