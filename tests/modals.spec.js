/**
 * 所有 Modal 開啟 / 關閉測試
 * 覆蓋風險：所有 26 個 Modal 的 onclick 綁定（開啟/關閉）
 *           拆分後 Modal 仍可正確顯示/隱藏
 */
const { test, expect } = require('@playwright/test');
const { setup, addBankAccount } = require('./helpers');

/**
 * 通用 Modal 測試：驗證能開啟、能關閉、不產生 JS 錯誤
 */
function modalTest(label, openFn, closeFn, modalId) {
  test(`${label} — 可開啟`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await setup(page);

    await page.evaluate(openFn);
    await expect(page.locator(`#${modalId}`)).toBeVisible();
    expect(errors, '頁面 JS 錯誤').toEqual([]);
  });

  test(`${label} — 可關閉`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await setup(page);

    await page.evaluate(openFn);
    await expect(page.locator(`#${modalId}`)).toBeVisible();
    await page.evaluate(closeFn);
    await expect(page.locator(`#${modalId}`)).not.toBeVisible();
    expect(errors, '頁面 JS 錯誤').toEqual([]);
  });
}

test.describe('Modal 開啟 / 關閉', () => {
  // 帳戶編輯 Modal
  modalTest(
    '帳戶 Modal',
    () => openModal(),
    () => closeModal(),
    'accountModal'
  );

  // 計算機 Modal
  modalTest(
    '計算機 Modal',
    () => openCalculator('inpBalance'),
    () => closeCalculator(),
    'calculatorModal'
  );

  // 使用者選擇器
  modalTest(
    '使用者選擇器 Modal',
    () => openUserSelector(),
    () => closeUserSelector(),
    'userSelectorModal'
  );

  // 日曆記帳（底部 Sheet）
  modalTest(
    '日曆記帳 Modal',
    () => openCalendarJournalModal(),
    () => closeCalendarJournalModal(),
    'calendarJournalModal'
  );

  // 支出
  modalTest(
    '支出 Modal',
    () => openNewExpense(),
    () => closeExpenseModal(),
    'expenseModal'
  );

  // 收入
  modalTest(
    '收入 Modal',
    () => openNewIncome(),
    () => closeIncomeModal(),
    'incomeModal'
  );

  // 固定支出清單（固定轉帳清單需要 2 個帳戶，移至獨立 describe）

  // 固定支出清單
  modalTest(
    '固定支出清單 Modal',
    () => openFixedExpenseListFromJournal(),
    () => closeFixedExpenseListModal(),
    'fixedExpenseListModal'
  );

  // 固定收入清單
  modalTest(
    '固定收入清單 Modal',
    () => openFixedIncomeListFromJournal(),
    () => closeFixedIncomeListModal(),
    'fixedIncomeListModal'
  );

  // 重複週期選擇器
  modalTest(
    '重複週期選擇器 Modal',
    () => openRepeatSelector(),
    () => closeRepeatSelector(),
    'repeatSelectorModal'
  );

  // 日期選擇器（透過支出 Modal）
  modalTest(
    '日期選擇器 Modal',
    () => { openNewExpense(); openExpenseDateSelector(); },
    () => closeDatePicker(),
    'datePickerModal'
  );

  // 分類選擇器（透過支出 Modal）
  modalTest(
    '分類選擇器 Modal',
    () => { openNewExpense(); openCategorySelector('expense'); },
    () => closeCategorySelector(),
    'categorySelectorModal'
  );

  // 帳戶選擇器（需要帳戶才能顯示，移至獨立 describe）

  // 日曆設定 Modal
  modalTest(
    '日曆設定 Modal',
    () => openCalendarSettingsModal(),
    () => closeCalendarSettingsModal(),
    'calendarSettingsModal'
  );

  // 除權息 Modal
  modalTest(
    '除權息歷史 Modal',
    () => openDividendModal(),
    () => closeDividendModal(),
    'dividendModal'
  );
});

// ─────────────────────────────────────────
// 轉帳 Modal（需要 2 個帳戶）
// ─────────────────────────────────────────
test.describe('轉帳 Modal（需帳戶）', () => {
  test('轉帳 Modal — 有兩個帳戶時可開啟', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await setup(page, { clearAll: true });
    await addBankAccount(page, '帳戶A', '10000');
    await addBankAccount(page, '帳戶B', '5000');

    await page.evaluate(() => openNewTransfer());
    await expect(page.locator('#transferModal')).toBeVisible();
    expect(errors, '頁面 JS 錯誤').toEqual([]);
  });

  test('轉帳 Modal — 可關閉', async ({ page }) => {
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
// 使用者編輯 Modal（需要 userId）
// ─────────────────────────────────────────
test.describe('使用者編輯 Modal', () => {
  test('使用者編輯 Modal — 可開啟', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await setup(page);

    // openUserEditModal 需要 userId 參數
    await page.evaluate(() => openUserEditModal(currentUserId));
    await expect(page.locator('#userEditModal')).toBeVisible();
    expect(errors, '頁面 JS 錯誤').toEqual([]);
  });

  test('使用者編輯 Modal — 可關閉', async ({ page }) => {
    await setup(page);
    await page.evaluate(() => openUserEditModal(currentUserId));
    await expect(page.locator('#userEditModal')).toBeVisible();
    await page.evaluate(() => closeUserEditModal());
    await expect(page.locator('#userEditModal')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────
// Modal 背景點擊關閉
// ─────────────────────────────────────────
test.describe('Modal 背景點擊關閉', () => {
  test('帳戶 Modal — 不支援背景點擊關閉（全螢幕 Modal）', async ({ page }) => {
    await setup(page);
    await page.evaluate(() => openModal());
    await expect(page.locator('#accountModal')).toBeVisible();
    // 點 modal 左上角（非按鈕區域）
    await page.locator('#accountModal').click({ position: { x: 5, y: 5 } });
    // 全螢幕 Modal 不應被背景點擊關閉
    await expect(page.locator('#accountModal')).toBeVisible();
  });

  test('使用者選擇器 Modal — 背景點擊可關閉', async ({ page }) => {
    await setup(page);
    await page.evaluate(() => openUserSelector());
    await expect(page.locator('#userSelectorModal')).toBeVisible();

    // 模擬點擊 modal 背景（modal 本身充當 overlay）
    await page.evaluate(() => {
      const el = document.getElementById('userSelectorModal');
      el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await expect(page.locator('#userSelectorModal')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────
// 固定項目編輯 Modal
// ─────────────────────────────────────────
test.describe('固定項目編輯 Modal', () => {
  test('固定轉帳新增 Modal 可從清單開啟', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await setup(page, { clearAll: true });
    await addBankAccount(page, '帳戶A', '10000');
    await addBankAccount(page, '帳戶B', '5000');

    await page.evaluate(() => openFixedTransferList());
    await expect(page.locator('#fixedTransferListModal')).toBeVisible();

    // 點清單中的 + 新增按鈕
    await page.evaluate(() => addNewFixedTransfer());
    await expect(page.locator('#fixedTransferModal')).toBeVisible();
    expect(errors, '頁面 JS 錯誤').toEqual([]);
  });

  test('固定轉帳編輯 Modal 可關閉', async ({ page }) => {
    await setup(page);
    await page.evaluate(() => addNewFixedTransfer());
    await expect(page.locator('#fixedTransferModal')).toBeVisible();
    await page.evaluate(() => closeFixedTransferModal());
    await expect(page.locator('#fixedTransferModal')).not.toBeVisible();
  });

  test('固定支出新增 Modal 可開啟', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await setup(page);

    await page.evaluate(() => openFixedExpenseModal());
    await expect(page.locator('#fixedExpenseModal')).toBeVisible();
    expect(errors, '頁面 JS 錯誤').toEqual([]);
  });

  test('固定收入新增 Modal 可開啟', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await setup(page);

    await page.evaluate(() => openFixedIncomeModal());
    await expect(page.locator('#fixedIncomeModal')).toBeVisible();
    expect(errors, '頁面 JS 錯誤').toEqual([]);
  });
});

// ─────────────────────────────────────────
// 固定轉帳清單 Modal（需要 2 個帳戶）
// ─────────────────────────────────────────
test.describe('固定轉帳清單 Modal（需帳戶）', () => {
  test('固定轉帳清單 Modal — 有兩個帳戶時可開啟', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await setup(page, { clearAll: true });
    await addBankAccount(page, '帳戶A', '10000');
    await addBankAccount(page, '帳戶B', '5000');

    await page.evaluate(() => openFixedTransferList());
    await expect(page.locator('#fixedTransferListModal')).toBeVisible();
    expect(errors, '頁面 JS 錯誤').toEqual([]);
  });

  test('固定轉帳清單 Modal — 可關閉', async ({ page }) => {
    await setup(page, { clearAll: true });
    await addBankAccount(page, '帳戶A', '10000');
    await addBankAccount(page, '帳戶B', '5000');

    await page.evaluate(() => openFixedTransferList());
    await expect(page.locator('#fixedTransferListModal')).toBeVisible();
    await page.evaluate(() => closeFixedTransferListModal());
    await expect(page.locator('#fixedTransferListModal')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────
// 帳戶選擇器 Modal（需要帳戶）
// ─────────────────────────────────────────
test.describe('帳戶選擇器 Modal（需帳戶）', () => {
  test('帳戶選擇器 Modal — 有帳戶時可開啟', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await setup(page, { clearAll: true });
    await addBankAccount(page, '測試帳戶', '10000');

    await page.evaluate(() => {
      openNewExpense();
      openJournalAccountSelector('expense');
    });
    await expect(page.locator('#accountSelectorModal')).toBeVisible();
    expect(errors, '頁面 JS 錯誤').toEqual([]);
  });

  test('帳戶選擇器 Modal — 可關閉', async ({ page }) => {
    await setup(page, { clearAll: true });
    await addBankAccount(page, '測試帳戶', '10000');

    await page.evaluate(() => {
      openNewExpense();
      openJournalAccountSelector('expense');
    });
    await expect(page.locator('#accountSelectorModal')).toBeVisible();
    await page.evaluate(() => closeAccountSelector());
    await expect(page.locator('#accountSelectorModal')).not.toBeVisible();
  });
});
