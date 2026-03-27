// ====== fixed.js ======
// Fixed transaction functions: fixed expenses, fixed incomes, fixed transfers
// Extracted from index.html

// ── Storage helpers ──────────────────────────────────────────────────────────

    function loadFixedExpenses() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_FIXED_EXPENSES + '_' + (currentUserId || ''));
            const arr = raw ? JSON.parse(raw) : [];
            return Array.isArray(arr) && (arr.length === 0 || typeof arr[0] === 'object') ? arr : [];
        } catch(e) { return []; }
    }
    function saveFixedExpenses(items) {
        if (!currentUserId) return;
        localStorage.setItem(STORAGE_KEY_FIXED_EXPENSES + '_' + currentUserId, JSON.stringify(items));
    }
    function loadFixedIncomes() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_FIXED_INCOMES + '_' + (currentUserId || ''));
            const arr = raw ? JSON.parse(raw) : [];
            return Array.isArray(arr) && (arr.length === 0 || typeof arr[0] === 'object') ? arr : [];
        } catch(e) { return []; }
    }
    function saveFixedIncomes(items) {
        if (!currentUserId) return;
        localStorage.setItem(STORAGE_KEY_FIXED_INCOMES + '_' + currentUserId, JSON.stringify(items));
    }

    // 載入固定轉帳列表
    function loadFixedTransfers() {
        try {
            const data = localStorage.getItem(`${STORAGE_KEY_FIXED_TRANSFERS}_${currentUserId}`);
            const transfers = data ? JSON.parse(data) : [];
            // 向後兼容：為舊的固定轉帳添加執行記錄欄位
            transfers.forEach(transfer => {
                if(!transfer.executedDates) {
                    transfer.executedDates = [];
                }
                if(!transfer.lastExecutedDate) {
                    transfer.lastExecutedDate = null;
                }
            });
            return transfers;
        } catch(e) {
            return [];
        }
    }

    // 保存固定轉帳列表
    function saveFixedTransfers(transfers) {
        if (isUserSwitching) return; // 鎖定攔截
        try {
            localStorage.setItem(`${STORAGE_KEY_FIXED_TRANSFERS}_${currentUserId}`, JSON.stringify(transfers));
            if (window.syncFixedTransfersToFirestore && window.firebaseUserLoggedIn) {
                window.syncFixedTransfersToFirestore(transfers);
            }
        } catch(e) { console.error(e); }
    }

// ── State variables ───────────────────────────────────────────────────────────

    let editingFixedExpenseId = null;
    let editingFixedIncomeId = null;
    // 當前編輯的固定轉帳ID（null表示新增模式）
    let editingFixedTransferId = null;

// ── Date-lookup helpers ───────────────────────────────────────────────────────

    function getFixedTransfersForDate(date) {
        const transfers = loadFixedTransfers();
        const dateObj = new Date(date);
        dateObj.setHours(0, 0, 0, 0);
        const matchingTransfers = [];

        transfers.forEach(transfer => {
            const startDate = new Date(transfer.startDate);
            startDate.setHours(0, 0, 0, 0);
            const endDate = transfer.endDate ? new Date(transfer.endDate) : null;
            if(endDate) endDate.setHours(0, 0, 0, 0);

            // 檢查日期是否在範圍內
            if(dateObj >= startDate && (!endDate || dateObj <= endDate)) {
                // 檢查是否符合重複規則（與 renderCalendar 中的邏輯相同）
                let matches = false;
                const daysDiff = Math.floor((dateObj - startDate) / (1000 * 60 * 60 * 24));

                switch(transfer.repeat) {
                    case 'daily':
                        matches = true;
                        break;
                    case 'weekly':
                        matches = (daysDiff % 7 === 0);
                        break;
                    case 'monthly':
                        matches = (dateObj.getDate() === startDate.getDate());
                        break;
                    case 'yearly':
                        matches = (dateObj.getMonth() === startDate.getMonth() && dateObj.getDate() === startDate.getDate());
                        break;
                }

                // 如果匹配，加入結果（假日調整的邏輯在日曆渲染時已經處理，這裡直接使用匹配結果）
                if(matches) {
                    matchingTransfers.push(transfer);
                }
            }
        });

        return matchingTransfers;
    }

    // 獲取指定日期的所有固定支出（與固定轉帳相同之重複/日期邏輯）
    function getFixedExpensesForDate(date) {
        const items = loadFixedExpenses();
        const dateObj = new Date(date);
        dateObj.setHours(0, 0, 0, 0);
        const matching = [];
        items.forEach(item => {
            const startDate = new Date(item.startDate);
            startDate.setHours(0, 0, 0, 0);
            const endDate = item.endDate ? new Date(item.endDate) : null;
            if(endDate) endDate.setHours(0, 0, 0, 0);
            if(dateObj < startDate || (endDate && dateObj > endDate)) return;
            const daysDiff = Math.floor((dateObj - startDate) / (1000 * 60 * 60 * 24));
            let matches = false;
            switch(item.repeat || 'monthly') {
                case 'daily': matches = true; break;
                case 'weekly': matches = (daysDiff % 7 === 0); break;
                case 'monthly': matches = (dateObj.getDate() === startDate.getDate()); break;
                case 'yearly': matches = (dateObj.getMonth() === startDate.getMonth() && dateObj.getDate() === startDate.getDate()); break;
            }
            if(matches) matching.push(item);
        });
        return matching;
    }

    // 獲取指定日期的所有固定收入
    function getFixedIncomesForDate(date) {
        const items = loadFixedIncomes();
        const dateObj = new Date(date);
        dateObj.setHours(0, 0, 0, 0);
        const matching = [];
        items.forEach(item => {
            const startDate = new Date(item.startDate);
            startDate.setHours(0, 0, 0, 0);
            const endDate = item.endDate ? new Date(item.endDate) : null;
            if(endDate) endDate.setHours(0, 0, 0, 0);
            if(dateObj < startDate || (endDate && dateObj > endDate)) return;
            const daysDiff = Math.floor((dateObj - startDate) / (1000 * 60 * 60 * 24));
            let matches = false;
            switch(item.repeat || 'monthly') {
                case 'daily': matches = true; break;
                case 'weekly': matches = (daysDiff % 7 === 0); break;
                case 'monthly': matches = (dateObj.getDate() === startDate.getDate()); break;
                case 'yearly': matches = (dateObj.getMonth() === startDate.getMonth() && dateObj.getDate() === startDate.getDate()); break;
            }
            if(matches) matching.push(item);
        });
        return matching;
    }

// ── Fixed Expense list ────────────────────────────────────────────────────────

    function openFixedExpenseListFromJournal() {
        const modal = document.getElementById('fixedExpenseListModal');
        const modalWrapper = modal && modal.querySelector('.modal-content-wrapper');
        if(!modal) return;
        renderFixedExpenseList();
        if(modalWrapper) modalWrapper.style.transform = 'translateY(100%)';
        modal.style.display = 'block';
        modal.style.background = 'rgba(0,0,0,0.5)';
        modal.style.zIndex = '2010';
        requestAnimationFrame(() => {
            setTimeout(() => { if(modalWrapper) modalWrapper.style.transform = 'translateY(0)'; }, 10);
        });
    }
    function closeFixedExpenseListModal() {
        const modal = document.getElementById('fixedExpenseListModal');
        const modalWrapper = modal && modal.querySelector('.modal-content-wrapper');
        if(modalWrapper) modalWrapper.style.transform = 'translateY(100%)';
        if(modal) { modal.style.display = 'none'; }
    }
    function renderFixedExpenseList() {
        const container = document.getElementById('fixedExpenseListContainer');
        if(!container) return;
        const items = loadFixedExpenses();
        container.innerHTML = '';
        if(items.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px; font-size: 14px;">尚無固定支出</div>';
            return;
        }
        items.forEach(item => {
            const tagColor = item.tagColor || '#8e8e93';
            const row = document.createElement('div');
            row.style.cssText = 'padding: 15px; border-radius: 12px; background: var(--bg-color); margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;';
            row.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px; flex: 1; cursor: pointer;" onclick="closeFixedExpenseListModal(); openFixedExpenseModal('${item.id}')">
                    <div style="width: 20px; height: 20px; border-radius: 50%; background: ${tagColor};"></div>
                    <div style="color: var(--text-primary); font-size: 16px; font-weight: 500;">${item.title || '未命名'}</div>
                </div>
                <button onclick="event.stopPropagation(); deleteFixedExpenseItem('${item.id}')" style="padding: 8px 12px; background: var(--color-down); color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; font-weight: 600;">刪除</button>
            `;
            container.appendChild(row);
        });
    }
    function deleteFixedExpenseItem(id) {
        if(!confirm('確定要刪除此固定支出？')) return;
        const items = loadFixedExpenses().filter(x => x.id !== id);
        saveFixedExpenses(items);
        renderFixedExpenseList();
    }

// ── Fixed Income list ─────────────────────────────────────────────────────────

    function openFixedIncomeListFromJournal() {
        const modal = document.getElementById('fixedIncomeListModal');
        const modalWrapper = modal && modal.querySelector('.modal-content-wrapper');
        if(!modal) return;
        renderFixedIncomeList();
        if(modalWrapper) modalWrapper.style.transform = 'translateY(100%)';
        modal.style.display = 'block';
        modal.style.background = 'rgba(0,0,0,0.5)';
        modal.style.zIndex = '2010';
        requestAnimationFrame(() => {
            setTimeout(() => { if(modalWrapper) modalWrapper.style.transform = 'translateY(0)'; }, 10);
        });
    }
    function closeFixedIncomeListModal() {
        const modal = document.getElementById('fixedIncomeListModal');
        const modalWrapper = modal && modal.querySelector('.modal-content-wrapper');
        if(modalWrapper) modalWrapper.style.transform = 'translateY(100%)';
        if(modal) { modal.style.display = 'none'; }
    }
    function renderFixedIncomeList() {
        const container = document.getElementById('fixedIncomeListContainer');
        if(!container) return;
        const items = loadFixedIncomes();
        container.innerHTML = '';
        if(items.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px; font-size: 14px;">尚無固定收入</div>';
            return;
        }
        items.forEach(item => {
            const tagColor = item.tagColor || '#8e8e93';
            const row = document.createElement('div');
            row.style.cssText = 'padding: 15px; border-radius: 12px; background: var(--bg-color); margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;';
            row.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px; flex: 1; cursor: pointer;" onclick="closeFixedIncomeListModal(); openFixedIncomeModal('${item.id}')">
                    <div style="width: 20px; height: 20px; border-radius: 50%; background: ${tagColor};"></div>
                    <div style="color: var(--text-primary); font-size: 16px; font-weight: 500;">${item.title || '未命名'}</div>
                </div>
                <button onclick="event.stopPropagation(); deleteFixedIncomeItem('${item.id}')" style="padding: 8px 12px; background: var(--color-down); color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; font-weight: 600;">刪除</button>
            `;
            container.appendChild(row);
        });
    }
    function deleteFixedIncomeItem(id) {
        if(!confirm('確定要刪除此固定收入？')) return;
        const items = loadFixedIncomes().filter(x => x.id !== id);
        saveFixedIncomes(items);
        renderFixedIncomeList();
    }

// ── Fixed Expense modal ───────────────────────────────────────────────────────

    function openFixedExpenseModal(itemId) {
        currentFixedFormContext = 'expense';
        editingFixedExpenseId = itemId;
        const modal = document.getElementById('fixedExpenseModal');
        const modalWrapper = modal && modal.querySelector('.modal-content-wrapper');
        if(!modal) return;
        fixedExpenseData = { repeat: 'monthly', byPeriod: false, startDate: null, endDate: null, holidayAdjust: 'none', tagColor: null, useAccountBalance: false };
        const weekdays = ['週日','週一','週二','週三','週四','週五','週六'];
        const repeatNames = { daily: '每日', weekly: '每星期', monthly: '每月', yearly: '每年' };
        const adjustNames = { none: '不調整', advance: '提前', delay: '延後' };
        if(itemId) {
            const items = loadFixedExpenses();
            const item = items.find(x => x.id === itemId);
            if(item) {
                document.getElementById('fixedExpenseTitle').value = item.title || '';
                document.getElementById('fixedExpenseAmount').value = item.useAccountBalance ? '' : (item.amount || '');
                const cb = document.getElementById('fixedExpenseUseAccountBalance');
                if(cb) cb.checked = item.useAccountBalance || false;
                updateFixedExpenseAmountMode();
                const acc = accounts.find(a => a.id === item.accountId);
                const accEl = document.getElementById('fixedExpenseAccount');
                if(accEl) { accEl.textContent = acc ? acc.name : '選擇帳戶'; accEl.style.color = acc ? 'var(--text-primary)' : 'var(--text-secondary)'; }
                window.fixedExpenseAccountId = item.accountId || null;
                fixedExpenseData.repeat = item.repeat || 'monthly';
                fixedExpenseData.byPeriod = item.byPeriod || false;
                fixedExpenseData.startDate = item.startDate ? new Date(item.startDate) : new Date();
                fixedExpenseData.endDate = item.endDate ? new Date(item.endDate) : null;
                fixedExpenseData.holidayAdjust = item.holidayAdjust || 'none';
                fixedExpenseData.tagColor = item.tagColor || null;
                document.getElementById('fixedExpenseRepeat').textContent = repeatNames[fixedExpenseData.repeat] || '每月';
                document.getElementById('fixedExpenseByPeriod').checked = fixedExpenseData.byPeriod;
                document.getElementById('fixedExpenseStartDate').textContent = fixedExpenseData.startDate ? (fixedExpenseData.startDate.getFullYear() + '年' + (fixedExpenseData.startDate.getMonth()+1) + '月' + fixedExpenseData.startDate.getDate() + '日 ' + weekdays[fixedExpenseData.startDate.getDay()]) : '-';
                document.getElementById('fixedExpenseEndDate').textContent = fixedExpenseData.endDate ? (fixedExpenseData.endDate.getFullYear() + '年' + (fixedExpenseData.endDate.getMonth()+1) + '月' + fixedExpenseData.endDate.getDate() + '日') : '永不結束';
                document.getElementById('fixedExpenseHolidayAdjust').textContent = adjustNames[fixedExpenseData.holidayAdjust] || '不調整';
                const tagEl = document.getElementById('fixedExpenseTagColor');
                const tagIcon = document.getElementById('fixedExpenseTagIcon');
                if(fixedExpenseData.tagColor && tagEl && tagIcon) { tagEl.textContent = '已選擇'; tagEl.style.color = fixedExpenseData.tagColor; tagIcon.style.color = fixedExpenseData.tagColor; } else if(tagEl && tagIcon) { tagEl.textContent = '選擇顏色'; tagEl.style.color = 'var(--text-secondary)'; tagIcon.style.color = 'var(--text-secondary)'; }
            }
        } else {
            const today = new Date();
            fixedExpenseData.startDate = today;
            document.getElementById('fixedExpenseTitle').value = '';
            document.getElementById('fixedExpenseAmount').value = '';
            document.getElementById('fixedExpenseUseAccountBalance').checked = false;
            updateFixedExpenseAmountMode();
            document.getElementById('fixedExpenseAccount').textContent = '選擇帳戶';
            document.getElementById('fixedExpenseAccount').style.color = 'var(--text-secondary)';
            window.fixedExpenseAccountId = null;
            document.getElementById('fixedExpenseRepeat').textContent = '每月';
            document.getElementById('fixedExpenseByPeriod').checked = false;
            document.getElementById('fixedExpenseStartDate').textContent = today.getFullYear() + '年' + (today.getMonth()+1) + '月' + today.getDate() + '日 ' + weekdays[today.getDay()];
            document.getElementById('fixedExpenseEndDate').textContent = '永不結束';
            document.getElementById('fixedExpenseHolidayAdjust').textContent = '不調整';
            document.getElementById('fixedExpenseTagColor').textContent = '選擇顏色';
            document.getElementById('fixedExpenseTagColor').style.color = 'var(--text-secondary)';
            document.getElementById('fixedExpenseTagIcon').style.color = 'var(--text-secondary)';
        }
        updateFixedExpensePeriodCount();
        updateNextDatesForFixed();
        modal.style.display = 'block';
        modal.style.background = 'transparent';
        modal.style.zIndex = '2012';
        if(modalWrapper) modalWrapper.style.transform = 'translateX(100%)';
        requestAnimationFrame(() => { setTimeout(() => { if(modalWrapper) modalWrapper.style.transform = 'translateX(0)'; }, 10); });
    }
    function saveFixedExpense() {
        const title = (document.getElementById('fixedExpenseTitle').value || '').trim();
        if(!title) { alert('請輸入標題'); return; }
        if(!window.fixedExpenseAccountId) { alert('請選擇帳戶'); return; }
        const useBalance = document.getElementById('fixedExpenseUseAccountBalance').checked;
        if(!useBalance && !document.getElementById('fixedExpenseAmount').value) { alert('請輸入金額'); return; }
        const amount = useBalance ? 0 : (parseFloat(document.getElementById('fixedExpenseAmount').value) || 0);
        if(!fixedExpenseData.startDate) { alert('請選擇開始日期'); return; }
        const items = loadFixedExpenses();
        const payload = {
            id: editingFixedExpenseId || (Date.now().toString()),
            title: title,
            accountId: window.fixedExpenseAccountId,
            amount: amount,
            useAccountBalance: useBalance,
            tagColor: fixedExpenseData.tagColor,
            repeat: fixedExpenseData.repeat,
            byPeriod: fixedExpenseData.byPeriod,
            startDate: fixedExpenseData.startDate.toISOString(),
            endDate: fixedExpenseData.endDate ? fixedExpenseData.endDate.toISOString() : null,
            holidayAdjust: fixedExpenseData.holidayAdjust,
            executionRecords: (editingFixedExpenseId && items.find(x => x.id === editingFixedExpenseId)) ? (items.find(x => x.id === editingFixedExpenseId).executionRecords || {}) : {}
        };
        const idx = items.findIndex(x => x.id === payload.id);
        if(idx >= 0) items[idx] = payload; else items.push(payload);
        saveFixedExpenses(items);
        // 新增後若今天到期則立即執行一次
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        const dueToday = getFixedExpensesForDate(today);
        if (dueToday.some(x => x.id === payload.id) && (!payload.executionRecords || payload.executionRecords[todayStr] === undefined)) {
            if (executeFixedExpense(payload, today)) {
                saveFixedExpenses(items);
                renderAssets();
                updateChartData();
                if (selectedDate) showFixedTransferDetailsForDate(selectedDate);
                renderCalendar();
            }
        }
        closeFixedExpenseModal();
        renderFixedExpenseList();
    }
    function closeFixedExpenseModal() {
        const modal = document.getElementById('fixedExpenseModal');
        const modalWrapper = modal && modal.querySelector('.modal-content-wrapper');
        if(modalWrapper) modalWrapper.style.transform = 'translateX(100%)';
        if(modal) modal.style.display = 'none';
        editingFixedExpenseId = null;
    }

// ── Fixed Income modal ────────────────────────────────────────────────────────

    function openFixedIncomeModal(itemId) {
        currentFixedFormContext = 'income';
        editingFixedIncomeId = itemId;
        const modal = document.getElementById('fixedIncomeModal');
        const modalWrapper = modal && modal.querySelector('.modal-content-wrapper');
        if(!modal) return;
        fixedIncomeData = { repeat: 'monthly', byPeriod: false, startDate: null, endDate: null, holidayAdjust: 'none', tagColor: null, useAccountBalance: false };
        const weekdays = ['週日','週一','週二','週三','週四','週五','週六'];
        const repeatNames = { daily: '每日', weekly: '每星期', monthly: '每月', yearly: '每年' };
        const adjustNames = { none: '不調整', advance: '提前', delay: '延後' };
        if(itemId) {
            const items = loadFixedIncomes();
            const item = items.find(x => x.id === itemId);
            if(item) {
                document.getElementById('fixedIncomeTitle').value = item.title || '';
                document.getElementById('fixedIncomeAmount').value = item.useAccountBalance ? '' : (item.amount || '');
                document.getElementById('fixedIncomeUseAccountBalance').checked = item.useAccountBalance || false;
                updateFixedIncomeAmountMode();
                const acc = accounts.find(a => a.id === item.accountId);
                const accEl = document.getElementById('fixedIncomeAccount');
                if(accEl) { accEl.textContent = acc ? acc.name : '選擇帳戶'; accEl.style.color = acc ? 'var(--text-primary)' : 'var(--text-secondary)'; }
                window.fixedIncomeAccountId = item.accountId || null;
                fixedIncomeData.repeat = item.repeat || 'monthly';
                fixedIncomeData.byPeriod = item.byPeriod || false;
                fixedIncomeData.startDate = item.startDate ? new Date(item.startDate) : new Date();
                fixedIncomeData.endDate = item.endDate ? new Date(item.endDate) : null;
                fixedIncomeData.holidayAdjust = item.holidayAdjust || 'none';
                fixedIncomeData.tagColor = item.tagColor || null;
                document.getElementById('fixedIncomeRepeat').textContent = repeatNames[fixedIncomeData.repeat] || '每月';
                document.getElementById('fixedIncomeByPeriod').checked = fixedIncomeData.byPeriod;
                document.getElementById('fixedIncomeStartDate').textContent = fixedIncomeData.startDate ? (fixedIncomeData.startDate.getFullYear() + '年' + (fixedIncomeData.startDate.getMonth()+1) + '月' + fixedIncomeData.startDate.getDate() + '日 ' + weekdays[fixedIncomeData.startDate.getDay()]) : '-';
                document.getElementById('fixedIncomeEndDate').textContent = fixedIncomeData.endDate ? (fixedIncomeData.endDate.getFullYear() + '年' + (fixedIncomeData.endDate.getMonth()+1) + '月' + fixedIncomeData.endDate.getDate() + '日') : '永不結束';
                document.getElementById('fixedIncomeHolidayAdjust').textContent = adjustNames[fixedIncomeData.holidayAdjust] || '不調整';
                const tagEl = document.getElementById('fixedIncomeTagColor');
                const tagIcon = document.getElementById('fixedIncomeTagIcon');
                if(fixedIncomeData.tagColor && tagEl && tagIcon) { tagEl.textContent = '已選擇'; tagEl.style.color = fixedIncomeData.tagColor; tagIcon.style.color = fixedIncomeData.tagColor; } else if(tagEl && tagIcon) { tagEl.textContent = '選擇顏色'; tagEl.style.color = 'var(--text-secondary)'; tagIcon.style.color = 'var(--text-secondary)'; }
            }
        } else {
            const today = new Date();
            fixedIncomeData.startDate = today;
            document.getElementById('fixedIncomeTitle').value = '';
            document.getElementById('fixedIncomeAmount').value = '';
            document.getElementById('fixedIncomeUseAccountBalance').checked = false;
            updateFixedIncomeAmountMode();
            document.getElementById('fixedIncomeAccount').textContent = '選擇帳戶';
            document.getElementById('fixedIncomeAccount').style.color = 'var(--text-secondary)';
            window.fixedIncomeAccountId = null;
            document.getElementById('fixedIncomeRepeat').textContent = '每月';
            document.getElementById('fixedIncomeByPeriod').checked = false;
            document.getElementById('fixedIncomeStartDate').textContent = today.getFullYear() + '年' + (today.getMonth()+1) + '月' + today.getDate() + '日 ' + weekdays[today.getDay()];
            document.getElementById('fixedIncomeEndDate').textContent = '永不結束';
            document.getElementById('fixedIncomeHolidayAdjust').textContent = '不調整';
            document.getElementById('fixedIncomeTagColor').textContent = '選擇顏色';
            document.getElementById('fixedIncomeTagIcon').style.color = 'var(--text-secondary)';
        }
        updateFixedIncomePeriodCount();
        updateNextDatesForFixed();
        modal.style.display = 'block';
        modal.style.background = 'transparent';
        modal.style.zIndex = '2012';
        if(modalWrapper) modalWrapper.style.transform = 'translateX(100%)';
        requestAnimationFrame(() => { setTimeout(() => { if(modalWrapper) modalWrapper.style.transform = 'translateX(0)'; }, 10); });
    }
    function saveFixedIncome() {
        const title = (document.getElementById('fixedIncomeTitle').value || '').trim();
        if(!title) { alert('請輸入標題'); return; }
        if(!window.fixedIncomeAccountId) { alert('請選擇帳戶'); return; }
        const useBalance = document.getElementById('fixedIncomeUseAccountBalance').checked;
        if(!useBalance && !document.getElementById('fixedIncomeAmount').value) { alert('請輸入金額'); return; }
        const amount = useBalance ? 0 : (parseFloat(document.getElementById('fixedIncomeAmount').value) || 0);
        if(!fixedIncomeData.startDate) { alert('請選擇開始日期'); return; }
        const items = loadFixedIncomes();
        const payload = {
            id: editingFixedIncomeId || (Date.now().toString()),
            title: title,
            accountId: window.fixedIncomeAccountId,
            amount: amount,
            useAccountBalance: useBalance,
            tagColor: fixedIncomeData.tagColor,
            repeat: fixedIncomeData.repeat,
            byPeriod: fixedIncomeData.byPeriod,
            startDate: fixedIncomeData.startDate.toISOString(),
            endDate: fixedIncomeData.endDate ? fixedIncomeData.endDate.toISOString() : null,
            holidayAdjust: fixedIncomeData.holidayAdjust,
            executionRecords: (editingFixedIncomeId && items.find(x => x.id === editingFixedIncomeId)) ? (items.find(x => x.id === editingFixedIncomeId).executionRecords || {}) : {}
        };
        const idx = items.findIndex(x => x.id === payload.id);
        if(idx >= 0) items[idx] = payload; else items.push(payload);
        saveFixedIncomes(items);
        // 新增後若今天到期則立即執行一次
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        const dueToday = getFixedIncomesForDate(today);
        if (dueToday.some(x => x.id === payload.id) && (!payload.executionRecords || payload.executionRecords[todayStr] === undefined)) {
            if (executeFixedIncome(payload, today)) {
                saveFixedIncomes(items);
                renderAssets();
                updateChartData();
                if (selectedDate) showFixedTransferDetailsForDate(selectedDate);
                renderCalendar();
            }
        }
        closeFixedIncomeModal();
        renderFixedIncomeList();
    }
    function closeFixedIncomeModal() {
        const modal = document.getElementById('fixedIncomeModal');
        const modalWrapper = modal && modal.querySelector('.modal-content-wrapper');
        if(modalWrapper) modalWrapper.style.transform = 'translateX(100%)';
        if(modal) modal.style.display = 'none';
        editingFixedIncomeId = null;
    }

// ── Fixed Transfer list ───────────────────────────────────────────────────────

    function openFixedTransferListFromJournal() {
        const availableAccounts = accounts.filter(acc => acc.type === 'bank' || acc.type === 'debt');
        if(availableAccounts.length < 2) {
            alert('使用固定轉帳需要至少兩個帳戶，請先至「新增」建立兩個以上的帳戶後再試，謝謝您。');
            return;
        }
        // 直接打開固定轉帳列表，不關閉當前模態框，讓過渡更順暢
        const modal = document.getElementById('fixedTransferListModal');
        const modalWrapper = modal.querySelector('.modal-content-wrapper');

        // 渲染固定轉帳列表
        renderFixedTransferList();

        // 直接顯示固定轉帳列表，不關閉其他模態框
        if(modalWrapper) {
            modalWrapper.style.transform = 'translateY(100%)';
        }
        modal.style.display = 'block';
        modal.style.background = 'rgba(0,0,0,0.5)';
        modal.style.zIndex = '2010'; // 確保在最上層

        // 使用 requestAnimationFrame 確保動畫流暢
        requestAnimationFrame(() => {
            setTimeout(() => {
                if(modalWrapper) {
                    modalWrapper.style.transform = 'translateY(0)';
                }
            }, 10);
        });
    }

    function getFixedTransferDisplayAmount(transfer, targetDate = null) {
            return transfer.amount || 0;
    }

    function renderFixedTransferList() {
        const container = document.getElementById('fixedTransferListContainer');
        if(!container) return;

        const transfers = loadFixedTransfers();
        container.innerHTML = '';

        if(transfers.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px; font-size: 14px;">尚無固定轉帳</div>';
            return;
        }

        transfers.forEach(transfer => {
            const displayAmount = getFixedTransferDisplayAmount(transfer);
            const item = document.createElement('div');
            item.style.cssText = 'padding: 15px; border-radius: 12px; background: var(--bg-color); margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;';
            item.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px; flex: 1; cursor: pointer;" onclick="editFixedTransfer('${transfer.id}')">
                    <div style="width: 20px; height: 20px; border-radius: 50%; background: ${transfer.tagColor};"></div>
                        <div style="color: var(--text-primary); font-size: 16px; font-weight: 500;">${transfer.title}</div>
                </div>
                <button onclick="event.stopPropagation(); deleteFixedTransfer('${transfer.id}')" style="padding: 8px 12px; background: var(--color-down); color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; font-weight: 600;">刪除</button>
            `;
            container.appendChild(item);
        });
    }

    function deleteFixedTransfer(id) {
        if(!confirm('確定要刪除這個固定轉帳嗎？')) return;

        const transfers = loadFixedTransfers();
        const transfer = transfers.find(t => t.id === id);

        // 檢查是否涉及信用卡且信用卡已被歸零
        if(transfer) {
            const toAccount = accounts.find(acc => acc.id === transfer.toAccountId);
            if(toAccount && toAccount.bankTag === '信用卡' && toAccount.isZeroedByFixedTransfer) {
                console.log('刪除固定轉帳 - 信用卡已被固定轉帳歸零，不恢復金額:', toAccount.name);
                // 不恢復金額，直接刪除固定轉帳
            } else if(transfer.useAccountBalance) {
                // 如果使用帳戶全部金額，需要恢復帳戶餘額
                const fromAccount = accounts.find(acc => acc.id === transfer.fromAccountId);
                const toAccount = accounts.find(acc => acc.id === transfer.toAccountId);

                if(fromAccount && toAccount) {
                    // 計算需要恢復的金額
                    let restoreAmount = 0;
                    if(transfer.creditCardInitialAmount !== undefined && transfer.creditCardInitialAmount !== null) {
                        // 如果涉及信用卡，使用記錄的初始金額
                        restoreAmount = transfer.creditCardInitialAmount;
                    } else if(transfer.initialAmount !== undefined && transfer.initialAmount !== null) {
                        // 使用記錄的初始金額
                        restoreAmount = transfer.initialAmount;
                    } else {
                        // 如果沒有記錄，使用當前轉入帳戶的餘額（取絕對值）
                        restoreAmount = Math.abs(toAccount.balance);
                    }

                    // 恢復帳戶餘額
                    fromAccount.balance += restoreAmount;
                    toAccount.balance -= restoreAmount;
                    console.log('刪除固定轉帳 - 恢復金額:', restoreAmount, '從', fromAccount.name, '到', toAccount.name);
                }
            } else {
                // 使用固定金額，恢復帳戶餘額
                const fromAccount = accounts.find(acc => acc.id === transfer.fromAccountId);
                const toAccount = accounts.find(acc => acc.id === transfer.toAccountId);

                if(fromAccount && toAccount) {
                    const amount = transfer.amount || 0;
                    fromAccount.balance += amount;
                    toAccount.balance -= amount;
                    console.log('刪除固定轉帳 - 恢復金額:', amount, '從', fromAccount.name, '到', toAccount.name);
                }
            }

            // 保存資料
            saveData();
        }

        const filtered = transfers.filter(t => t.id !== id);
        saveFixedTransfers(filtered);

        // 注意：即使刪除固定轉帳，之前的支出記錄仍然不能影響信用卡餘額（通過時間戳判斷）

        // 重新渲染列表和日曆
        renderFixedTransferList();
        renderCalendar();
        renderAssets();
        updateChartData();

        // 更新日期支出資訊（如果當前有選中日期）
        if(selectedDate) {
            showFixedTransferDetailsForDate(selectedDate);
        }

        // 如果列表模態框是打開的，確保列表已更新
        const listModal = document.getElementById('fixedTransferListModal');
        if(listModal && listModal.style.display === 'block') {
            renderFixedTransferList();
        }
    }

    function openFixedTransferList() {
        const availableAccounts = accounts.filter(acc => acc.type === 'bank' || acc.type === 'debt');
        if(availableAccounts.length < 2) {
            alert('使用固定轉帳需要至少兩個帳戶，請先至「新增」建立兩個以上的帳戶後再試，謝謝您。');
            return;
        }
        closeCalendarSettingsModal();
        setTimeout(() => {
            const modal = document.getElementById('fixedTransferListModal');
            const modalWrapper = modal.querySelector('.modal-content-wrapper');

            // 渲染固定轉帳列表
            renderFixedTransferList();

            // 更新分頁樣式
            const tabs = modal.querySelectorAll('.journal-form-tab');
            tabs.forEach(t => {
                t.classList.remove('active');
                t.style.background = 'var(--border-color)';
                t.style.color = 'var(--text-secondary)';
                t.style.border = 'none';
            });
            const fixedTab = document.getElementById('journalFormTabFixed'); // 注意：这里的ID需要在HTML中对应修改，或者使用querySelector
            // 實際上 fixedTransferListModal 內的 ID 會重複，這裡需要使用 querySelector
            // 更好的做法是给 fixedTransferListModal 內的 tab 唯一的 ID 或者使用 class 選擇器
            const modalTabs = modal.querySelectorAll('.journal-form-tab');
            modalTabs.forEach(t => {
                if(t.textContent.trim() === '固定轉帳') {
                    t.classList.add('active');
                    t.style.background = 'var(--card-bg)';
                    t.style.color = '#ffd60a';
                    t.style.border = '2px solid #ffd60a';
                }
            });

            if(modalWrapper) {
                modalWrapper.style.transform = 'translateY(100%)';
            }
            modal.style.display = 'block';
            modal.style.background = 'rgba(0,0,0,0.5)';
            requestAnimationFrame(() => {
                setTimeout(() => {
                    if(modalWrapper) {
                        modalWrapper.style.transform = 'translateY(0)';
                    }
                }, 10);
            });
        }, 300);
    }

    function closeFixedTransferListModal() {
        const modal = document.getElementById('fixedTransferListModal');
        const modalWrapper = modal.querySelector('.modal-content-wrapper');
        if(modalWrapper) {
            modalWrapper.style.transform = 'translateY(100%)';
            setTimeout(() => {
                modal.style.display = 'none';
                modalWrapper.style.transform = 'translateY(100%)';
            }, 300);
        } else {
            modal.style.display = 'none';
        }
    }

// ── Fixed Transfer modal ──────────────────────────────────────────────────────

    // 新增固定轉帳（從列表頁面的+按鈕）
    function addNewFixedTransfer() {
        // 直接打開固定轉帳表單，不關閉列表（讓表單覆蓋在列表上）
        const listModal = document.getElementById('fixedTransferListModal');
        if(listModal && listModal.style.display === 'block') {
            listModal.setAttribute('data-was-open', 'true');
        }
        // 立即打開固定轉帳表單，不延遲
        openFixedTransferModal();
    }

    // Fixed Transfer Functions
    function openFixedTransferModal(transferId = null) {
        const modal = document.getElementById('fixedTransferModal');
        const modalWrapper = modal.querySelector('.modal-content-wrapper');

        editingFixedTransferId = transferId;

        // 初始化數據
        fixedTransferData = {
            repeat: 'monthly',
            byPeriod: false,
            startDate: null,
            endDate: null,
            holidayAdjust: 'none',
            tagColor: null,
            useAccountBalance: false,
            useFromAccount: true
        };

        // 重置表單
        const useAccountBalanceCheckbox = document.getElementById('fixedTransferUseAccountBalance');
        if(useAccountBalanceCheckbox) {
            useAccountBalanceCheckbox.checked = false;
        }
        updateFixedTransferAmountMode();

        // 如果是編輯模式，載入現有數據
        if(transferId) {
            const transfers = loadFixedTransfers();
            const transfer = transfers.find(t => t.id === transferId);
            if(transfer) {
                // 載入現有數據
                document.getElementById('fixedTransferTitle').value = transfer.title;
                document.getElementById('fixedTransferAmount').value = transfer.amount;

                // 載入帳戶信息
                const fromAccount = accounts.find(acc => acc.id === transfer.fromAccountId);
                const toAccount = accounts.find(acc => acc.id === transfer.toAccountId);
                if(fromAccount) {
                    document.getElementById('fixedTransferFromAccount').textContent = fromAccount.name;
                    document.getElementById('fixedTransferFromAccount').style.color = 'var(--text-primary)';
                    window.fixedTransferFromAccountId = transfer.fromAccountId;
                }
                if(toAccount) {
                    document.getElementById('fixedTransferToAccount').textContent = toAccount.name;
                    document.getElementById('fixedTransferToAccount').style.color = 'var(--text-primary)';
                    window.fixedTransferToAccountId = transfer.toAccountId;
                }

                // 載入重複設定
                fixedTransferData.repeat = transfer.repeat;
                const repeatNames = {
                    'daily': '每日',
                    'weekly': '每星期',
                    'monthly': '每月',
                    'yearly': '每年'
                };
                document.getElementById('fixedTransferRepeat').textContent = repeatNames[transfer.repeat] || '每月';

                // 載入按期數設定
                fixedTransferData.byPeriod = transfer.byPeriod || false;
                document.getElementById('fixedTransferByPeriod').checked = fixedTransferData.byPeriod;

                // 載入使用帳戶全部金額設定
                fixedTransferData.useAccountBalance = transfer.useAccountBalance || false;
                fixedTransferData.useFromAccount = transfer.useFromAccount !== undefined ? transfer.useFromAccount : true;
                const useAccountBalanceCheckbox = document.getElementById('fixedTransferUseAccountBalance');
                if(useAccountBalanceCheckbox) {
                    useAccountBalanceCheckbox.checked = fixedTransferData.useAccountBalance;
                }
                updateFixedTransferAmountMode();

                // 載入日期
                fixedTransferData.startDate = new Date(transfer.startDate);
                fixedTransferData.endDate = transfer.endDate ? new Date(transfer.endDate) : null;

                const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
                const startDateStr = `${fixedTransferData.startDate.getFullYear()}年${fixedTransferData.startDate.getMonth() + 1}月${fixedTransferData.startDate.getDate()}日 ${weekdays[fixedTransferData.startDate.getDay()]}`;
                document.getElementById('fixedTransferStartDate').textContent = startDateStr;
                document.getElementById('fixedTransferStartDate').style.color = 'var(--text-primary)';

                if(fixedTransferData.endDate) {
                    const endDateStr = `${fixedTransferData.endDate.getFullYear()}年${fixedTransferData.endDate.getMonth() + 1}月${fixedTransferData.endDate.getDate()}日 ${weekdays[fixedTransferData.endDate.getDay()]}`;
                    document.getElementById('fixedTransferEndDate').textContent = endDateStr;
                } else {
                    document.getElementById('fixedTransferEndDate').textContent = '永不結束';
                }
                document.getElementById('fixedTransferEndDate').style.color = 'var(--text-primary)';

                // 載入假日調整
                fixedTransferData.holidayAdjust = transfer.holidayAdjust || 'none';
                const adjustNames = {
                    'none': '不調整',
                    'advance': '提前',
                    'delay': '延後'
                };
                document.getElementById('fixedTransferHolidayAdjust').textContent = adjustNames[fixedTransferData.holidayAdjust] || '不調整';

                // 載入標籤顏色
                fixedTransferData.tagColor = transfer.tagColor;
                if(transfer.tagColor) {
                    document.getElementById('fixedTransferTagColor').textContent = '已選擇';
                    document.getElementById('fixedTransferTagColor').style.color = transfer.tagColor;
                    document.getElementById('fixedTransferTagIcon').style.color = transfer.tagColor;
                }


                updatePeriodCount();
            }
        } else {
            // 新增模式：設置默認開始日期為今天
            const today = new Date();
            fixedTransferData.startDate = today;
            const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
            const startDateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日 ${weekdays[today.getDay()]}`;
            const startDateElement = document.getElementById('fixedTransferStartDate');
            if(startDateElement) {
                startDateElement.textContent = startDateStr;
                startDateElement.style.color = 'var(--text-primary)';
            }

            // 重置其他欄位
            document.getElementById('fixedTransferTitle').value = '';
            document.getElementById('fixedTransferAmount').value = '';
            document.getElementById('fixedTransferFromAccount').textContent = '從帳戶';
            document.getElementById('fixedTransferFromAccount').style.color = 'var(--text-secondary)';
            document.getElementById('fixedTransferToAccount').textContent = '到帳戶';
            document.getElementById('fixedTransferToAccount').style.color = 'var(--text-secondary)';
            document.getElementById('fixedTransferRepeat').textContent = '每月';
            document.getElementById('fixedTransferByPeriod').checked = false;
            document.getElementById('fixedTransferEndDate').textContent = '永不結束';
            document.getElementById('fixedTransferEndDate').style.color = 'var(--text-primary)';
            document.getElementById('fixedTransferHolidayAdjust').textContent = '不調整';
            document.getElementById('fixedTransferPeriodCount').textContent = '';
            document.getElementById('fixedTransferTagColor').textContent = '選擇顏色';
            document.getElementById('fixedTransferTagColor').style.color = 'var(--text-secondary)';
            document.getElementById('fixedTransferTagIcon').style.color = 'var(--text-secondary)';
            fixedTransferData.tagColor = null;
            window.fixedTransferFromAccountId = null;
            window.fixedTransferToAccountId = null;

        }

        updateNextDates();

        // 更新分頁樣式
        const tabs = modal.querySelectorAll('.journal-form-tab');
        tabs.forEach(t => {
            t.classList.remove('active');
            t.style.background = 'var(--border-color)';
            t.style.color = 'var(--text-secondary)';
            t.style.border = 'none';
        });
        const fixedTab = document.getElementById('journalFormTabFixed');
        if(fixedTab) {
            fixedTab.classList.add('active');
            fixedTab.style.background = 'var(--card-bg)';
            fixedTab.style.color = 'var(--text-primary)';
            fixedTab.style.border = '2px solid var(--text-primary)';
        }

        if(modalWrapper) {
            modalWrapper.style.transform = 'translateX(100%)';
            modalWrapper.classList.remove('swiping');
        }
        modal.style.display = 'block';
        modal.style.background = 'transparent';
        modal.style.zIndex = '2010'; // 確保表單顯示在列表之上
        requestAnimationFrame(() => {
            setTimeout(() => {
                if(modalWrapper) {
                    modalWrapper.style.transform = 'translateX(0)';
                }
            }, 10);
        });
    }

    // 編輯固定轉帳
    function editFixedTransfer(id) {
        const listModal = document.getElementById('fixedTransferListModal');
        if(listModal && listModal.style.display === 'block') {
            listModal.setAttribute('data-was-open', 'true');
        }
        closeFixedTransferListModal();
        setTimeout(() => {
            openFixedTransferModal(id);
        }, 300);
    }

    // 顯示固定轉帳詳細資料（只讀模式）
    function showFixedTransferDetail(transferId) {
        const modal = document.getElementById('fixedTransferModal');
        const modalWrapper = modal.querySelector('.modal-content-wrapper');

        const transfers = loadFixedTransfers();
        const transfer = transfers.find(t => t.id === transferId);
        if(!transfer) return;

        // 設置為只讀模式
        const saveBtn = modal.querySelector('.modal-header .btn-icon[onclick="saveFixedTransfer()"]');
        if(saveBtn) {
            saveBtn.style.display = 'none';
        }

        // 禁用所有輸入欄位
        const titleInput = document.getElementById('fixedTransferTitle');
        const amountInput = document.getElementById('fixedTransferAmount');
        const useAccountBalanceCheckbox = document.getElementById('fixedTransferUseAccountBalance');
        const byPeriodCheckbox = document.getElementById('fixedTransferByPeriod');

        if(titleInput) {
            titleInput.disabled = true;
            titleInput.value = transfer.title;
        }
        if(amountInput) {
            amountInput.disabled = true;
            amountInput.value = transfer.amount;
        }
        if(useAccountBalanceCheckbox) {
            useAccountBalanceCheckbox.disabled = true;
            useAccountBalanceCheckbox.checked = transfer.useAccountBalance || false;
            updateFixedTransferAmountMode();
        }
        if(byPeriodCheckbox) {
            byPeriodCheckbox.disabled = true;
            byPeriodCheckbox.checked = transfer.byPeriod || false;
        }

        // 禁用所有可點擊的欄位
        const clickableRows = modal.querySelectorAll('.form-row[style*="cursor: pointer"]');
        clickableRows.forEach(row => {
            row.style.pointerEvents = 'none';
            row.style.opacity = '0.7';
        });

        // 載入帳戶信息
        const fromAccount = accounts.find(acc => acc.id === transfer.fromAccountId);
        const toAccount = accounts.find(acc => acc.id === transfer.toAccountId);
        if(fromAccount) {
            document.getElementById('fixedTransferFromAccount').textContent = fromAccount.name;
            document.getElementById('fixedTransferFromAccount').style.color = 'var(--text-primary)';
        }
        if(toAccount) {
            document.getElementById('fixedTransferToAccount').textContent = toAccount.name;
            document.getElementById('fixedTransferToAccount').style.color = 'var(--text-primary)';
        }

        // 載入重複設定
        const repeatNames = {
            'daily': '每天',
            'weekly': '每週',
            'monthly': '每月',
            'yearly': '每年'
        };
        document.getElementById('fixedTransferRepeat').textContent = repeatNames[transfer.repeat] || '每月';

        // 載入日期設定
        if(transfer.startDate) {
            const startDate = new Date(transfer.startDate);
            const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
            const startDateStr = `${startDate.getFullYear()}年${startDate.getMonth() + 1}月${startDate.getDate()}日 ${weekdays[startDate.getDay()]}`;
            document.getElementById('fixedTransferStartDate').textContent = startDateStr;
            document.getElementById('fixedTransferStartDate').style.color = 'var(--text-primary)';
        }

        if(transfer.endDate) {
            const endDate = new Date(transfer.endDate);
            const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
            const endDateStr = `${endDate.getFullYear()}年${endDate.getMonth() + 1}月${endDate.getDate()}日 ${weekdays[endDate.getDay()]}`;
            document.getElementById('fixedTransferEndDate').textContent = endDateStr;
            document.getElementById('fixedTransferEndDate').style.color = 'var(--text-primary)';
        } else {
            document.getElementById('fixedTransferEndDate').textContent = '永不結束';
            document.getElementById('fixedTransferEndDate').style.color = 'var(--text-primary)';
        }

        // 載入假日調整
        const holidayAdjustNames = {
            'none': '不調整',
            'before': '提前到前一個工作日',
            'after': '延後到下一個工作日'
        };
        document.getElementById('fixedTransferHolidayAdjust').textContent = holidayAdjustNames[transfer.holidayAdjust] || '不調整';

        // 載入標籤顏色
        if(transfer.tagColor) {
            document.getElementById('fixedTransferTagIcon').style.color = transfer.tagColor;
            document.getElementById('fixedTransferTagColor').textContent = '已選擇';
            document.getElementById('fixedTransferTagColor').style.color = transfer.tagColor;
        }

        // 更新週期入帳日程
        updateNextDatesForTransfer(transfer);

        // 顯示模態框
        if(modalWrapper) {
            modalWrapper.style.transform = 'translateX(100%)';
            modalWrapper.classList.remove('swiping');
        }
        modal.style.display = 'block';
        modal.style.background = 'transparent';
        requestAnimationFrame(() => {
            setTimeout(() => {
                if(modalWrapper) {
                    modalWrapper.style.transform = 'translateX(0)';
                }
            }, 10);
        });
    }

    // 更新週期入帳日程（用於只讀模式）
    function updateNextDatesForTransfer(transfer) {
        if(!transfer.startDate) return;

        const startDate = new Date(transfer.startDate);
        const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

        // 計算下回日期
        let nextDate = new Date(startDate);
        if(transfer.repeat === 'daily') {
            nextDate.setDate(nextDate.getDate() + 1);
        } else if(transfer.repeat === 'weekly') {
            nextDate.setDate(nextDate.getDate() + 7);
        } else if(transfer.repeat === 'monthly') {
            nextDate.setMonth(nextDate.getMonth() + 1);
        } else if(transfer.repeat === 'yearly') {
            nextDate.setFullYear(nextDate.getFullYear() + 1);
        }

        const nextDateStr = `${nextDate.getFullYear()}年${nextDate.getMonth() + 1}月${nextDate.getDate()}日 ${weekdays[nextDate.getDay()]}`;
        document.getElementById('fixedTransferNextDate').textContent = `:${nextDateStr}`;

        // 計算下下回日期
        let nextNextDate = new Date(nextDate);
        if(transfer.repeat === 'daily') {
            nextNextDate.setDate(nextNextDate.getDate() + 1);
        } else if(transfer.repeat === 'weekly') {
            nextNextDate.setDate(nextNextDate.getDate() + 7);
        } else if(transfer.repeat === 'monthly') {
            nextNextDate.setMonth(nextNextDate.getMonth() + 1);
        } else if(transfer.repeat === 'yearly') {
            nextNextDate.setFullYear(nextNextDate.getFullYear() + 1);
        }

        const nextNextDateStr = `${nextNextDate.getFullYear()}年${nextNextDate.getMonth() + 1}月${nextNextDate.getDate()}日 ${weekdays[nextNextDate.getDay()]}`;
        document.getElementById('fixedTransferNextNextDate').textContent = `:${nextNextDateStr}`;
    }

    function closeFixedTransferModal() {
        // 恢復所有欄位為可編輯狀態
        const titleInput = document.getElementById('fixedTransferTitle');
        const amountInput = document.getElementById('fixedTransferAmount');
        const useAccountBalanceCheckbox = document.getElementById('fixedTransferUseAccountBalance');
        const byPeriodCheckbox = document.getElementById('fixedTransferByPeriod');

        if(titleInput) titleInput.disabled = false;
        if(amountInput) amountInput.disabled = false;
        if(useAccountBalanceCheckbox) useAccountBalanceCheckbox.disabled = false;
        if(byPeriodCheckbox) byPeriodCheckbox.disabled = false;

        // 恢復所有可點擊的欄位
        const fixedTransferModal = document.getElementById('fixedTransferModal');
        const clickableRows = fixedTransferModal.querySelectorAll('.form-row[style*="cursor: pointer"]');
        clickableRows.forEach(row => {
            row.style.pointerEvents = '';
            row.style.opacity = '';
        });

        // 恢復儲存按鈕
        const saveBtn = fixedTransferModal.querySelector('.modal-header .btn-icon[onclick="saveFixedTransfer()"]');
        if(saveBtn) {
            saveBtn.style.display = '';
        }
        const modal = document.getElementById('fixedTransferModal');
        const modalWrapper = modal.querySelector('.modal-content-wrapper');
        if(modalWrapper) {
            modalWrapper.style.transform = 'translateX(100%)';
            setTimeout(() => {
                modal.style.display = 'none';
                modalWrapper.style.transform = 'translateX(100%)';
                editingFixedTransferId = null; // 重置編輯狀態

                // 移除重新打開列表的邏輯，關閉後不再顯示固定轉帳列表
                const listModal = document.getElementById('fixedTransferListModal');
                if(listModal) {
                    listModal.removeAttribute('data-was-open');
                    // 只更新列表數據，不打開列表模態框
                    renderFixedTransferList();
                }
            }, 400);
        } else {
            modal.style.display = 'none';
            editingFixedTransferId = null; // 重置編輯狀態

            // 如果列表模態框之前是打開的，重新打開它
            const listModal = document.getElementById('fixedTransferListModal');
            if(listModal && listModal.getAttribute('data-was-open') === 'true') {
                listModal.removeAttribute('data-was-open');
                openFixedTransferList();
            }
        }
    }

    function saveFixedTransfer() {
        // 驗證必填欄位
        const title = document.getElementById('fixedTransferTitle').value.trim();
        const amount = parseFloat(document.getElementById('fixedTransferAmount').value);
        const fromAccountId = window.fixedTransferFromAccountId;
        const toAccountId = window.fixedTransferToAccountId;

        if(!title) {
            alert('請輸入標題');
            return;
        }

        // 如果使用帳戶全部金額，不需要驗證金額
        if(!fixedTransferData.useAccountBalance) {
            if(!amount || amount <= 0) {
                alert('請輸入有效的金額');
                return;
            }
        }

        if(!fromAccountId || !toAccountId) {
            alert('請選擇從帳戶和到帳戶');
            return;
        }

        if(!fixedTransferData.startDate) {
            alert('請選擇開始日期');
            return;
        }

        if(fixedTransferData.byPeriod && !fixedTransferData.endDate) {
            alert('按期數模式需要選擇結束日期');
            return;
        }

        if(!fixedTransferData.tagColor) {
            alert('請選擇標籤顏色');
            return;
        }

        // 載入現有列表
        const transfers = loadFixedTransfers();

        // 檢查是否涉及信用卡，如果是，記錄信用卡的初始絕對值金額
        const toAccount = accounts.find(acc => acc.id === toAccountId);
        const isCreditCardTransfer = toAccount && toAccount.bankTag === '信用卡';
        let creditCardInitialAmount = null;

        if(isCreditCardTransfer && fixedTransferData.useAccountBalance) {
            // 如果轉入帳戶是信用卡且使用帳戶全部金額，記錄信用卡的初始絕對值金額
            creditCardInitialAmount = Math.abs(toAccount.balance);
        }

        // 創建或更新固定轉帳對象
        let fixedTransfer;
        if(editingFixedTransferId) {
            // 編輯模式：找到現有項目並更新
            const existingIndex = transfers.findIndex(t => t.id === editingFixedTransferId);
            if(existingIndex >= 0) {
                const existing = transfers[existingIndex];
                fixedTransfer = {
                    ...existing, // 保留原有屬性（如執行記錄、initialAmount）
                    title: title,
                    amount: fixedTransferData.useAccountBalance ? 0 : amount, // 如果使用帳戶全部金額，金額設為0（執行時會計算）
                    fromAccountId: fromAccountId,
                    toAccountId: toAccountId,
                    repeat: fixedTransferData.repeat,
                    byPeriod: fixedTransferData.byPeriod,
                    startDate: fixedTransferData.startDate.toISOString(),
                    endDate: fixedTransferData.endDate ? fixedTransferData.endDate.toISOString() : null,
                    holidayAdjust: fixedTransferData.holidayAdjust,
                    tagColor: fixedTransferData.tagColor,
                    useAccountBalance: fixedTransferData.useAccountBalance,
                    useFromAccount: fixedTransferData.useFromAccount
                };
                // 如果涉及信用卡且使用帳戶全部金額，記錄信用卡的初始絕對值金額
                if(isCreditCardTransfer && fixedTransferData.useAccountBalance && creditCardInitialAmount !== null) {
                    // 如果是新增模式或編輯模式但還沒有記錄過，記錄初始金額
                    if(!fixedTransfer.creditCardInitialAmount) {
                        fixedTransfer.creditCardInitialAmount = creditCardInitialAmount;
                    }
                }
                transfers[existingIndex] = fixedTransfer;
            } else {
                alert('找不到要編輯的固定轉帳');
                return;
            }
        } else {
            // 新增模式：檢查是否已存在相同標題的固定轉帳
            const existing = transfers.find(t => t.title === title);
            if(existing) {
                // 如果已存在，切換到編輯模式
                if(confirm(`已存在標題為「${title}」的固定轉帳，是否要編輯它？`)) {
                    editingFixedTransferId = existing.id;
                    closeFixedTransferModal();
                    setTimeout(() => {
                        openFixedTransferModal(existing.id);
                    }, 300);
                    return;
                } else {
                    return;
                }
            }

            // 創建新的固定轉帳
            fixedTransfer = {
                id: Date.now().toString(),
                title: title,
                amount: fixedTransferData.useAccountBalance ? 0 : amount, // 如果使用帳戶全部金額，金額設為0（執行時會計算）
                useAccountBalance: fixedTransferData.useAccountBalance,
                useFromAccount: fixedTransferData.useFromAccount,
                fromAccountId: fromAccountId,
                toAccountId: toAccountId,
                repeat: fixedTransferData.repeat,
                byPeriod: fixedTransferData.byPeriod,
                startDate: fixedTransferData.startDate.toISOString(),
                endDate: fixedTransferData.endDate ? fixedTransferData.endDate.toISOString() : null,
                holidayAdjust: fixedTransferData.holidayAdjust,
                tagColor: fixedTransferData.tagColor,
                creditCardInitialAmount: creditCardInitialAmount, // 如果涉及信用卡，記錄初始絕對值金額
                createdAt: new Date().toISOString(),
                lastExecutedDate: null,
                executedDates: []
            };
            transfers.push(fixedTransfer);
        }

        saveFixedTransfers(transfers);

        // 重新渲染列表和日曆
        renderFixedTransferList();
        renderCalendar();

        // 更新資產列表
        renderAssets();

        // 更新日期支出資訊（如果當前有選中日期）
        if(selectedDate) {
            showFixedTransferDetailsForDate(selectedDate);
        }

        editingFixedTransferId = null;
        closeFixedTransferModal();

        // 如果列表模態框是打開的，重新渲染列表
        const listModal = document.getElementById('fixedTransferListModal');
        if(listModal && listModal.style.display === 'block') {
            renderFixedTransferList();
        }
    }

    // 從測試項目轉換為固定轉帳（如果已存在就編輯，不存在就新增）
    function convertToFixedTransfer(title, amount, fromAccountId, toAccountId) {
        const transfers = loadFixedTransfers();
        const existing = transfers.find(t => t.title === title);

        if(existing) {
            // 如果已存在，打開編輯模式
            editFixedTransfer(existing.id);
        } else {
            // 如果不存在，打開新增模式並預填資料
            openFixedTransferModal();

            // 預填資料
            setTimeout(() => {
                document.getElementById('fixedTransferTitle').value = title;
                document.getElementById('fixedTransferAmount').value = amount;

                const fromAccount = accounts.find(acc => acc.id === fromAccountId);
                const toAccount = accounts.find(acc => acc.id === toAccountId);

                if(fromAccount) {
                    document.getElementById('fixedTransferFromAccount').textContent = fromAccount.name;
                    document.getElementById('fixedTransferFromAccount').style.color = 'var(--text-primary)';
                    window.fixedTransferFromAccountId = fromAccountId;
                }

                if(toAccount) {
                    document.getElementById('fixedTransferToAccount').textContent = toAccount.name;
                    document.getElementById('fixedTransferToAccount').style.color = 'var(--text-primary)';
                    window.fixedTransferToAccountId = toAccountId;
                }
            }, 100);
        }
    }

// ── Amount-mode / period-count helpers ───────────────────────────────────────

    function openRepeatSelectorForFixed() { openRepeatSelector(); }

    function updateFixedTransferAmountMode() {
        const useAccountBalanceCheckbox = document.getElementById('fixedTransferUseAccountBalance');
        const accountBalanceSourceRow = document.getElementById('fixedTransferAccountBalanceSourceRow');
        const amountRow = document.getElementById('fixedTransferAmountRow');
        const amountInput = document.getElementById('fixedTransferAmount');
        const labelElement = document.getElementById('fixedTransferUseAccountBalanceLabel');

        if(!useAccountBalanceCheckbox) return;

        fixedTransferData.useAccountBalance = useAccountBalanceCheckbox.checked;

        if(useAccountBalanceCheckbox.checked) {
            // 啟用使用帳戶全部金額
            if(accountBalanceSourceRow) accountBalanceSourceRow.style.display = 'flex';
            if(amountRow) amountRow.style.display = 'none';
            if(labelElement) labelElement.textContent = '開啟';
            updateFixedTransferAccountBalanceSourceDisplay();
        } else {
            // 關閉使用帳戶全部金額
            if(accountBalanceSourceRow) accountBalanceSourceRow.style.display = 'none';
            if(amountRow) amountRow.style.display = 'flex';
            if(labelElement) labelElement.textContent = '關閉';
        }
    }

    function toggleFixedTransferAccountBalanceSource() {
        fixedTransferData.useFromAccount = !fixedTransferData.useFromAccount;
        updateFixedTransferAccountBalanceSourceDisplay();
    }

    function updateFixedTransferAccountBalanceSourceDisplay() {
        const sourceElement = document.getElementById('fixedTransferAccountBalanceSource');
        if(sourceElement) {
            sourceElement.textContent = fixedTransferData.useFromAccount ? '匯出方（從帳戶）' : '匯入方（到帳戶）';
            sourceElement.style.color = 'var(--text-primary)';
        }
    }

    function updateFixedExpenseAmountMode() {
        const cb = document.getElementById('fixedExpenseUseAccountBalance');
        const row = document.getElementById('fixedExpenseAmountRow');
        const label = document.getElementById('fixedExpenseUseAccountBalanceLabel');
        if(!cb) return;
        fixedExpenseData.useAccountBalance = cb.checked;
        if(row) row.style.display = cb.checked ? 'none' : 'flex';
        if(label) label.textContent = cb.checked ? '開啟' : '關閉';
    }

    function updateFixedIncomeAmountMode() {
        const cb = document.getElementById('fixedIncomeUseAccountBalance');
        const row = document.getElementById('fixedIncomeAmountRow');
        const label = document.getElementById('fixedIncomeUseAccountBalanceLabel');
        if(!cb) return;
        fixedIncomeData.useAccountBalance = cb.checked;
        if(row) row.style.display = cb.checked ? 'none' : 'flex';
        if(label) label.textContent = cb.checked ? '開啟' : '關閉';
    }

    function updateFixedExpensePeriodCount() {
        const cb = document.getElementById('fixedExpenseByPeriod');
        const el = document.getElementById('fixedExpensePeriodCount');
        if(!cb || !el) return;
        fixedExpenseData.byPeriod = cb.checked;
        if(!cb.checked || !fixedExpenseData.startDate || !fixedExpenseData.endDate) { el.textContent = ''; return; }
        const startDate = new Date(fixedExpenseData.startDate);
        const endDate = new Date(fixedExpenseData.endDate);
        let count = 0, d = new Date(startDate);
        while(d <= endDate) {
            count++;
            switch(fixedExpenseData.repeat) {
                case 'daily': d.setDate(d.getDate() + 1); break;
                case 'weekly': d.setDate(d.getDate() + 7); break;
                case 'monthly': d.setMonth(d.getMonth() + 1); break;
                case 'yearly': d.setFullYear(d.getFullYear() + 1); break;
            }
        }
        el.textContent = count + '期';
    }

    function updateFixedIncomePeriodCount() {
        const cb = document.getElementById('fixedIncomeByPeriod');
        const el = document.getElementById('fixedIncomePeriodCount');
        if(!cb || !el) return;
        fixedIncomeData.byPeriod = cb.checked;
        if(!cb.checked || !fixedIncomeData.startDate || !fixedIncomeData.endDate) { el.textContent = ''; return; }
        const startDate = new Date(fixedIncomeData.startDate);
        const endDate = new Date(fixedIncomeData.endDate);
        let count = 0, d = new Date(startDate);
        while(d <= endDate) {
            count++;
            switch(fixedIncomeData.repeat) {
                case 'daily': d.setDate(d.getDate() + 1); break;
                case 'weekly': d.setDate(d.getDate() + 7); break;
                case 'monthly': d.setMonth(d.getMonth() + 1); break;
                case 'yearly': d.setFullYear(d.getFullYear() + 1); break;
            }
        }
        el.textContent = count + '期';
    }

    function updateNextDatesForFixed() {
        const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
        if(currentFixedFormContext === 'expense' && fixedExpenseData.startDate && fixedExpenseData.repeat) {
            const startDate = new Date(fixedExpenseData.startDate);
            const nextDate = new Date(startDate);
            switch(fixedExpenseData.repeat) {
                case 'daily': nextDate.setDate(nextDate.getDate() + 1); break;
                case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
                case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
                case 'yearly': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
            }
            const nextNext = new Date(nextDate);
            switch(fixedExpenseData.repeat) {
                case 'daily': nextNext.setDate(nextNext.getDate() + 1); break;
                case 'weekly': nextNext.setDate(nextNext.getDate() + 7); break;
                case 'monthly': nextNext.setMonth(nextNext.getMonth() + 1); break;
                case 'yearly': nextNext.setFullYear(nextNext.getFullYear() + 1); break;
            }
            const el1 = document.getElementById('fixedExpenseNextDate');
            const el2 = document.getElementById('fixedExpenseNextNextDate');
            if(el1) el1.textContent = ':' + nextDate.getFullYear() + '年' + (nextDate.getMonth() + 1) + '月' + nextDate.getDate() + '日 ' + weekdays[nextDate.getDay()];
            if(el2) el2.textContent = ':' + nextNext.getFullYear() + '年' + (nextNext.getMonth() + 1) + '月' + nextNext.getDate() + '日 ' + weekdays[nextNext.getDay()];
        } else if(currentFixedFormContext === 'income' && fixedIncomeData.startDate && fixedIncomeData.repeat) {
            const startDate = new Date(fixedIncomeData.startDate);
            const nextDate = new Date(startDate);
            switch(fixedIncomeData.repeat) {
                case 'daily': nextDate.setDate(nextDate.getDate() + 1); break;
                case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
                case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
                case 'yearly': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
            }
            const nextNext = new Date(nextDate);
            switch(fixedIncomeData.repeat) {
                case 'daily': nextNext.setDate(nextNext.getDate() + 1); break;
                case 'weekly': nextNext.setDate(nextNext.getDate() + 7); break;
                case 'monthly': nextNext.setMonth(nextNext.getMonth() + 1); break;
                case 'yearly': nextNext.setFullYear(nextNext.getFullYear() + 1); break;
            }
            const el1 = document.getElementById('fixedIncomeNextDate');
            const el2 = document.getElementById('fixedIncomeNextNextDate');
            if(el1) el1.textContent = ':' + nextDate.getFullYear() + '年' + (nextDate.getMonth() + 1) + '月' + nextDate.getDate() + '日 ' + weekdays[nextDate.getDay()];
            if(el2) el2.textContent = ':' + nextNext.getFullYear() + '年' + (nextNext.getMonth() + 1) + '月' + nextNext.getDate() + '日 ' + weekdays[nextNext.getDay()];
        }
    }

    function updatePeriodCount() {
        const byPeriodCheckbox = document.getElementById('fixedTransferByPeriod');
        const periodCountElement = document.getElementById('fixedTransferPeriodCount');

        if(!byPeriodCheckbox || !periodCountElement) return;

        fixedTransferData.byPeriod = byPeriodCheckbox.checked;

        if(!byPeriodCheckbox.checked) {
            periodCountElement.textContent = '';
            return;
        }

        if(!fixedTransferData.startDate || !fixedTransferData.endDate) {
            periodCountElement.textContent = '';
            return;
        }

        // 計算期數
        const startDate = new Date(fixedTransferData.startDate);
        const endDate = new Date(fixedTransferData.endDate);
        let count = 0;
        const currentDate = new Date(startDate);

        while(currentDate <= endDate) {
            count++;
            switch(fixedTransferData.repeat) {
                case 'daily':
                    currentDate.setDate(currentDate.getDate() + 1);
                    break;
                case 'weekly':
                    currentDate.setDate(currentDate.getDate() + 7);
                    break;
                case 'monthly':
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    break;
                case 'yearly':
                    currentDate.setFullYear(currentDate.getFullYear() + 1);
                    break;
            }
        }

        periodCountElement.textContent = count + '期';
    }

    function updateNextDates() {
        if(!fixedTransferData.startDate || !fixedTransferData.repeat) return;

        const startDate = new Date(fixedTransferData.startDate);
        const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

        // 計算下回日期
        const nextDate = new Date(startDate);
        switch(fixedTransferData.repeat) {
            case 'daily':
                nextDate.setDate(nextDate.getDate() + 1);
                break;
            case 'weekly':
                nextDate.setDate(nextDate.getDate() + 7);
                break;
            case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
            case 'yearly':
                nextDate.setFullYear(nextDate.getFullYear() + 1);
                break;
        }

        // 計算下下回日期
        const nextNextDate = new Date(nextDate);
        switch(fixedTransferData.repeat) {
            case 'daily':
                nextNextDate.setDate(nextNextDate.getDate() + 1);
                break;
            case 'weekly':
                nextNextDate.setDate(nextNextDate.getDate() + 7);
                break;
            case 'monthly':
                nextNextDate.setMonth(nextNextDate.getMonth() + 1);
                break;
            case 'yearly':
                nextNextDate.setFullYear(nextNextDate.getFullYear() + 1);
                break;
        }

        const nextDateElement = document.getElementById('fixedTransferNextDate');
        const nextNextDateElement = document.getElementById('fixedTransferNextNextDate');

        if(nextDateElement) {
            const nextWeekday = weekdays[nextDate.getDay()];
            nextDateElement.textContent = `:${nextDate.getFullYear()}年${nextDate.getMonth() + 1}月${nextDate.getDate()}日 ${nextWeekday}`;
        }

        if(nextNextDateElement) {
            const nextNextWeekday = weekdays[nextNextDate.getDay()];
            nextNextDateElement.textContent = `:${nextNextDate.getFullYear()}年${nextNextDate.getMonth() + 1}月${nextNextDate.getDate()}日 ${nextNextWeekday}`;
        }
    }

// ── Auto-execution ────────────────────────────────────────────────────────────

    function checkAndExecuteFixedTransfers() {
        const transfers = loadFixedTransfers();
        if(transfers.length === 0) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        let hasChanges = false;

        transfers.forEach(transfer => {
            // 確保有執行記錄欄位（向後兼容）
            if(!transfer.executedDates) {
                transfer.executedDates = [];
            }
            if(!transfer.lastExecutedDate) {
                transfer.lastExecutedDate = null;
            }

            // 檢查今天是否已經執行過
            if(transfer.executedDates.includes(todayStr)) {
                return; // 今天已經執行過，跳過
            }

            // 檢查日期範圍
            const startDate = new Date(transfer.startDate);
            startDate.setHours(0, 0, 0, 0);
            const endDate = transfer.endDate ? new Date(transfer.endDate) : null;
            if(endDate) endDate.setHours(0, 0, 0, 0);

            if(today < startDate) return; // 還沒到開始日期
            if(endDate && today > endDate) return; // 已經過了結束日期

            // 檢查是否符合重複規則
            let shouldExecute = false;
            const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

            switch(transfer.repeat) {
                case 'daily':
                    shouldExecute = true;
                    break;
                case 'weekly':
                    shouldExecute = (daysDiff % 7 === 0);
                    break;
                case 'monthly':
                    shouldExecute = (today.getDate() === startDate.getDate());
                    break;
                case 'yearly':
                    shouldExecute = (today.getMonth() === startDate.getMonth() && today.getDate() === startDate.getDate());
                    break;
            }

            // 處理假日調整
            if(shouldExecute && transfer.holidayAdjust !== 'none') {
                const dayOfWeek = today.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                if(isWeekend) {
                    if(transfer.holidayAdjust === 'advance') {
                        // 提前到上一個工作日
                        const prevWorkday = new Date(today);
                        while(prevWorkday.getDay() === 0 || prevWorkday.getDay() === 6) {
                            prevWorkday.setDate(prevWorkday.getDate() - 1);
                        }
                        const prevWorkdayStr = prevWorkday.toISOString().split('T')[0];
                        if(!transfer.executedDates.includes(prevWorkdayStr)) {
                            // 如果上一個工作日還沒執行，則今天執行
                            shouldExecute = true;
                        } else {
                            shouldExecute = false;
                        }
                    } else if(transfer.holidayAdjust === 'delay') {
                        // 延後到下一個工作日
                        shouldExecute = false; // 今天不執行，等工作日再執行
                    }
                }
            }

            if(shouldExecute) {
                // 執行轉帳
                const executed = executeFixedTransfer(transfer, today);
                if(executed) {
                    hasChanges = true;
                }
            }
        });

        if(hasChanges) {
            saveFixedTransfers(transfers);
            renderAssets();
            updateChartData();
            // 更新固定轉帳列表顯示
            renderFixedTransferList();
            // 更新日期支出資訊（如果當前有選中日期）
            if(selectedDate) {
                showFixedTransferDetailsForDate(selectedDate);
            }
            // 更新日曆
            renderCalendar();
        }
    }

    // 執行固定轉帳
    function executeFixedTransfer(transfer, executeDate) {
        const fromAccount = accounts.find(acc => acc.id === transfer.fromAccountId);
        const toAccount = accounts.find(acc => acc.id === transfer.toAccountId);

        if(!fromAccount || !toAccount) {
            console.warn('固定轉帳執行失敗：找不到帳戶', transfer);
            return false;
        }

        // 檢查是否涉及信用卡
        const isCreditCardTransfer = toAccount && toAccount.bankTag === '信用卡';

        // 使用固定金額（不再自動計算）
        const transferAmount = transfer.amount || 0;

            if(transferAmount === 0) {
                console.warn(`固定轉帳執行失敗：金額為0`, transfer);
                return false;
            }

            // 檢查餘額是否足夠（只檢查匯出方）
            if(fromAccount.balance < transferAmount) {
                console.warn(`固定轉帳執行失敗：${fromAccount.name} 餘額不足`, transfer);
                return false;
        }

        // 更新帳戶餘額
        fromAccount.balance -= transferAmount;
        toAccount.balance += transferAmount;

        // 記錄執行日期
        const dateStr = executeDate.toISOString().split('T')[0];
        if(!transfer.executedDates.includes(dateStr)) {
            transfer.executedDates.push(dateStr);
        }
        transfer.lastExecutedDate = dateStr;

        // 記錄執行金額（用於後續編輯）
        if(!transfer.executionRecords) {
            transfer.executionRecords = {};
        }
        transfer.executionRecords[dateStr] = transferAmount;

        // 如果使用帳戶全部金額（非信用卡），更新 initialAmount 為執行時使用的金額（用於記錄）
        if(transfer.useAccountBalance && !isCreditCardTransfer) {
            transfer.initialAmount = transferAmount;
        }

        // 保存資料
        saveData();

        // 更新固定轉帳列表顯示（因為金額可能已改變）
        renderFixedTransferList();

        console.log(`固定轉帳已執行：${transfer.title}，金額：${transferAmount}，從 ${fromAccount.name} 轉到 ${toAccount.name}`);
        return true;
    }

    // 執行固定支出：建立支出紀錄並從帳戶扣款
    function executeFixedExpense(item, executeDate) {
        const account = accounts.find(acc => acc.id === item.accountId);
        if(!account) {
            console.warn('固定支出執行失敗：找不到帳戶', item);
            return false;
        }
        let amount = item.useAccountBalance ? (parseFloat(account.balance) || 0) : (parseFloat(item.amount) || 0);
        if(amount <= 0) {
            console.warn('固定支出執行失敗：金額為0', item);
            return false;
        }
        if(!item.useAccountBalance && account.balance < amount) {
            console.warn('固定支出執行失敗：餘額不足', item);
            return false;
        }
        const dateStr = executeDate.toISOString().split('T')[0];
        const records = loadJournalRecords();
        records.push({
            id: Date.now().toString(),
            type: 'expense',
            date: dateStr,
            amount: amount,
            category: '其他支出',
            accountId: item.accountId,
            title: item.title || '固定支出',
            isAdvance: false,
            createdAt: new Date().toISOString()
        });
        saveJournalRecords(records);
        account.balance = (parseFloat(account.balance) || 0) - amount;
        saveData();
        if(!item.executionRecords) item.executionRecords = {};
        item.executionRecords[dateStr] = amount;
        console.log('固定支出已執行：' + item.title + '，金額：' + amount + '，帳戶：' + account.name);
        return true;
    }

    // 執行固定收入：建立收入紀錄並入帳到帳戶
    function executeFixedIncome(item, executeDate) {
        const account = accounts.find(acc => acc.id === item.accountId);
        if(!account) {
            console.warn('固定收入執行失敗：找不到帳戶', item);
            return false;
        }
        let amount = item.useAccountBalance ? (parseFloat(account.balance) || 0) : (parseFloat(item.amount) || 0);
        if(amount <= 0 && !item.useAccountBalance) {
            console.warn('固定收入執行失敗：金額為0', item);
            return false;
        }
        if(item.useAccountBalance) amount = parseFloat(account.balance) || 0;
        if(amount <= 0) return false;
        const dateStr = executeDate.toISOString().split('T')[0];
        const records = loadJournalRecords();
        records.push({
            id: Date.now().toString(),
            type: 'income',
            date: dateStr,
            amount: amount,
            category: '其他收入',
            accountId: item.accountId,
            title: item.title || '固定收入',
            isAdvance: false,
            createdAt: new Date().toISOString()
        });
        saveJournalRecords(records);
        account.balance = (parseFloat(account.balance) || 0) + amount;
        saveData();
        if(!item.executionRecords) item.executionRecords = {};
        item.executionRecords[dateStr] = amount;
        console.log('固定收入已執行：' + item.title + '，金額：' + amount + '，帳戶：' + account.name);
        return true;
    }

    // 檢查並執行固定支出（補執行：從開始日到今日所有到期未執行的日期）
    function checkAndExecuteFixedExpenses() {
        const items = loadFixedExpenses();
        if(items.length === 0) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let hasChanges = false;
        items.forEach(item => {
            const start = new Date(item.startDate);
            start.setHours(0, 0, 0, 0);
            const end = item.endDate ? new Date(item.endDate) : null;
            if(end) end.setHours(0, 0, 0, 0);
            const endDate = !end || end > today ? today : end;
            const d = new Date(start.getTime());
            while(d <= endDate) {
                const dateStr = d.toISOString().split('T')[0];
                if(item.executionRecords && item.executionRecords[dateStr] !== undefined) {
                    d.setDate(d.getDate() + 1);
                    continue;
                }
                const due = getFixedExpensesForDate(d);
                if(due.some(x => x.id === item.id)) {
                    if(executeFixedExpense(item, new Date(d.getTime()))) hasChanges = true;
                }
                d.setDate(d.getDate() + 1);
            }
        });
        if(hasChanges) {
            saveFixedExpenses(items);
            renderAssets();
            updateChartData();
            renderFixedExpenseList();
            if(selectedDate) showFixedTransferDetailsForDate(selectedDate);
            renderCalendar();
        }
    }

    // 檢查並執行固定收入（補執行：從開始日到今日所有到期未執行的日期）
    function checkAndExecuteFixedIncomes() {
        const items = loadFixedIncomes();
        if(items.length === 0) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let hasChanges = false;
        items.forEach(item => {
            const start = new Date(item.startDate);
            start.setHours(0, 0, 0, 0);
            const end = item.endDate ? new Date(item.endDate) : null;
            if(end) end.setHours(0, 0, 0, 0);
            const endDate = !end || end > today ? today : end;
            const d = new Date(start.getTime());
            while(d <= endDate) {
                const dateStr = d.toISOString().split('T')[0];
                if(item.executionRecords && item.executionRecords[dateStr] !== undefined) {
                    d.setDate(d.getDate() + 1);
                    continue;
                }
                const due = getFixedIncomesForDate(d);
                if(due.some(x => x.id === item.id)) {
                    if(executeFixedIncome(item, new Date(d.getTime()))) hasChanges = true;
                }
                d.setDate(d.getDate() + 1);
            }
        });
        if(hasChanges) {
            saveFixedIncomes(items);
            renderAssets();
            updateChartData();
            renderFixedIncomeList();
            if(selectedDate) showFixedTransferDetailsForDate(selectedDate);
            renderCalendar();
        }
    }

// ── Execution-amount update helpers ──────────────────────────────────────────

    // 更新未執行的固定轉帳金額
    function updateFixedTransferAmount(transferId, dateStr) {
        const input = document.getElementById(`fixedTransferAmount_${transferId}_${dateStr}`);
        if(!input) return;

        const newAmount = parseFloat(input.value) || 0;
        if(newAmount < 0) {
            alert('金額不能為負數');
            input.value = 0;
            return;
        }

        const transfers = loadFixedTransfers();
        const transfer = transfers.find(t => t.id === transferId);
        if(!transfer) {
            alert('找不到固定轉帳');
            return;
        }

        // 檢查是否已執行
        const isExecuted = transfer.executedDates && transfer.executedDates.includes(dateStr);
        if(isExecuted) {
            alert('此固定轉帳在該日期已執行，無法修改金額');
            input.value = transfer.executionRecords && transfer.executionRecords[dateStr] !== undefined
                ? transfer.executionRecords[dateStr]
                : transfer.amount;
            return;
        }

        // 更新固定轉帳的金額
        const oldAmount = transfer.amount || 0;
        transfer.amount = newAmount;

        // 保存資料
        saveFixedTransfers(transfers);

        // 更新顯示
        if(selectedDate) {
            showFixedTransferDetailsForDate(selectedDate);
        }

        console.log(`已更新固定轉帳金額：${transfer.title}，舊金額：${oldAmount}，新金額：${newAmount}`);
    }

    // 更新已執行的固定轉帳金額
    function updateFixedTransferExecutionAmount(transferId, dateStr) {
        const input = document.getElementById(`fixedTransferAmount_${transferId}_${dateStr}`);
        if(!input) return;

        const newAmount = parseFloat(input.value) || 0;
        if(newAmount < 0) {
            alert('金額不能為負數');
            input.value = 0;
            return;
        }

        const transfers = loadFixedTransfers();
        const transfer = transfers.find(t => t.id === transferId);
        if(!transfer) {
            alert('找不到固定轉帳');
            return;
        }

        // 檢查是否已執行
        if(!transfer.executedDates || !transfer.executedDates.includes(dateStr)) {
            alert('此固定轉帳在該日期尚未執行');
            return;
        }

        // 獲取舊金額
        const oldAmount = transfer.executionRecords && transfer.executionRecords[dateStr] !== undefined
            ? transfer.executionRecords[dateStr]
            : getFixedTransferDisplayAmount(transfer, new Date(dateStr));

        if(Math.abs(newAmount - oldAmount) < 0.01) {
            // 金額沒有變化，不需要更新
            return;
        }

        // 計算金額差異
        const amountDiff = newAmount - oldAmount;

        // 獲取帳戶
        const fromAccount = accounts.find(acc => acc.id === transfer.fromAccountId);
        const toAccount = accounts.find(acc => acc.id === transfer.toAccountId);

        if(!fromAccount || !toAccount) {
            alert('找不到帳戶');
            return;
        }

        // 更新帳戶餘額
        fromAccount.balance -= amountDiff;
        toAccount.balance += amountDiff;

        // 保存執行記錄的金額
        if(!transfer.executionRecords) {
            transfer.executionRecords = {};
        }
        transfer.executionRecords[dateStr] = newAmount;

        // 保存資料
        saveFixedTransfers(transfers);
        saveData();

        // 更新顯示
        renderAssets();
        updateChartData();
        if(selectedDate) {
            showFixedTransferDetailsForDate(selectedDate);
        }

        console.log(`已更新固定轉帳執行金額：${transfer.title}，日期：${dateStr}，舊金額：${oldAmount}，新金額：${newAmount}`);
    }
