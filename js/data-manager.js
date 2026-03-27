// ====== data-manager.js ======

    function tryMigrateOldData() {
        if (localStorage.getItem(STORAGE_KEY_DATA)) return;
        const oldKeys = ['myAssets_v6', 'myAssets_v5', 'myAssets_v4'];
        let found = false;
        for (let key of oldKeys) {
            let d = localStorage.getItem(key);
            if (d) { localStorage.setItem(STORAGE_KEY_DATA, d); found = true; break; }
        }
        let oldS = localStorage.getItem('myAssets_settings_v3');
        if (oldS) localStorage.setItem(STORAGE_KEY_SETTINGS, oldS);
        if (found) {
            const t = document.getElementById('migrationToast');
            t.style.display='block'; setTimeout(()=>t.style.display='none',3000);
        }
    }

    // Load State (多使用者版本)
    function loadUserData(userId) {
        const userDataKey = `${STORAGE_KEY_DATA}_${userId}`;
        const userSettingsKey = `${STORAGE_KEY_SETTINGS}_${userId}`;

        const rawAccounts = JSON.parse(localStorage.getItem(userDataKey)) || [];
        const accounts = rawAccounts.map((a, index) => ({
            ...a, balance: safeParseFloat(a.balance), currentPrice: safeParseFloat(a.currentPrice),
            dayChange: safeParseFloat(a.dayChange || 0), dayChangePercent: safeParseFloat(a.dayChangePercent || 0),
            cost: safeParseFloat(a.cost || 0), order: (a.order!==undefined)?a.order:index, transactions: a.transactions || []
        }));

        const defaultSettings = {
            apiKey: '', fugleKey: '', geminiKey: '', usdRate: 32.5, usdtRate: 1.0, feeRate: 0.1425, chartTextColor: 'white', theme: 'dark',
            cloudBackupEnabled: false, cloudBackupInterval: 24, cloudBackupLastTime: null, cloudBackupToken: null,
            driveClientId: '', driveAccessToken: null, driveUserEmail: null,
            pageVisibility: { 'overview': true, 'bank': true, 'stock': true, 'twstock': true, 'crypto': true },
            pageOrder: [0, 1, 2, 3, 4],
            displayCurrency: 'TWD'
        };

        // 載入用戶設定
        const savedSettings = JSON.parse(localStorage.getItem(userSettingsKey)) || {};
        const settings = { ...defaultSettings, ...savedSettings };

        return { accounts, settings };
    }

    let { accounts, settings } = loadUserData(currentUserId);

    // Currency Display（從 settings 讀取，如果沒有則從 localStorage，都沒有則使用預設值）
    let currentDisplayCurrency = settings.displayCurrency || localStorage.getItem('displayCurrency') || 'TWD'; // 'TWD' or 'USD'
    // 如果 settings 中有值，同步到 localStorage（向後兼容）
    if(settings.displayCurrency) {
        localStorage.setItem('displayCurrency', settings.displayCurrency);
    }
    // 如果 settings 中沒有值但 localStorage 有值，更新 settings
    if(!settings.displayCurrency && localStorage.getItem('displayCurrency')) {
        settings.displayCurrency = currentDisplayCurrency;
    }

    // 分頁顯示設置（從 settings 讀取，如果沒有則從 localStorage，都沒有則使用預設值）
    let pageVisibility = settings.pageVisibility || JSON.parse(localStorage.getItem('pageVisibility')) || {
        'overview': true,
        'bank': true,
        'stock': true,
        'twstock': true,
        'crypto': true
    };
    // 如果 settings 中有值，同步到 localStorage（向後兼容）
    if(settings.pageVisibility) {
        localStorage.setItem('pageVisibility', JSON.stringify(settings.pageVisibility));
    }
    // 如果 settings 中沒有值但 localStorage 有值，更新 settings
    if(!settings.pageVisibility && localStorage.getItem('pageVisibility')) {
        settings.pageVisibility = pageVisibility;
    }

    // 分頁順序設置（從 settings 讀取，如果沒有則從 localStorage，都沒有則使用預設值）
    let pageOrder = settings.pageOrder || JSON.parse(localStorage.getItem('pageOrder')) || [0, 1, 2, 3, 4];
    // 如果 settings 中有值，同步到 localStorage（向後兼容）
    if(settings.pageOrder) {
        localStorage.setItem('pageOrder', JSON.stringify(settings.pageOrder));
    }
    // 如果 settings 中沒有值但 localStorage 有值，更新 settings
    if(!settings.pageOrder && localStorage.getItem('pageOrder')) {
        settings.pageOrder = pageOrder;
    }

    function saveData() {
        if (isUserSwitching) return; // 鎖定攔截
        const userDataKey = `${STORAGE_KEY_DATA}_${currentUserId}`;
        localStorage.setItem(userDataKey, JSON.stringify(accounts));
        if (window.syncAccountsToFirestore && window.firebaseUserLoggedIn) {
            window.syncAccountsToFirestore(accounts);
        }
    }

    function saveSettings() {
        if (isUserSwitching) return; // 鎖定攔截
        const userSettingsKey = `${STORAGE_KEY_SETTINGS}_${currentUserId}`;
        localStorage.setItem(userSettingsKey, JSON.stringify(settings));
        if (window.syncSettingsToFirestore && window.firebaseUserLoggedIn) {
            window.syncSettingsToFirestore(settings);
        }
    }

    // 載入資產歷史記錄
    function loadAssetHistory() {
        const historyKey = `${STORAGE_KEY_ASSET_HISTORY}_${currentUserId}`;
        return JSON.parse(localStorage.getItem(historyKey) || '{}');
    }

    // 保存資產歷史記錄
    function saveAssetHistory(history) {
        if (isUserSwitching) return;
        const historyKey = `${STORAGE_KEY_ASSET_HISTORY}_${currentUserId}`;
        localStorage.setItem(historyKey, JSON.stringify(history));
        // 同步到 Firestore
        if (window.syncAssetHistoryToFirestore && window.firebaseUserLoggedIn) {
            window.syncAssetHistoryToFirestore(history);
        }
    }

    function loadTwstockDailyBalances() {
        const key = `${STORAGE_KEY_TWSTOCK_DAILY}_${currentUserId}`;
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : {};
        } catch (e) { return {}; }
    }
    function saveTwstockDailyBalances(data) {
        if (isUserSwitching) return;
        const key = `${STORAGE_KEY_TWSTOCK_DAILY}_${currentUserId}`;
        localStorage.setItem(key, JSON.stringify(data));
    }

    // 記錄今日資產快照（每天只記錄一次，但會更新當天最新值）
    function recordDailyAssetSnapshot() {
        if (isUserSwitching) return;
        if (!accounts || accounts.length === 0) return;

        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

        // 計算各分類總值（TWD）
        let totals = { bank: 0, stock: 0, twstock: 0, crypto: 0, total: 0, debt: 0 };
        accounts.forEach(acc => {
            if(acc.type === 'bank' && acc.bankTag === '信用卡') return; // 信用卡僅供紀錄，不計入總資產
            let val = calculateTWD(acc);
            if(acc.type === 'debt') {
                totals.debt += val;
            } else if(totals[acc.type] !== undefined) {
                totals[acc.type] += val;
            }
        });
        totals.total = totals.bank + totals.stock + totals.twstock + totals.crypto - totals.debt;

        // 四捨五入
        Object.keys(totals).forEach(k => { totals[k] = Math.round(totals[k]); });

        const history = loadAssetHistory();
        history[dateStr] = totals;

        // 記錄台股每日持股（用於除權息歷史自動帶入股數）
        const twDaily = loadTwstockDailyBalances();
        const twToday = {};
        accounts.filter(a => a.type === 'twstock').forEach(acc => {
            twToday[acc.id] = parseFloat(acc.balance) || 0;
        });
        twDaily[dateStr] = twToday;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 730);
        const cutoffStr = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth()+1).padStart(2,'0')}-${String(cutoffDate.getDate()).padStart(2,'0')}`;
        Object.keys(twDaily).forEach(key => { if (key < cutoffStr) delete twDaily[key]; });
        saveTwstockDailyBalances(twDaily);

        // 清理超過 730 天（2年）的舊資料
        Object.keys(history).forEach(key => {
            if(key < cutoffStr) delete history[key];
        });

        saveAssetHistory(history);
        if(currentChartMode === 'line') {
            requestAnimationFrame(() => renderAssetLineChart());
        }
    }

    
    // 折線圖記錄：重置（清空）與復原（依使用者分開儲存）
    let _assetHistoryRestorePoint = {};
    
    function resetAssetHistory() {
        if (!confirm('確定要重置折線圖記錄嗎？\n所有歷史資料將被清空，此操作可透過「復原」還原。')) return;
        const history = loadAssetHistory();
        const count = Object.keys(history).length;
        if (count === 0) {
            alert('目前沒有折線圖記錄可重置');
            return;
        }
        _assetHistoryRestorePoint[currentUserId] = JSON.parse(JSON.stringify(history));
        saveAssetHistory({});
        if (currentChartMode === 'line') renderAssetLineChart();
        alert('已重置折線圖記錄');
    }
    
    function restoreAssetHistory() {
        const backup = _assetHistoryRestorePoint[currentUserId];
        if (!backup) {
            alert('沒有可復原的折線圖記錄');
            return;
        }
        if (!confirm('確定要復原折線圖記錄嗎？\n將還原至上一次重置前的狀態。')) return;
        saveAssetHistory(backup);
        delete _assetHistoryRestorePoint[currentUserId];
        if (currentChartMode === 'line') renderAssetLineChart();
        alert('已復原折線圖記錄');
    }
    

    function getTwstockBalanceAtDate(accId, dateStr) {
        const data = loadTwstockDailyBalances();
        const dates = Object.keys(data).filter(d => d <= dateStr).sort().reverse();
        if (dates.length === 0) return null;
        const day = data[dates[0]];
        return day && day[accId] !== undefined ? day[accId] : null;
    }
    
    // 記錄今日資產快照（每天只記錄一次，但會更新當天最新值）
