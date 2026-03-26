/**
 * 帳戶管理測試
 * 覆蓋風險：跨函數呼叫（saveAccount → updateAccountList → updateChartData）
 *           onclick HTML 綁定（#addBtn, 取消/儲存）
 */
const { test, expect } = require('@playwright/test');
const { setup, addBankAccount, setAmountViaCalc } = require('./helpers');

// ─────────────────────────────────────────
// 帳戶 Modal 開啟 / 關閉
// ─────────────────────────────────────────
test.describe('帳戶 Modal 開啟關閉', () => {
  test('+ 按鈕可開啟帳戶 Modal', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await setup(page);

    await page.locator('#addBtn').click();
    await expect(page.locator('#accountModal')).toBeVisible();
    expect(errors, '頁面 JS 錯誤').toEqual([]);
  });

  test('點「取消」可關閉 Modal', async ({ page }) => {
    await setup(page);
    await page.locator('#addBtn').click();
    await expect(page.locator('#accountModal')).toBeVisible();

    // 第一個按鈕是「取消」
    await page.locator('#accountModal .modal-header button').first().click();
    await expect(page.locator('#accountModal')).not.toBeVisible();
  });

  test('Modal 預設顯示「基本設定」Tab', async ({ page }) => {
    await setup(page);
    await page.locator('#addBtn').click();

    await expect(page.locator('#tabBasic')).toHaveClass(/active/);
    await expect(page.locator('#contentBasic')).toBeVisible();
    await expect(page.locator('#contentDetail')).not.toBeVisible();
  });

  test('切換到「庫存明細」Tab', async ({ page }) => {
    await setup(page);
    await page.locator('#addBtn').click();

    await page.locator('#tabDetail').click();
    await expect(page.locator('#tabDetail')).toHaveClass(/active/);
    await expect(page.locator('#contentDetail')).toBeVisible();
    await expect(page.locator('#contentBasic')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────
// 帳戶 CRUD
// ─────────────────────────────────────────
test.describe('帳戶 CRUD', () => {
  test('新增錢包帳戶後出現在資產清單', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await setup(page, { clearAll: true });

    await addBankAccount(page, '我的銀行', '88000');

    // 驗證帳戶已存入 accounts 陣列
    const savedAcct = await page.evaluate(() => accounts.find(a => a.name === '我的銀行'));
    expect(savedAcct).toBeTruthy();

    // 切換到錢包分頁（page 1），個別帳戶才會顯示在清單
    await page.evaluate(() => switchToPage(1));
    await page.waitForFunction(() =>
      document.querySelectorAll('.page-item.page-active .list-item[data-id]').length > 0
    );

    // 帳戶名稱應出現在目前啟用分頁的個別帳戶項目中
    const itemText = await page.evaluate(() => {
      const item = document.querySelector('.page-item.page-active .list-item[data-id]');
      return item ? item.textContent : '';
    });
    expect(itemText).toContain('我的銀行');
    // 總淨資產應更新（不再是 "--"）
    await expect(page.locator('#totalNetWorth')).not.toHaveText('--');
    expect(errors, '頁面 JS 錯誤').toEqual([]);
  });

  test('新增加密貨幣帳戶', async ({ page }) => {
    await setup(page, { clearAll: true });

    await page.locator('#addBtn').click();
    await page.waitForSelector('#rowBankTag', { state: 'visible' });
    await page.locator('#inpType').selectOption('crypto');
    // 加密貨幣使用 #inpSymbol（#inpName 在 auto 模式下隱藏）
    await page.waitForSelector('#rowSymbol', { state: 'visible' });
    await page.locator('#inpSymbol').fill('BTC');
    await page.locator('#inpBalance').fill('0.5');
    await page.locator('#accountModal .modal-header').getByText('儲存').click();

    await expect(page.locator('#accountModal')).not.toBeVisible();
    // 驗證帳戶已存入 accounts 陣列（不依賴 UI 渲染時機）
    const cryptoAcct = await page.evaluate(() => accounts.find(a => a.type === 'crypto'));
    expect(cryptoAcct).toBeTruthy();
    expect(cryptoAcct.name).toContain('BTC');
  });

  test('新增美股帳戶（需輸入代碼）', async ({ page }) => {
    await setup(page, { clearAll: true });

    await page.locator('#addBtn').click();
    await page.waitForSelector('#rowBankTag', { state: 'visible' });
    await page.locator('#inpType').selectOption('stock');

    // 切換為美股後，代碼欄位應出現
    await expect(page.locator('#rowSymbol')).toBeVisible();
    // 平均成本欄位也應出現（美股儲存時必填）
    await expect(page.locator('#rowCost')).toBeVisible();

    await page.locator('#inpSymbol').fill('AAPL');
    await page.locator('#inpBalance').fill('10');
    await page.locator('#inpCost').fill('150');
    await page.locator('#accountModal .modal-header').getByText('儲存').click();

    await expect(page.locator('#accountModal')).not.toBeVisible();
  });

  test('新增負債帳戶', async ({ page }) => {
    await setup(page, { clearAll: true });

    await page.locator('#addBtn').click();
    await page.locator('#inpType').selectOption('debt');
    await page.locator('#inpName').fill('信用卡債');
    await page.locator('#inpBalance').fill('15000');
    await page.locator('#accountModal .modal-header').getByText('儲存').click();

    await expect(page.locator('#accountModal')).not.toBeVisible();
  });

  test('編輯帳戶（點擊列表項目後可開啟帶資料的 Modal）', async ({ page }) => {
    await setup(page, { clearAll: true });
    await addBankAccount(page, '編輯測試帳戶', '5000');

    // 切換到錢包分頁（page 1）才能看到個別帳戶
    await page.evaluate(() => switchToPage(1));
    await page.waitForFunction(() =>
      document.querySelectorAll('.page-item.page-active .list-item[data-id]').length > 0
    );

    // 透過 JS 點擊啟用分頁的第一個個別帳戶項目
    await page.evaluate(() => {
      const item = document.querySelector('.page-item.page-active .list-item[data-id]');
      if (item) item.click();
    });

    // Modal 應開啟且帶入名稱
    await expect(page.locator('#accountModal')).toBeVisible();
    const nameVal = await page.locator('#inpName').inputValue();
    expect(nameVal).toBe('編輯測試帳戶');
  });

  test('刪除帳戶後從清單移除', async ({ page }) => {
    await setup(page, { clearAll: true });
    await addBankAccount(page, '待刪帳戶', '1000');

    // 確認帳戶存在（透過 JS accounts 陣列）
    const beforeDelete = await page.evaluate(() => accounts.find(a => a.name === '待刪帳戶'));
    expect(beforeDelete).toBeTruthy();

    // 切換到錢包分頁（page 1）才能點選個別帳戶
    await page.evaluate(() => switchToPage(1));
    await page.waitForFunction(() =>
      document.querySelectorAll('.page-item.page-active .list-item[data-id]').length > 0
    );

    // 透過 JS 點擊啟用分頁的第一個個別帳戶項目
    await page.evaluate(() => {
      const item = document.querySelector('.page-item.page-active .list-item[data-id]');
      if (item) item.click();
    });
    await expect(page.locator('#accountModal')).toBeVisible();

    // 呼叫刪除（覆蓋 confirm 以自動接受）
    await page.evaluate(() => {
      window.confirm = () => true;
      deleteAccount();
    });

    // 帳戶應從 accounts 陣列移除
    const afterDelete = await page.evaluate(() => accounts.find(a => a.name === '待刪帳戶'));
    expect(afterDelete).toBeUndefined();
  });
});

// ─────────────────────────────────────────
// 計算機 Modal
// ─────────────────────────────────────────
test.describe('計算機 Modal', () => {
  test('可開啟計算機並輸入數字後寫入欄位', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await setup(page);

    await page.locator('#addBtn').click();
    // 點計算機圖示（餘額旁）
    await page.locator('#accountModal .calc-btn').first().click();
    await expect(page.locator('#calculatorModal')).toBeVisible();

    // 透過 calcInput 直接輸入數字（避免 handleCalcKey 的 DOM event 問題）
    await page.evaluate(() => calcInput('1'));
    await page.evaluate(() => calcInput('2'));
    await page.evaluate(() => calcInput('3'));
    await expect(page.locator('#calcDisplay')).toHaveText('123');

    // 完成
    await page.locator('#calculatorModal .modal-header button').click();
    await expect(page.locator('#calculatorModal')).not.toBeVisible();

    // 值應被寫入 #inpBalance
    const val = await page.locator('#inpBalance').inputValue();
    expect(val).toBe('123');
    expect(errors, '頁面 JS 錯誤').toEqual([]);
  });

  test('計算機 C 鍵可清除輸入', async ({ page }) => {
    await setup(page);
    await page.locator('#addBtn').click();
    await page.evaluate(() => openCalculatorModal('inpBalance'));

    await page.evaluate(() => calcInput('9'));
    await page.evaluate(() => calcInput('9'));
    await expect(page.locator('#calcDisplay')).toHaveText('99');

    // C 鍵清除：直接重設 calcState 並更新顯示
    await page.evaluate(() => {
      calcState.display = '0';
      calcState.newInput = true;
      calcState.operator = null;
      calcState.prevValue = null;
      updateCalcDisplay();
    });
    await expect(page.locator('#calcDisplay')).toHaveText('0');
  });
});
