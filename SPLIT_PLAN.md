# Monee index.html 拆分計畫

## 現況
- **檔案大小**：955 KB
- **總行數**：17,591 行
- **結構**：單一 HTML 檔（CSS 1,407 行 + HTML 1,656 行 + JS 14,524 行）
- **JS 函數數量**：395 個

---

## 目標結構（共 17 個檔案）

```
Monee/
├── index.html          (精簡版，僅保留 HTML 結構 + <script src> 引用)
├── styles.css          (從 <style> 抽出)
└── js/
    ├── constants.js    (常數、儲存 key、顏色定義)
    ├── utils.js        (格式化、計算工具函數)
    ├── data-manager.js (localStorage 讀寫、資料遷移、歷史快照)
    ├── user-manager.js (多使用者、頭像管理)
    ├── calculator.js   (計算機 Modal 邏輯)
    ├── account.js      (帳戶 CRUD、renderAssets、分頁渲染)
    ├── chart.js        (Highcharts 圓餅圖、折線圖)
    ├── api.js          (股票/加密貨幣 API、除息資料)
    ├── journal.js      (支出/收入/轉帳、日記帳)
    ├── fixed.js        (固定支出/收入/轉帳)
    ├── ui.js           (Modal 控制、側邊欄、分頁導航、日曆)
    ├── touch.js        (滑動手勢、touch 事件)
    ├── tutorial.js     (Spotlight 教學、AI 教學)
    ├── backup.js       (匯入/匯出、Google Drive 同步)
    └── main.js         (初始化、DOMContentLoaded、事件綁定)
```

---

## 各檔案詳細規劃

### 1. `styles.css`
- **來源行數**：83–1,489（1,407 行）
- **內容**：CSS 變數、主題（深/淺）、所有元件樣式
- **風險**：⭐ 低
  - 純搬移，不涉及邏輯
  - 需確認 `<link rel="stylesheet">` 在所有 `<script>` 之前載入
- **index.html 變動**：移除 `<style>` 區塊，加入 `<link rel="stylesheet" href="styles.css">`

### 2. `js/constants.js`
- **預估行數**：~250 行
- **內容**：
  - `STORAGE_KEY_*`（13 個 key）
  - `BANK_DATA`、`PAGE_TYPES`、`PAGE_NAMES`
  - `OVERVIEW_COLORS`、`TYPE_COLORS`、`TYPE_NAMES`
  - `CHART_ITEM_COLOR_PALETTES`、`CHART_ANIMATION_CONFIG`
  - `DEFAULT_AVATARS`、`GOOGLE_DRIVE_FOLDER_NAME`
- **風險**：⭐ 低
  - 純常數，無函數依賴
  - **必須第一個載入**（其他所有 JS 都依賴這些常數）

### 3. `js/utils.js`
- **預估行數**：~200 行
- **內容**：
  - `formatAmount()`、`formatPnL()`
  - `safeParseFloat()`、`hexToHue()`
  - `calculateTWD()`、`calculateUSD()`
  - `calculateValue()`、`calculatePnL()`
- **風險**：⭐ 低
  - 純工具函數，只依賴 constants.js

### 4. `js/data-manager.js`
- **預估行數**：~450 行
- **內容**：
  - `loadUserData()`、`saveData()`、`saveSettings()`
  - `loadAssetHistory()`、`saveAssetHistory()`
  - `recordDailyAssetSnapshot()`
  - `loadTwstockDailyBalances()`、`saveTwstockDailyBalances()`
  - `tryMigrateOldData()`
  - 全域變數：`accounts`、`settings`、`pageVisibility`、`pageOrder`
- **風險**：⭐⭐ 中
  - 全域變數 `accounts`、`settings` 被幾乎所有其他模組引用
  - 必須在 account.js、journal.js 等之前載入
  - 資料遷移邏輯複雜，需仔細測試

### 5. `js/user-manager.js`
- **預估行數**：~350 行
- **內容**：
  - `openUserSelector()`、`closeUserSelector()`
  - `openUserEditModal()`、`closeUserEditModal()`、`saveUserEdit()`
  - `createNewUser()`、`switchUser()`
  - `openAvatarSelector()`、`closeAvatarSelector()`
  - `handleAvatarUpload()`、`confirmAvatarCrop()`、`cancelAvatarCrop()`
  - 全域變數：`users`、`currentUserId`、`cropImage`、`cropScale/X/Y`
- **風險**：⭐⭐ 中
  - 需依賴 data-manager.js（切換使用者時重新載入資料）
  - Canvas 頭像裁切邏輯獨立

### 6. `js/calculator.js`
- **預估行數**：~180 行
- **內容**：
  - `openCalculator()`、`closeCalculator()`
  - `openCalculatorModal()`（別名）
  - `calcInput()`、`handleCalcKey()`
  - `handleOperator()`、`performCalculation()`
  - `updateCalcDisplay()`、`formatCalcResult()`
  - 全域變數：`calcState`、`currentCalcTarget`
- **風險**：⭐ 低
  - 功能獨立，無複雜依賴

### 7. `js/account.js`
- **預估行數**：~600 行
- **內容**：
  - `openModal()`、`closeModal()`
  - `editAccount()`、`saveAccount()`、`deleteAccount()`
  - `updateOrder()`、`handleTypeChange()`、`handleBankTagChange()`
  - `renderAssets()`、`updateAccountList()`
  - `switchToPage()`、`switchToNextPage()`、`switchToPrevPage()`
  - `renderPageIndicator()`、`updateActivePageClass()`
  - `reorderPageItems()`
  - 全域變數：`editingId`、`currentPage`
- **風險**：⭐⭐⭐ 高
  - `renderAssets()` 呼叫 chart.js 的 `updateChartData()`（循環依賴風險）
  - HTML 中大量 `onclick="saveAccount()"` 等直接綁定
  - `saveAccount()` → `updateAccountList()` → `updateChartData()` 跨模組呼叫鏈
  - **需最後測試**

### 8. `js/chart.js`
- **預估行數**：~650 行
- **內容**：
  - `initChart()`、`updateChartData()`
  - `renderAssetLineChart()`、`doRenderLineChart()`
  - `toggleChartMode()`、`changeLineChartRange()`
  - `enterDetailLevel()`、`resetChartLevel()`
  - `updateChartCurrencyDisplay()`
  - 全域變數：`chartInstance`、`chartLevel`、`currentDetails`、`chartAnimationEngine`
- **風險**：⭐⭐ 中
  - 依賴外部 Highcharts CDN（已在 HTML 載入）
  - `updateChartData()` 被 account.js 呼叫 → 必須在 account.js 之前定義
  - 折線圖資料依賴 data-manager.js 的 `loadAssetHistory()`

### 9. `js/api.js`
- **預估行數**：~450 行
- **內容**：
  - `fetchPrices()`（Finnhub + Fugle）
  - `fetchTWStockTickers()`、`searchTWStockByKeyword()`
  - `fetchTWStockName()`、`fetchUSStockProfile()`
  - `fetchCryptoLogo()`、`syncNameFromSymbol()`
  - `loadTwDividendData()`、`queryDividendHistory()`
  - `setApiKey()`
  - 全域變數：`twDividendMap`
- **風險**：⭐⭐ 中
  - 非同步 fetch，錯誤處理需完整保留
  - Fugle API 格式可能隨時改變（已有現存問題，非本次引入）

### 10. `js/journal.js`
- **預估行數**：~900 行
- **內容**：
  - `openNewExpense()`、`closeExpenseModal()`、`saveExpense()`
  - `openNewIncome()`、`closeIncomeModal()`、`saveIncome()`
  - `openNewTransfer()`、`closeTransferModal()`、`saveTransfer()`
  - `openCalendarJournalModal()`、`closeCalendarJournalModal()`
  - `selectCategory()`、`openCategorySelector()`、`closeCategorySelector()`
  - `selectJournalAccount()`、`openJournalAccountSelector()`、`closeAccountSelector()`
  - `openExpenseDateSelector()`、`confirmDatePicker()`、`closeDatePicker()`
  - `switchJournalFormTab()`
  - `renderCalendar()`、`changeCalendarMonth()`、`renderJournalList()`
  - 全域變數：`currentJournalCategory`、`currentJournalAccountId` 等
- **風險**：⭐⭐⭐ 高
  - 函數數量最多（50+）
  - 與 account.js 交互（儲存後需更新帳戶餘額）
  - `saveExpense()` → `saveData()` → 帳戶餘額更新 → `renderAssets()` 跨模組鏈
  - 需仔細追蹤狀態變數

### 11. `js/fixed.js`
- **預估行數**：~500 行
- **內容**：
  - `openFixedExpenseModal()`、`saveFixedExpense()`、`openFixedExpenseListFromJournal()`
  - `openFixedIncomeModal()`、`saveFixedIncome()`、`openFixedIncomeListFromJournal()`
  - `addNewFixedTransfer()`、`openFixedTransferList()`、`saveFixedTransfer()`
  - `checkAndExecuteFixed*()` 自動執行函數
  - `closeFixed*Modal()` 系列
- **風險**：⭐⭐ 中
  - 依賴 journal.js、account.js（執行時會修改帳戶/記帳資料）

### 12. `js/ui.js`
- **預估行數**：~500 行
- **內容**：
  - `toggleSidebar()`、`toggleSidebarCollapse()`
  - `toggleMenuSection()`、`initMenuSections()`
  - `toggleTheme()`、`toggleCurrencyDisplay()`
  - `toggleNumbers()`、`toggleItemNumbers()`
  - `toggleEditMode()`
  - `openCalendarSettingsModal()`、`closeCalendarSettingsModal()`
  - `openDividendModal()`、`closeDividendModal()`
  - `openRepeatSelector()`、`closeRepeatSelector()`、`selectRepeat()`
  - `renderPageVisibilitySettings()`、`togglePageVisibility()`
  - `openUserEditModal()`（部分已在 user-manager.js）
  - 全域變數：`currentDisplayCurrency`、`isEditMode`、`sortables`
- **風險**：⭐⭐ 中
  - `toggleCurrencyDisplay()` 會觸發 chart 和 assets 重新渲染

### 13. `js/touch.js`
- **預估行數**：~250 行
- **內容**：
  - `handleDetailTouchStart/Move/End()`
  - `handleEditModalTouchStart/Move/End()`
  - `_onSwipeTouchStart/Move/End()`
  - 頁面滑動（pageContainer swipe）
  - 全域變數：`touchStartX/Y`、`detailTouchStartX/Y`、`editModalTouchStartX`
- **風險**：⭐ 低
  - 手勢邏輯相對獨立

### 14. `js/tutorial.js`
- **預估行數**：~250 行
- **內容**：
  - `openTutorialAssets()`、`openTutorialJournal()`
  - `startSpotlightTutorial()`、`nextSpotlightStep()`、`endSpotlightTutorial()`
  - `positionSpotlight()`
  - `openExpenseAiTutorial()`
- **風險**：⭐ 低
  - 功能獨立，不影響核心業務邏輯

### 15. `js/backup.js`
- **預估行數**：~250 行
- **內容**：
  - `exportData()`、`importData()`、`handleFileImport()`
  - `setupCloudBackup()`、`handleGoogleDriveSync()`
  - `cloudBackupTimer` 相關
- **風險**：⭐⭐ 中
  - Google Drive OAuth 流程需完整保留
  - 匯入時呼叫 data-manager.js 重新載入資料

### 16. `js/main.js`
- **預估行數**：~350 行
- **內容**：
  - `DOMContentLoaded` 事件處理（初始化所有模組）
  - `window.onload` / `window.addEventListener`
  - Favicon 初始化
  - Service Worker 註冊（PWA）
  - 全域錯誤處理
  - 初始化呼叫順序：`tryMigrateOldData()` → `loadUserData()` → `initChart()` → `renderAssets()` → 其餘
- **風險**：⭐⭐ 中
  - 初始化順序至關重要（改錯順序會造成 undefined 錯誤）
  - 需確保所有模組已載入再執行

### 17. `index.html`（精簡後）
- **預估行數**：~1,700 行（HTML 結構 + Modal HTML + script 引用）
- **移除**：`<style>` 區塊、`<script>` 主程式區塊
- **新增**：
  ```html
  <link rel="stylesheet" href="styles.css">
  ...（HTML 結構不變）...
  <script src="js/constants.js"></script>
  <script src="js/utils.js"></script>
  <script src="js/data-manager.js"></script>
  <script src="js/calculator.js"></script>
  <script src="js/user-manager.js"></script>
  <script src="js/api.js"></script>
  <script src="js/chart.js"></script>
  <script src="js/account.js"></script>
  <script src="js/journal.js"></script>
  <script src="js/fixed.js"></script>
  <script src="js/ui.js"></script>
  <script src="js/touch.js"></script>
  <script src="js/tutorial.js"></script>
  <script src="js/backup.js"></script>
  <script src="js/main.js"></script>
  ```

---

## 執行順序（最小風險順序）

| 階段 | 檔案 | 原因 |
|------|------|------|
| 1 | `styles.css` | 最安全，純 CSS |
| 2 | `js/constants.js` | 無依賴，其他都需要它 |
| 3 | `js/utils.js` | 只依賴 constants |
| 4 | `js/calculator.js` | 獨立模組，測試容易 |
| 5 | `js/tutorial.js` | 獨立模組 |
| 6 | `js/touch.js` | 獨立模組 |
| 7 | `js/api.js` | 獨立模組（async fetch） |
| 8 | `js/data-manager.js` | 核心，後續都依賴它 |
| 9 | `js/user-manager.js` | 依賴 data-manager |
| 10 | `js/backup.js` | 依賴 data-manager |
| 11 | `js/chart.js` | 在 account.js 之前定義 |
| 12 | `js/ui.js` | 依賴 chart, account（部分） |
| 13 | `js/account.js` | 核心業務，高風險 |
| 14 | `js/journal.js` | 依賴 account |
| 15 | `js/fixed.js` | 依賴 journal, account |
| 16 | `js/main.js` | 最後：初始化所有模組 |
| 17 | `index.html` 清理 | 確認所有 script 引用正確 |

**每個階段後都需執行 `npx playwright test` 驗證 95/95 通過**

---

## 主要風險清單

| 風險 | 嚴重度 | 對應測試 | 說明 |
|------|--------|----------|------|
| Script 載入順序錯誤 | 🔴 高 | 所有 tests（JS 錯誤） | 必須嚴格按依賴順序 |
| HTML onclick 綁定失效 | 🔴 高 | modals.spec.js 全部 | 函數必須維持全域可存取 |
| 全域變數未初始化 | 🔴 高 | assets.spec.js CRUD | `accounts`、`settings` 等必須在正確時序初始化 |
| `saveAccount→updateChartData` 鏈斷裂 | 🟡 中 | `新增錢包帳戶後出現在資產清單` | account.js 呼叫 chart.js 函數 |
| `saveExpense→帳戶餘額更新` 斷裂 | 🟡 中 | journal.spec.js 儲存測試 | journal.js 呼叫 account.js 函數 |
| `calcState` 初始化時序 | 🟡 中 | `計算機` tests | 必須在 calculator.js 載入時即初始化 |
| CSS 變數不可用 | 🟡 中 | 視覺測試（無） | styles.css 必須在 HTML 渲染前載入 |
| 固定交易自動執行邏輯 | 🟢 低 | 無直接測試 | fixed.js 的複雜執行鏈 |

---

## 時間與 Token 預估

### 方法說明
- Token 計算基於：讀取 index.html 分段（每 2,000 行 ≈ 12,000 tokens）+ 寫入新檔案 + 編輯 index.html
- 每個階段必須先讀取相關程式碼再抽出，不可盲目剪貼

### 各階段預估

| 階段 | 檔案 | 需讀取行數 | 寫入行數 | 預估 Token | 預估時間 |
|------|------|-----------|---------|-----------|---------|
| 1 | styles.css | 1,407 | 1,407 | ~18,000 | 15 分鐘 |
| 2 | constants.js | 400 | 250 | ~8,000 | 10 分鐘 |
| 3 | utils.js | 500 | 200 | ~8,000 | 10 分鐘 |
| 4 | calculator.js | 400 | 180 | ~7,000 | 10 分鐘 |
| 5 | tutorial.js | 400 | 250 | ~7,000 | 10 分鐘 |
| 6 | touch.js | 400 | 250 | ~7,000 | 10 分鐘 |
| 7 | api.js | 800 | 450 | ~15,000 | 20 分鐘 |
| 8 | data-manager.js | 1,000 | 450 | ~18,000 | 25 分鐘 |
| 9 | user-manager.js | 800 | 350 | ~14,000 | 20 分鐘 |
| 10 | backup.js | 500 | 250 | ~9,000 | 15 分鐘 |
| 11 | chart.js | 1,200 | 650 | ~22,000 | 30 分鐘 |
| 12 | ui.js | 1,200 | 500 | ~20,000 | 25 分鐘 |
| 13 | account.js | 1,500 | 600 | ~25,000 | 35 分鐘 |
| 14 | journal.js | 2,500 | 900 | ~40,000 | 50 分鐘 |
| 15 | fixed.js | 1,200 | 500 | ~20,000 | 25 分鐘 |
| 16 | main.js | 1,000 | 350 | ~16,000 | 20 分鐘 |
| 17 | index.html 清理 | 3,000 | 1,700 | ~30,000 | 30 分鐘 |
| **測試（17 次）** | - | - | - | ~30,000 | 60 分鐘 |
| **合計** | **17 檔案** | **~18,800 行讀** | **~9,285 行寫** | **~314,000** | **~6.5 小時** |

> **注意**：Token 預估為每個對話 session 的消耗。由於 index.html 超大（240K tokens 完整讀取），實際會分段處理，總 token 消耗可能達 **400,000–600,000**（跨多個對話）。

### 風險加成
- 若遇到依賴問題需要調試：+30%（每個問題 ~1–2 小時）
- 預計最壞情況：**10 小時 / 800,000 tokens**

---

## 執行前確認清單

- [x] 95/95 測試全部通過（已完成）
- [ ] 確認在 worktree `frosty-cartwright` 分支操作（不影響 master）
- [ ] 每個階段完成後執行 `npx playwright test` 確認仍 95/95
- [ ] 若任何測試失敗，立即回溯該階段的變更再繼續

---

*最後更新：2026-03-26*
