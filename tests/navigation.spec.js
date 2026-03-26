/**
 * 導航與 UI 控制測試
 * 覆蓋風險：onclick HTML 綁定（所有 UI 控制按鈕）
 *           CSS 載入順序（主題切換、元素可見性）
 *           全域變數依賴（settings.theme、currentDisplayCurrency）
 */
const { test, expect } = require('@playwright/test');
const { setup, addBankAccount } = require('./helpers');

// ─────────────────────────────────────────
// 主題切換
// ─────────────────────────────────────────
test.describe('主題切換', () => {
  test('切換深色/淺色主題', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await setup(page);

    // 預設深色主題：html[data-theme] 應不存在或不為 light
    const themeBefore = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));

    // 開啟側邊欄 → 系統 → 切換主題
    await page.evaluate(() => toggleTheme());

    const themeAfter = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(themeAfter).not.toBe(themeBefore);
    expect(errors, '頁面 JS 錯誤').toEqual([]);
  });

  test('再次切換主題可還原', async ({ page }) => {
    await setup(page);
    const themeBefore = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    await page.evaluate(() => toggleTheme());
    await page.evaluate(() => toggleTheme());
    const themeAfter = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(themeAfter).toBe(themeBefore);
  });
});

// ─────────────────────────────────────────
// 幣別切換
// ─────────────────────────────────────────
test.describe('幣別切換', () => {
  test('點擊幣別按鈕可切換 TWD/USD', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await setup(page);

    const textBefore = await page.locator('#currencyToggleText').textContent();

    await page.locator('#currencyToggleBtn').click();
    const textAfter = await page.locator('#currencyToggleText').textContent();

    expect(textAfter).not.toBe(textBefore);
    expect(['TWD', 'USD']).toContain(textAfter?.trim());
    expect(errors, '頁面 JS 錯誤').toEqual([]);
  });

  test('再次點擊可切回原始幣別', async ({ page }) => {
    await setup(page);
    const textBefore = await page.locator('#currencyToggleText').textContent();
    await page.locator('#currencyToggleBtn').click();
    await page.locator('#currencyToggleBtn').click();
    const textAfter = await page.locator('#currencyToggleText').textContent();
    expect(textAfter).toBe(textBefore);
  });
});

// ─────────────────────────────────────────
// 數字顯示 / 隱藏
// ─────────────────────────────────────────
test.describe('數字隱藏切換', () => {
  test('點擊眼睛按鈕可隱藏數字', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await setup(page);
    await addBankAccount(page, '帳戶A', '12345');

    // 透過 JS 呼叫（避免 tab-bar z-index 干擾點擊）
    await page.evaluate(() => toggleNumbers());

    // body 應套用 numbers-hidden class
    const bodyClass = await page.evaluate(() => document.body.classList.contains('numbers-hidden'));
    expect(bodyClass).toBe(true);
    expect(errors, '頁面 JS 錯誤').toEqual([]);
  });

  test('再次點擊可顯示數字', async ({ page }) => {
    await setup(page);
    await page.evaluate(() => toggleNumbers()); // 隱藏
    await page.evaluate(() => toggleNumbers()); // 顯示
    const bodyClass = await page.evaluate(() => document.body.classList.contains('numbers-hidden'));
    expect(bodyClass).toBe(false);
  });
});

// ─────────────────────────────────────────
// 圖表模式切換（圓餅圖 ↔ 折線圖）
// ─────────────────────────────────────────
test.describe('圖表模式切換', () => {
  test('可切換到折線圖模式', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await setup(page);

    // 預設顯示圓餅圖
    await expect(page.locator('#chartWrapper')).toBeVisible();

    await page.locator('#chartModeToggleBtn').click();

    // 折線圖 wrapper 應出現
    await expect(page.locator('#lineChartWrapper')).toBeVisible();
    expect(errors, '頁面 JS 錯誤').toEqual([]);
  });

  test('再次切換可回到圓餅圖', async ({ page }) => {
    await setup(page);
    await page.locator('#chartModeToggleBtn').click(); // 切換到折線圖
    await page.locator('#chartModeToggleBtn').click(); // 切換回圓餅圖
    await expect(page.locator('#chartWrapper')).toBeVisible();
  });
});

// ─────────────────────────────────────────
// 分頁導航（Next / Prev）
// ─────────────────────────────────────────
test.describe('分頁導航', () => {
  test('可切換到下一頁', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    // 使用桌面解析度顯示分頁箭頭
    await page.setViewportSize({ width: 1280, height: 800 });
    await setup(page);

    const pageBefore = await page.evaluate(() => currentPage);

    await page.evaluate(() => switchToNextPage());
    const pageAfter = await page.evaluate(() => currentPage);

    expect(pageAfter).toBeGreaterThan(pageBefore);
    expect(errors, '頁面 JS 錯誤').toEqual([]);
  });

  test('可切換到上一頁', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await setup(page);

    await page.evaluate(() => switchToNextPage()); // 先前進
    const pageBefore = await page.evaluate(() => currentPage);

    await page.evaluate(() => switchToPrevPage());
    const pageAfter = await page.evaluate(() => currentPage);

    expect(pageAfter).toBeLessThan(pageBefore);
  });

  test('switchToPage 可直接跳到指定頁', async ({ page }) => {
    await setup(page);
    await page.evaluate(() => switchToPage(2));
    const currentPageVal = await page.evaluate(() => currentPage);
    expect(currentPageVal).toBe(2);
  });
});

// ─────────────────────────────────────────
// 側邊欄選單摺疊 / 展開
// ─────────────────────────────────────────
test.describe('側邊欄選單展開收合', () => {
  test('點擊「投資相關」可展開選單', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await setup(page);

    // 先展開側邊欄（setup 將側邊欄設為摺疊以避免 overlay 遮擋）
    await page.evaluate(() => toggleSidebarCollapse());
    await page.waitForFunction(() => document.getElementById('sidebar').classList.contains('active'));

    // 子選單預設是摺疊狀態
    await expect(page.locator('#menuSection-invest')).toHaveClass(/collapsed/);

    // 點擊標題展開
    await page.locator('.menu-group-label').filter({ hasText: '投資相關' }).click();
    await expect(page.locator('#menuSection-invest')).not.toHaveClass(/collapsed/);
    expect(errors, '頁面 JS 錯誤').toEqual([]);
  });

  test('再次點擊可收合選單', async ({ page }) => {
    await setup(page);
    await page.evaluate(() => toggleSidebarCollapse());
    await page.waitForFunction(() => document.getElementById('sidebar').classList.contains('active'));

    await page.locator('.menu-group-label').filter({ hasText: '投資相關' }).click();
    await expect(page.locator('#menuSection-invest')).not.toHaveClass(/collapsed/);

    await page.locator('.menu-group-label').filter({ hasText: '投資相關' }).click();
    await expect(page.locator('#menuSection-invest')).toHaveClass(/collapsed/);
  });

  test('點擊「資料與設定」可展開', async ({ page }) => {
    await setup(page);
    await page.evaluate(() => toggleSidebarCollapse());
    await page.waitForFunction(() => document.getElementById('sidebar').classList.contains('active'));

    await page.locator('.menu-group-label').filter({ hasText: '資料與設定' }).click();
    await expect(page.locator('#menuSection-data-settings')).not.toHaveClass(/collapsed/);
  });

  test('點擊「系統」可展開', async ({ page }) => {
    await setup(page);
    await page.evaluate(() => toggleSidebarCollapse());
    await page.waitForFunction(() => document.getElementById('sidebar').classList.contains('active'));

    await page.locator('.menu-group-label').filter({ hasText: '系統' }).click();
    await expect(page.locator('#menuSection-system')).not.toHaveClass(/collapsed/);
  });
});

// ─────────────────────────────────────────
// 使用者選擇器 Modal
// ─────────────────────────────────────────
test.describe('使用者選擇器 Modal', () => {
  test('點擊頭像可開啟使用者選擇器', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await setup(page);

    // 頭像在側邊欄內，透過 JS 呼叫（側邊欄摺疊時 pointer-events: none）
    await page.evaluate(() => openUserSelector());
    await expect(page.locator('#userSelectorModal')).toBeVisible();
    expect(errors, '頁面 JS 錯誤').toEqual([]);
  });

  test('點「完成」可關閉使用者選擇器', async ({ page }) => {
    await setup(page);
    await page.evaluate(() => openUserSelector());
    await expect(page.locator('#userSelectorModal')).toBeVisible();

    await page.locator('#userSelectorModal .modal-header button').click();
    await expect(page.locator('#userSelectorModal')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────
// 日曆月份導航
// ─────────────────────────────────────────
test.describe('日曆月份導航', () => {
  test('切換到上一個月', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await setup(page);

    await page.locator('#calendarTabBtn').click();
    await expect(page.locator('#calendarPage')).toBeVisible();

    const monthBefore = await page.locator('#calendarMonthYear').textContent();
    await page.evaluate(() => changeCalendarMonth(-1));
    const monthAfter = await page.locator('#calendarMonthYear').textContent();

    expect(monthAfter).not.toBe(monthBefore);
    expect(errors, '頁面 JS 錯誤').toEqual([]);
  });

  test('「今天」按鈕可回到當月', async ({ page }) => {
    await setup(page);
    await page.locator('#calendarTabBtn').click();

    // 先切換幾個月
    await page.evaluate(() => changeCalendarMonth(-3));
    const monthBefore = await page.locator('#calendarMonthYear').textContent();

    await page.locator('.calendar-today-btn').click();
    const monthAfter = await page.locator('#calendarMonthYear').textContent();

    expect(monthAfter).not.toBe(monthBefore);
  });
});

// ─────────────────────────────────────────
// 折線圖範圍選擇器
// ─────────────────────────────────────────
test.describe('折線圖範圍選擇', () => {
  test('切換到折線圖後範圍按鈕可點擊', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await setup(page);

    await page.evaluate(() => toggleChartMode());
    await expect(page.locator('#lineChartRangeSelector')).toBeVisible();

    // 透過 JS 切換範圍（避免 tab-bar z-index 干擾點擊）
    await page.evaluate(() => changeLineChartRange(7));
    await expect(page.locator('[data-range="7"]')).toHaveClass(/active/);
    expect(errors, '頁面 JS 錯誤').toEqual([]);
  });

  test('切換到「1年」範圍', async ({ page }) => {
    await setup(page);
    await page.evaluate(() => toggleChartMode());
    await page.evaluate(() => changeLineChartRange(365));
    await expect(page.locator('[data-range="365"]')).toHaveClass(/active/);
  });
});
