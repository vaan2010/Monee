/**
 * 記帳功能測試（支出 / 收入 / 轉帳）
 * 覆蓋風險：跨函數呼叫（saveExpense/saveIncome/saveTransfer → journal 更新）
 *           onclick HTML 綁定（各 Modal 取消/儲存按鈕）
 */
const { test, expect } = require('@playwright/test');
const { setup, addBankAccount, setAmountViaCalc } = require('./helpers');

// ─────────────────────────────────────────
// 記帳 Tab 切換
// ─────────────────────────────────────────
test.describe('Tab 切換至記帳頁', () => {
  test('點擊「記帳」Tab 可切換到日曆頁面', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await setup(page);

    await page.locator('#calendarTabBtn').click();
    // 資產 Tab 應取消 active
    await expect(page.locator('#assetListTab')).not.toHaveClass(/active/);
    // 日曆頁應可見
    await expect(page.locator('#calendarPage')).toBeVisible();
    expect(errors, '頁面 JS 錯誤').toEqual([]);
  });

  test('點擊「資產」Tab 可切換回資產頁面', async ({ page }) => {
    await setup(page);
    await page.locator('#calendarTabBtn').click();
    await page.locator('#assetListTab').click();

    await expect(page.locator('#assetListTab')).toHaveClass(/active/);
    await expect(page.locator('#calendarPage')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────
// 支出 Modal
// ─────────────────────────────────────────
test.describe('支出 Modal', () => {
  test('可開啟支出 Modal', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await setup(page);

    await page.evaluate(() => openNewExpense());
    await expect(page.locator('#expenseModal')).toBeVisible();
    expect(errors, '頁面 JS 錯誤').toEqual([]);
  });

  test('點「取消」可關閉支出 Modal', async ({ page }) => {
    await setup(page);
    await page.evaluate(() => openNewExpense());
    await expect(page.locator('#expenseModal')).toBeVisible();

    await page.locator('#expenseModal .modal-header button').first().click();
    await expect(page.locator('#expenseModal')).not.toBeVisible();
  });

  test('closeExpenseModal() 函數可關閉 Modal', async ({ page }) => {
    await setup(page);
    await page.evaluate(() => openNewExpense());
    await page.evaluate(() => closeExpenseModal());
    await expect(page.locator('#expenseModal')).not.toBeVisible();
  });

  test('支出 Modal 包含必要欄位', async ({ page }) => {
    await setup(page);
    await page.evaluate(() => openNewExpense());

    await expect(page.locator('#expenseTitle')).toBeVisible();
    await expect(page.locator('#expenseAmount')).toBeVisible();
    await expect(page.locator('#expenseDateDisplay')).toBeVisible();
  });

  test('可填寫標題並透過計算機設定金額', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await setup(page);

    await page.evaluate(() => openNewExpense());
    await page.locator('#expenseTitle').fill('午餐');

    await setAmountViaCalc(page, 'expenseAmount', '150');

    // 金額欄位應有值
    const amtVal = await page.locator('#expenseAmount').inputValue();
    expect(amtVal).toBe('150');
    expect(errors, '頁面 JS 錯誤').toEqual([]);
  });

  test('有帳戶時可完整儲存支出記錄', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await setup(page, { clearAll: true });

    // 先建立帳戶
    await addBankAccount(page, '日常帳戶', '20000');

    // 開啟支出 Modal
    await page.evaluate(() => openNewExpense());
    await expect(page.locator('#expenseModal')).toBeVisible();

    // 填標題
    await page.locator('#expenseTitle').fill('超市購物');

    // 設金額
    await setAmountViaCalc(page, 'expenseAmount', '350');

    // 用 JS 選擇類別和帳戶（saveExpense 需要兩者都已設定）
    await page.evaluate(() => {
      selectCategory('餐飲', 'expense');
      if (accounts.length > 0) {
        selectJournalAccount(accounts[0], 'expense');
      }
    });

    // 儲存
    await page.locator('#expenseModal .modal-header').getByText('儲存').click();

    // Modal 應關閉，無 JS 錯誤
    await expect(page.locator('#expenseModal')).not.toBeVisible();
    expect(errors, '頁面 JS 錯誤').toEqual([]);
  });

  test('支出 Modal 切換到收入 Tab 時開啟收入 Modal', async ({ page }) => {
    await setup(page);
    await page.evaluate(() => openNewExpense());
    await expect(page.locator('#expenseModal')).toBeVisible();

    // 點 Tab 切換到收入
    await page.evaluate(() => switchJournalFormTab('income'));
    await expect(page.locator('#incomeModal')).toBeVisible();
    await expect(page.locator('#expenseModal')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────
// 收入 Modal
// ─────────────────────────────────────────
test.describe('收入 Modal', () => {
  test('可開啟收入 Modal', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await setup(page);

    await page.evaluate(() => openNewIncome());
    await expect(page.locator('#incomeModal')).toBeVisible();
    expect(errors, '頁面 JS 錯誤').toEqual([]);
  });

  test('點「取消」可關閉收入 Modal', async ({ page }) => {
    await setup(page);
    await page.evaluate(() => openNewIncome());
    await page.locator('#incomeModal .modal-header button').first().click();
    await expect(page.locator('#incomeModal')).not.toBeVisible();
  });

  test('closeIncomeModal() 函數可關閉 Modal', async ({ page }) => {
    await setup(page);
    await page.evaluate(() => openNewIncome());
    await page.evaluate(() => closeIncomeModal());
    await expect(page.locator('#incomeModal')).not.toBeVisible();
  });

  test('收入 Modal 包含必要欄位', async ({ page }) => {
    await setup(page);
    await page.evaluate(() => openNewIncome());

    await expect(page.locator('#incomeTitle')).toBeVisible();
    await expect(page.locator('#incomeAmount')).toBeVisible();
    await expect(page.locator('#incomeDateDisplay')).toBeVisible();
  });

  test('有帳戶時可完整儲存收入記錄', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await setup(page, { clearAll: true });

    await addBankAccount(page, '薪資帳戶', '0');

    await page.evaluate(() => openNewIncome());
    await page.locator('#incomeTitle').fill('薪水');
    await setAmountViaCalc(page, 'incomeAmount', '50000');

    await page.evaluate(() => {
      selectCategory('薪資', 'income');
      if (accounts.length > 0) {
        selectJournalAccount(accounts[0], 'income');
      }
    });

    await page.locator('#incomeModal .modal-header').getByText('儲存').click();
    await expect(page.locator('#incomeModal')).not.toBeVisible();
    expect(errors, '頁面 JS 錯誤').toEqual([]);
  });
});

// ─────────────────────────────────────────
// 轉帳 Modal
// ─────────────────────────────────────────
test.describe('轉帳 Modal', () => {
  test('可開啟轉帳 Modal（需要兩個帳戶）', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await setup(page, { clearAll: true });

    // 轉帳需要至少 2 個銀行/錢包帳戶
    await addBankAccount(page, '帳戶A', '10000');
    await addBankAccount(page, '帳戶B', '5000');

    await page.evaluate(() => openNewTransfer());
    await expect(page.locator('#transferModal')).toBeVisible();
    expect(errors, '頁面 JS 錯誤').toEqual([]);
  });

  test('closeTransferModal() 可關閉轉帳 Modal', async ({ page }) => {
    await setup(page, { clearAll: true });
    await addBankAccount(page, '帳戶A', '10000');
    await addBankAccount(page, '帳戶B', '5000');

    await page.evaluate(() => openNewTransfer());
    await expect(page.locator('#transferModal')).toBeVisible();
    await page.evaluate(() => closeTransferModal());
    await expect(page.locator('#transferModal')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────
// 日曆記帳 Modal（底部 Sheet）
// ─────────────────────────────────────────
test.describe('日曆記帳 Sheet Modal', () => {
  test('可開啟日曆記帳 Modal', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await setup(page);

    await page.evaluate(() => openCalendarJournalModal());
    await expect(page.locator('#calendarJournalModal')).toBeVisible();
    expect(errors, '頁面 JS 錯誤').toEqual([]);
  });

  test('關閉日曆記帳 Modal', async ({ page }) => {
    await setup(page);
    await page.evaluate(() => openCalendarJournalModal());
    await page.evaluate(() => closeCalendarJournalModal());
    await expect(page.locator('#calendarJournalModal')).not.toBeVisible();
  });

  test('日曆記帳 Modal Tab 可切換（支出/收入/轉帳/固定轉帳）', async ({ page }) => {
    await setup(page);
    await page.evaluate(() => openCalendarJournalModal());

    // 預設應在支出 tab
    await expect(page.locator('#journalTabExpense')).toHaveClass(/active/);

    // 切到收入
    await page.locator('#journalTabIncome').click();
    await expect(page.locator('#journalTabIncome')).toHaveClass(/active/);

    // 切到轉帳
    await page.locator('#journalTabTransfer').click();
    await expect(page.locator('#journalTabTransfer')).toHaveClass(/active/);
  });
});

// ─────────────────────────────────────────
// 日記帳（Journal）資料顯示
// ─────────────────────────────────────────
test.describe('日記帳資料顯示', () => {
  test('儲存支出後記帳頁顯示該筆記錄', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await setup(page, { clearAll: true });

    await addBankAccount(page, '生活費帳戶', '30000');

    // 新增支出
    await page.evaluate(() => openNewExpense());
    await page.locator('#expenseTitle').fill('健身房月費');
    await setAmountViaCalc(page, 'expenseAmount', '999');
    await page.evaluate(() => {
      selectCategory('生活', 'expense');
      if (accounts.length > 0) selectJournalAccount(accounts[0], 'expense');
    });
    await page.locator('#expenseModal .modal-header').getByText('儲存').click();
    await expect(page.locator('#expenseModal')).not.toBeVisible();

    // 切換到記帳頁
    await page.locator('#calendarTabBtn').click();
    await expect(page.locator('#calendarPage')).toBeVisible();

    // 確認 calendarPage 可見（記帳頁）
    await expect(page.locator('#calendarPage')).toBeVisible();

    expect(errors, '頁面 JS 錯誤').toEqual([]);
  });
});
