/**
 * 共用測試輔助函數
 */

/**
 * 標準頁面初始化：清除 localStorage、關閉教學遮罩、摺疊側邊欄
 */
async function setup(page, { clearAll = false } = {}) {
  await page.addInitScript((opts) => {
    if (opts.clearAll) localStorage.clear();
    // 關閉教學遮罩，避免干擾點擊
    localStorage.setItem('monee_tutorial_seen', '1');
    // 摺疊側邊欄，避免 sidebar-overlay (z-index:998) 遮擋所有點擊
    localStorage.setItem('sidebarCollapsed', 'true');
  }, { clearAll });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  // 等待 JS 初始化完成（loading overlay 消失）
  await page.waitForSelector('#loadingOverlay', { state: 'hidden', timeout: 10000 });
}

/**
 * 新增一筆「電子貨幣」標籤帳戶，用於需要帳戶才能操作的測試
 * 注意：預設標籤「現金」會 disable #inpName，需先切換到「電子貨幣」
 */
async function addBankAccount(page, name = '測試帳戶', balance = '10000') {
  await page.locator('#addBtn').click();
  // 等待銀行標籤列出現（確認 Modal 動畫完成、handleTypeChange 已執行）
  await page.waitForSelector('#rowBankTag', { state: 'visible' });
  // 切換到「電子貨幣」標籤，讓名稱欄位可編輯（預設「現金」會 disabled）
  await page.locator('#inpBankTag').selectOption('電子貨幣');
  await page.locator('#inpName').fill(name);
  await page.locator('#inpBalance').fill(balance);
  await page.locator('#accountModal .modal-header').getByText('儲存').click();
  await page.waitForSelector('#accountModal', { state: 'hidden' });
}

/**
 * 透過計算機設定 readonly 金額欄位
 * 直接操作 calcState 以確保穩定性
 */
async function setAmountViaCalc(page, inputId, amount) {
  await page.evaluate(({ id, val }) => {
    // 開啟計算機（設定 target 和初始化狀態）
    openCalculator(id);
    // 直接設定 calcState.display
    if (typeof calcState !== 'undefined') {
      calcState.display = String(val);
      updateCalcDisplay();
    }
    // 關閉並寫回值
    closeCalculator();
  }, { id: inputId, val: amount });
}

module.exports = { setup, addBankAccount, setAmountViaCalc };
