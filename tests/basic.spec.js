const { test, expect } = require('@playwright/test');

test('首頁可載入並呈現主要 UI', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err));

  // 避免首次載入時自動跳出 spotlight 教學遮罩，干擾 E2E 點擊/等待
  await page.addInitScript(() => {
    try {
      localStorage.setItem('monee_tutorial_seen', '1');
    } catch {
      // ignore
    }
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveTitle(/Monee/i);
  await expect(page.locator('.app-container')).toBeVisible();
  await expect(page.locator('h1').filter({ hasText: 'Monee' })).toBeVisible();

  await expect(page.locator('#sidebarToggleBtn')).toBeVisible();
  await expect(page.locator('#sidebar')).toBeVisible();

  expect(errors).toHaveLength(0);
});

test('側邊欄收合按鈕可切換狀態', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err));

  // 避免本機上次儲存的側邊欄狀態影響測試穩定性
  await page.addInitScript(() => {
    try {
      localStorage.removeItem('sidebarCollapsed');
      // 避免首次載入時自動跳出 spotlight 教學遮罩，干擾點擊
      localStorage.setItem('monee_tutorial_seen', '1');
    } catch {
      // ignore
    }
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const sidebar = page.locator('#sidebar');
  const overlay = page.locator('#sidebarOverlay');
  const toggleBtnDesktop = page.locator('#sidebarToggleBtn');
  const toggleBtnNavbar = page.locator('#sidebarToggleBtnNavbar');

  await expect(sidebar).toBeVisible();
  await expect(toggleBtnDesktop).toBeVisible();

  // 進入頁面後（Desktop 解析度），通常會套用 active 狀態
  await expect(sidebar).toHaveClass(/active/);
  await expect(overlay).toHaveClass(/active/);

  // 第一次點擊 -> collapsed
  await toggleBtnDesktop.click();
  await expect(sidebar).toHaveClass(/collapsed/);
  await expect(overlay).not.toHaveClass(/active/);

  // 收合後桌面按鈕會被隱藏，改用 navbar 上的展開按鈕
  await expect(toggleBtnDesktop).toBeHidden();
  await expect(toggleBtnNavbar).toBeVisible();

  // 再點一次 -> 回到 active
  await toggleBtnNavbar.click();
  await expect(sidebar).not.toHaveClass(/collapsed/);
  await expect(overlay).toHaveClass(/active/);

  expect(errors).toHaveLength(0);
});

