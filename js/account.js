// ====== account.js ======

// Global variables (account management state)
let editingId = null;
let isSorting = false; // 追蹤是否正在拖動排序
let editingFromDetail = false; // 標記是否從詳情頁面進入編輯

// 重新排列 page-item 的 DOM 順序，使其與 pageOrder 一致
function reorderPageItems() {
    const container = document.getElementById('pageContainer');
    if(!container) return -1;

    // 獲取排序後的順序（只包含啟用的分頁）
    const orderedPages = getOrderedPages();

    // 獲取所有 page-item
    const pageItems = Array.from(container.children);

    // 按照 orderedPages 的順序重新排列
    const sortedItems = [];
    orderedPages.forEach(pageIndex => {
        const item = pageItems.find(item => parseInt(item.getAttribute('data-page')) === pageIndex);
        if(item) {
            sortedItems.push(item);
        }
    });

    // 將未啟用的分頁放在最後
    pageItems.forEach(item => {
        const pageIndex = parseInt(item.getAttribute('data-page'));
        if(!orderedPages.includes(pageIndex)) {
            sortedItems.push(item);
        }
    });

    // 重新插入到 DOM 中
    sortedItems.forEach(item => {
        container.appendChild(item);
    });

    // 返回當前分頁在重新排列後的 DOM 索引
    const domIndex = sortedItems.findIndex(item => parseInt(item.getAttribute('data-page')) === currentPage);
    return domIndex >= 0 ? domIndex : -1;
}

// 渲染分頁指示器（只顯示啟用的分頁，按照順序）
function renderPageIndicator() {
    const indicator = document.querySelector('.page-indicator');
    if(!indicator) return;

    indicator.innerHTML = '';

    // 按照排序後的順序顯示
    const orderedPages = getOrderedPages();

    orderedPages.forEach((pageIndex) => {
        const pageName = PAGE_NAMES[pageIndex];
        const shortName = pageIndex === 0 ? '總覽' : (pageIndex === 1 ? '錢包' : (pageIndex === 2 ? '美股' : (pageIndex === 3 ? '台股' : '加密')));
        const tab = document.createElement('button');
        tab.className = `page-tab ${currentPage === pageIndex ? 'active' : ''}`;
        tab.setAttribute('data-page', pageIndex);
        tab.onclick = () => switchToPage(pageIndex);
        tab.textContent = shortName;
        indicator.appendChild(tab);
    });

    // 確保分頁指示器顯示（如果之前被隱藏）
    if(orderedPages.length > 0) {
        indicator.style.display = 'flex';
    }
}

function openModal() {
    if(isEditMode)return;
    editingId=null;
    editingFromDetail = false; // 重置標記
    window.tempTransactions=[];
    renderTransactions([]); // 清空庫存明細顯示
    document.getElementById('modalTitle').innerText='新增';
    document.getElementById('inpName').value='';
    document.getElementById('inpSymbol').value='';
    document.getElementById('inpBalance').value='0'; // 預設金額為0
    document.getElementById('inpCost').value=''; // 清空平均成本
    // 確保名稱欄位可編輯
    const nameInput = document.getElementById('inpName');
    if(nameInput) {
        nameInput.disabled = false;
    }
    if(document.getElementById('inpBankTag')) {
        document.getElementById('inpBankTag').value = '現金'; // 預設為現金
    }
    if(document.getElementById('inpBankName')) {
        document.getElementById('inpBankName').value = '';
    }
    switchTab('basic');
    // 根據當前分頁自動選擇對應的類型
    if(currentPage > 0 && currentPage < PAGE_TYPES.length) {
        const pageType = PAGE_TYPES[currentPage]; // 'bank', 'stock', 'twstock', 'crypto'
        const typeSelect = document.getElementById('inpType');
        if(typeSelect && pageType !== 'overview') {
            typeSelect.value = pageType;
        }
    }
    handleTypeChange();
    if(document.getElementById('inpType').value === 'bank') {
        handleBankTagChange();
    }
    const accountModal = document.getElementById('accountModal');
    const modalWrapper = accountModal.querySelector('.modal-content-wrapper');

    // 先設置初始狀態（在屏幕右側）
    if(modalWrapper) {
        modalWrapper.style.transform = 'translateX(100%)';
        modalWrapper.classList.remove('swiping'); // 確保過渡動畫啟用
    }

    accountModal.style.display='block';
    accountModal.classList.remove('closing');
    // 背景設為透明，避免主畫面變暗
    accountModal.style.background = 'transparent';

    // 使用 requestAnimationFrame 確保瀏覽器已經渲染初始狀態
    requestAnimationFrame(() => {
        setTimeout(() => {
            initEditModalSwipe();
            if(modalWrapper) {
                modalWrapper.style.transform = 'translateX(0)';
            }
        }, 10);
    });
}

function editAccount(id) {
    if(isEditMode)return;
    editingId=id;
    const a=accounts.find(x=>x.id===id);
    document.getElementById('modalTitle').innerText='編輯';
    document.getElementById('inpType').value=a.type;
    document.getElementById('inpName').value=a.name;
    document.getElementById('inpSymbol').value=a.symbol;
    if(a.logo) document.getElementById('inpSymbol').setAttribute('data-logo', a.logo);
    document.getElementById('inpBalance').value=a.balance;
    document.getElementById('inpCost').value=a.cost||'';
    document.getElementById('inpCurrency').value=a.currency;
    if(a.bankTag && document.getElementById('inpBankTag')) {
        document.getElementById('inpBankTag').value = a.bankTag;
    }
    if(a.bankName && document.getElementById('inpBankName')) {
        const bankNameInput = document.getElementById('inpBankName');
        bankNameInput.value = a.bankName;
    }
    window.tempTransactions=a.transactions||[];
    renderTransactions(window.tempTransactions);
    switchTab('basic');
    handleTypeChange();
    if(a.type === 'bank') {
        handleBankTagChange();
    }
    const accountModal = document.getElementById('accountModal');
    const modalWrapper = accountModal.querySelector('.modal-content-wrapper');

    // 先設置初始狀態（在屏幕右側）
    if(modalWrapper) {
        modalWrapper.style.transform = 'translateX(100%)';
        modalWrapper.classList.remove('swiping'); // 確保過渡動畫啟用
    }

    accountModal.style.display='block';
    accountModal.classList.remove('closing');
    // 如果從詳情頁面進入，確保詳情頁面的狀態正確
    if(editingFromDetail) {
        const detailView = document.getElementById('detailView');
        if(detailView) {
            // 確保詳情頁面在編輯模態框下面（z-index 較低）
            detailView.style.zIndex = '2000';
            // 詳情頁面保持在正確位置（已經顯示，不需要動畫）
            detailView.style.transform = 'translateX(0)';
        }
        // 從詳情頁面進入時，背景設為透明，避免詳情頁面變暗
        accountModal.style.background = 'transparent';
    } else {
        // 從主畫面進入時，背景設為透明，避免主畫面變暗
        accountModal.style.background = 'transparent';
    }

    // 使用 requestAnimationFrame 確保瀏覽器已經渲染初始狀態
    requestAnimationFrame(() => {
        setTimeout(() => {
            initEditModalSwipe();
            if(modalWrapper) {
                modalWrapper.style.transform = 'translateX(0)';
            }
        }, 10);
    });
}

function closeModal() {
    const accountModal = document.getElementById('accountModal');
    const modalWrapper = accountModal ? accountModal.querySelector('.modal-content-wrapper') : null;

    // 如果從詳情頁面進入，先確保詳情頁面在編輯模態框之下，這樣才能看到編輯模態框的滑出動畫
    if(editingFromDetail && currentDetailAcc) {
        const detailView = document.getElementById('detailView');
        if(detailView) {
            // 確保詳情頁面在編輯模態框之下（z-index 較低），這樣才能看到編輯模態框的滑出動畫
            detailView.style.zIndex = '2000';
            // 確保詳情頁面已經打開並在正確位置
            if(!detailView.classList.contains('active')) {
                detailView.classList.add('active');
            }
            detailView.style.transform = 'translateX(0)';
        }
        // 立即讓背景變透明（在動畫開始前）
        accountModal.style.background = 'transparent';
        accountModal.classList.add('closing');
    } else {
        // 如果不是從詳情頁面進入，也要立即讓背景變透明，避免主畫面變暗
        accountModal.style.background = 'transparent';
        accountModal.classList.add('closing');
    }

    if(modalWrapper) {
        // 確保過渡動畫啟用
        modalWrapper.classList.remove('swiping');

        // 然後動畫滑出
        modalWrapper.style.transform = 'translateX(100%)';
        setTimeout(() => {
            accountModal.style.display = 'none';
            accountModal.classList.remove('closing');
            accountModal.style.background = ''; // 重置背景，以便下次打開時使用預設背景
            // 重置 transform 以便下次打開時動畫正常
            modalWrapper.style.transform = 'translateX(100%)';

            // 如果從詳情頁面進入，恢復詳情頁面的 z-index
            if(editingFromDetail && currentDetailAcc) {
                const detailView = document.getElementById('detailView');
                if(detailView) {
                    detailView.style.zIndex = '2000';
                }
            }

            // 如果從記帳頁面打開的帳戶選擇器，保存後返回記帳頁面
            if(pendingJournalModalType) {
                const modalType = pendingJournalModalType;
                pendingJournalModalType = null; // 清除標記

                setTimeout(() => {
                    if(modalType === 'income') {
                        openIncomeModal(null, pendingJournalFormData);
                    } else if(modalType === 'expense') {
                        openExpenseModal(null, pendingJournalFormData);
                    } else if(modalType === 'transferFrom' || modalType === 'transferTo') {
                        openTransferModal(null, pendingJournalFormData);
                    } else if(modalType === 'batchExpense' && window.pendingNewAccountForBatch) {
                        // 批量支出且剛新增完帳戶：自動帶入新帳戶並重新顯示 AI 辨識結果
                        const newAcc = window.pendingNewAccountForBatch;
                        window.pendingNewAccountForBatch = null;
                        batchExpenseAccountId = newAcc.id;
                        const label = document.getElementById('batchExpenseAccountLabel');
                        if(label) { label.textContent = newAcc.name || '選擇帳戶'; label.style.color = 'var(--text-primary)'; }
                        const batchModal = document.getElementById('batchExpenseModal');
                        if(batchModal) batchModal.style.display = 'block';
                    } else if(modalType === 'batchIncome' && window.pendingNewAccountForBatch) {
                        // 批量收入且剛新增完帳戶：自動帶入新帳戶並重新顯示 AI 辨識結果
                        const newAcc = window.pendingNewAccountForBatch;
                        window.pendingNewAccountForBatch = null;
                        batchIncomeAccountId = newAcc.id;
                        const label = document.getElementById('batchIncomeAccountLabel');
                        if(label) { label.textContent = newAcc.name || '選擇帳戶'; label.style.color = 'var(--text-primary)'; }
                        const batchModal = document.getElementById('batchIncomeModal');
                        if(batchModal) batchModal.style.display = 'block';
                    } else if(modalType === 'from' || modalType === 'to') {
                        // 固定轉帳的情況，重新打開固定轉帳模態框
                        const fixedTransferModal = document.getElementById('fixedTransferModal');
                        if(fixedTransferModal) {
                            // 重新打開固定轉帳模態框
                            openFixedTransferModal(editingFixedTransferId);
                            // 然後重新打開帳戶選擇器
                            setTimeout(() => {
                                openAccountSelector(modalType);
                            }, 100);
                        }
                    }
                }, 100);
            }
        }, 400);
    } else {
        accountModal.style.display = 'none';
        accountModal.style.background = ''; // 重置背景
    }

    // 如果從詳情頁面進入，關閉編輯頁面後更新詳情頁面數據
    if(editingFromDetail && currentDetailAcc) {
        const detailId = currentDetailAcc.id;
        editingFromDetail = false;
        const detailView = document.getElementById('detailView');

        // 確保詳情頁面在編輯模態框滑出時保持可見
        if(detailView) {
            // 確保詳情頁面已經打開並且在正確位置
            if(!detailView.classList.contains('active')) {
                detailView.classList.add('active');
            }
            // 確保 transform 是正確的（完全顯示）
            detailView.style.transform = 'translateX(0)';
        }

        // 直接更新詳情頁面數據，不調用 openDetailView（避免觸發動畫）
        setTimeout(() => {
            // 重新獲取最新的資產數據
            currentDetailAcc = accounts.find(x => x.id === detailId);
            if(currentDetailAcc) {
                // 更新詳情頁面內容
                let displayName = currentDetailAcc.name;
                if(currentDetailAcc.type === 'stock') {
                    displayName = cleanCompanyName(currentDetailAcc.name);
                } else if(currentDetailAcc.type === 'twstock') {
                    displayName = currentDetailAcc.name;
                }
                document.getElementById('dName').innerText = displayName;
                document.getElementById('dSymbol').innerText = '';
                document.getElementById('dSymbol').style.display = 'none';
                document.getElementById('dQty').innerText = currentDetailAcc.balance;
                let price = currentDetailAcc.currentPrice || 0;
                document.getElementById('dPrice').innerText = `${price.toLocaleString()}`;
                var dPriceLblEl = document.getElementById('dPriceLbl');
                if(dPriceLblEl) dPriceLblEl.textContent = currentDetailAcc.type === 'twstock' ? '現價 (台幣)' : '現價 (USD)';
                let val = calculateValue(currentDetailAcc);
                document.getElementById('dVal').innerText = formatAmount(val);
                let cost = currentDetailAcc.cost || 0;
                let fee = settings.feeRate || 0.1;

                // 更新損益數據
                let dailyPnL = calculateDailyPnL(currentDetailAcc);
                let dailySign = dailyPnL >= 0 ? '+' : '';
                let dailyColor = dailyPnL >= 0 ? 'var(--color-up)' : (dailyPnL < 0 ? 'var(--color-down)' : '#fff');
                document.getElementById('dDailyPnlVal').innerHTML = `<span style="color:${dailyColor}">${dailySign}${formatAmount(dailyPnL)}</span>`;

                let costPnL = calculateCostPnL(currentDetailAcc);
                let costPnlPct = (cost > 0) ? ((price - cost) / cost) * 100 : 0;
                let costSign = costPnL >= 0 ? '+' : '';
                let costColor = '#fff';
                if (cost > 0) {
                    costColor = costPnL >= 0 ? 'var(--color-up)' : 'var(--color-down)';
                }
                if (cost > 0) {
                    document.getElementById('dCostPnl').style.display = 'block';
                    document.getElementById('dCostPnlVal').innerHTML = `<span style="color:${costColor}">${costSign}${formatAmount(costPnL)} (${costPnlPct.toFixed(2)}%)</span>`;
                } else {
                    document.getElementById('dCostPnl').style.display = 'none';
                }

                // 更新交易清單
                const txList = document.getElementById('detailTxList');
                txList.innerHTML = '';
                if (currentDetailAcc.transactions && currentDetailAcc.transactions.length > 0) {
                    currentDetailAcc.transactions.forEach((tx, index) => {
                        let txPnlHtml = '';
                        let txPriceColor = '';
                        if (price > 0 && tx.price > 0) {
                            let txCost = tx.price * (1 + fee/100);
                            let txProfit = (price - txCost) * tx.shares;
                            let txProfitConverted = currentDetailAcc.type === 'twstock' ? (currentDisplayCurrency === 'USD' ? txProfit / settings.usdRate : txProfit) : (currentDisplayCurrency === 'USD' ? txProfit : txProfit * settings.usdRate);
                            let txSign = txProfitConverted >= 0 ? '+' : '';
                            let txColor = txProfitConverted >= 0 ? 'val-green' : 'val-red';
                            let txPct = ((price - txCost) / txCost) * 100;
                            txPnlHtml = `<div class="tx-row"><span class="tx-label">損益</span><span class="tx-val ${txColor}">${txSign}${formatAmount(txProfitConverted)} (${txPct.toFixed(1)}%)</span></div>`;
                            if (price > tx.price) {
                                txPriceColor = 'val-green';
                            } else if (price < tx.price) {
                                txPriceColor = 'val-red';
                            }
                        } else if (cost > 0 && tx.price > 0) {
                            if (cost > tx.price) {
                                txPriceColor = 'val-green';
                            } else if (cost < tx.price) {
                                txPriceColor = 'val-red';
                            }
                        }
                        const priceClass = txPriceColor ? ` ${txPriceColor}` : '';
                        txList.innerHTML += `<div class="tx-item"><div class="tx-header-row"><div><span class="tx-badge">整股</span> <span class="tx-date">${tx.date}</span></div><button class="tx-delete-btn" onclick="deleteStockTransaction(${index})" title="刪除此筆交易"><i class="fas fa-trash"></i></button></div><div class="tx-row"><span class="tx-label">股數</span><span class="tx-val">${tx.shares}</span></div><div class="tx-row"><span class="tx-label">成交價</span><span class="tx-val${priceClass}">$${tx.price.toFixed(2)}</span></div>${txPnlHtml}</div>`;
                    });
                } else {
                    txList.innerHTML = '<div class="tx-no-data">無詳細交易紀錄<br>請在編輯模式匯入截圖</div>';
                }
            }
        }, 450);
    } else {
        editingFromDetail = false;
    }
}

// --- Calculator Functions ---
function updateBrokerOptions() {
    const t = document.getElementById('inpType').value;
    const brokerSelect = document.getElementById('brokerSelect');
    if (!brokerSelect) return;
    brokerSelect.innerHTML = '';
    if (t === 'twstock') {
        brokerSelect.innerHTML = '<option value="cathay">國泰證券 (1.425%)</option><option value="cathay_fixed">國泰證券 (定期定額 固定1元)</option><option value="fubon">富邦證券 (0.25%)</option><option value="custom">自訂...</option>';
    } else if (t === 'stock') {
        brokerSelect.innerHTML = '<option value="cathay">國泰證券 (0.1%)</option><option value="fubon">富邦證券 (0.25%)</option><option value="custom">自訂...</option>';
    } else if (t === 'crypto') {
        brokerSelect.innerHTML = '<option value="none" selected>無手續費 (0%)</option>';
    } else {
        brokerSelect.innerHTML = '<option value="cathay">國泰證券 (0.1%)</option><option value="fubon">富邦證券 (0.25%)</option><option value="custom">自訂...</option>';
    }
}

function handleTypeChange() {
    const t=document.getElementById('inpType').value;
    const auto=(t==='stock'||t==='twstock'||t==='crypto');
    document.getElementById('rowSymbol').style.display=auto?'flex':'none';
    document.getElementById('rowName').style.display=auto?'none':'flex';
    document.getElementById('rowCurrency').style.display=auto?'none':'flex';
    document.getElementById('rowCost').style.display=(auto && t!=='crypto')?'flex':'none';
    document.getElementById('rowBankTag').style.display=(t==='bank')?'flex':'none';
    document.getElementById('rowBankName').style.display='none';
    document.getElementById('aiArea').style.display=auto?'block':'none';
    document.getElementById('lblBalance').innerText=(t==='crypto')?'數量':(auto?'股數':'金額');
    const symInput = document.getElementById('inpSymbol');
    if(symInput) symInput.placeholder = (t==='twstock') ? '例如: 台積電 或 2330' : '例如: NVDA';
    if(auto) {
        updateBrokerOptions();
        syncNameFromSymbol();
        updateAIButtonState();
    } else {
        document.getElementById('btnAI').disabled=false;
    }
    if(t==='bank') {
        handleBankTagChange();
    } else if(t==='debt') {
        // 負債類型：確保名稱欄位可編輯
        const nameInput = document.getElementById('inpName');
        if(nameInput) {
            nameInput.disabled = false;
            // 如果是新增模式且名稱為空或為「現金」，清空名稱欄位
            if(!editingId && (nameInput.value === '' || nameInput.value === '現金')) {
                nameInput.value = '';
            }
        }
    }
}

function handleBankTagChange() {
    const tag = document.getElementById('inpBankTag') ? document.getElementById('inpBankTag').value : '現金';
    const nameInput = document.getElementById('inpName');
    const bankNameRow = document.getElementById('rowBankName');
    const bankNameInput = document.getElementById('inpBankName');
    const isEditing = editingId !== null; // 判斷是編輯還是新增模式
    const currentName = nameInput ? nameInput.value : ''; // 保存當前名稱

    if(tag === '現金') {
        // 現金：名稱固定為"現金"
        if(nameInput) {
            nameInput.value = '現金';
            nameInput.disabled = true;
        }
        if(bankNameRow) bankNameRow.style.display = 'none';
        if(bankNameInput) bankNameInput.value = '';
    } else if(tag === '銀行' || tag === '信用卡' || tag === '簽帳金融卡') {
        // 銀行、信用卡、簽帳金融卡：顯示銀行選擇欄位，名稱可編輯
        if(nameInput) {
            // 編輯模式下保持原有名稱，新增模式下清空
            if(!isEditing) {
                nameInput.value = '';
            }
            nameInput.disabled = false;
        }
        if(bankNameRow) bankNameRow.style.display = 'flex';
        // 初始化銀行搜尋功能
        if(bankNameInput) {
            initBankSearch(bankNameInput);
        }
    } else {
        // 電子貨幣等其他標籤：名稱可編輯，不顯示銀行選擇
        if(nameInput) {
            // 編輯模式下保持原有名稱，新增模式下清空
            if(!isEditing) {
                nameInput.value = '';
            }
            nameInput.disabled = false;
        }
        if(bankNameRow) bankNameRow.style.display = 'none';
        if(bankNameInput) bankNameInput.value = '';
    }
}

function saveAccount() { const t=document.getElementById('inpType').value; let s=document.getElementById('inpSymbol').value.trim().toUpperCase(); let n=document.getElementById('inpName').value.trim(); let c=document.getElementById('inpCurrency').value; const balanceInput = document.getElementById('inpBalance').value.trim(); const b = balanceInput === '' ? 0 : (parseFloat(balanceInput) || 0); const costInput = document.getElementById('inpCost').value.trim(); let cost = costInput === '' ? 0 : (parseFloat(costInput) || 0); const auto=(t==='stock'||t==='twstock'||t==='crypto'); const bankTag = t === 'bank' ? (document.getElementById('inpBankTag') ? document.getElementById('inpBankTag').value : '現金') : null; const bankName = t === 'bank' && (bankTag === '銀行' || bankTag === '信用卡' || bankTag === '簽帳金融卡') ? (window.getSelectedBankName ? window.getSelectedBankName() : (document.getElementById('inpBankName') ? document.getElementById('inpBankName').value : '')) : null; let logoUrl = null; if(t==='stock'){ if(!s)return alert("請輸入代碼"); if(!b)return alert("請輸入股數"); if(!cost)return alert("請輸入平均成本"); if(!n) n=s.replace('COINBASE:','').replace('OKEX:','').replace('-USD','').replace('-USDT',''); else n=cleanCompanyName(n); logoUrl = document.getElementById('inpSymbol').getAttribute('data-logo') || null; c='USD'; } else if(t==='twstock'){ if(!s)return alert("請輸入代碼"); if(!b)return alert("請輸入股數"); if(!cost)return alert("請輸入平均成本"); if(!n) n=s; c='TWD'; } else if(t==='crypto'){ if(!s)return alert("請輸入代碼"); if(!b)return alert("請輸入數量"); cost=0; if(!s.includes(':'))s=`COINBASE:${s}-USD`; if(!n) n=s.replace('COINBASE:','').replace('OKEX:','').replace('-USD','').replace('-USDT',''); logoUrl = document.getElementById('inpSymbol').getAttribute('data-logo') || null; c='USD'; } if(!auto && !n)return alert("請輸入名稱"); if(t === 'bank' && (bankTag === '銀行' || bankTag === '信用卡' || bankTag === '簽帳金融卡') && !bankName)return alert("請選擇銀行"); const existingAcc = editingId ? accounts.find(x=>x.id===editingId) : null; let newA; if(!editingId && (t==='stock'||t==='twstock')){ const existingSame=accounts.find(x=>x.type===t&&String(x.symbol||'').trim().toUpperCase()===s); if(existingSame){ const oldBal=parseFloat(existingSame.balance)||0; const oldCost=parseFloat(existingSame.cost)||0; const newBal=oldBal+b; const mergedCost=newBal>0?(oldBal*oldCost+b*cost)/newBal:cost; const mergedTx=(existingSame.transactions||[]).concat(window.tempTransactions||[]); existingSame.balance=newBal; existingSame.cost=mergedCost; existingSame.transactions=mergedTx; if(logoUrl)existingSame.logo=logoUrl; newA=existingSame; } } if(!newA){ newA={ id:editingId||Date.now(), type:t, name:n, symbol:s, currency:c, balance:b, cost:cost, isAuto:auto, logo: logoUrl || (existingAcc && existingAcc.logo) || null, currentPrice:existingAcc?(existingAcc.currentPrice||0):0, dayChange:existingAcc?(existingAcc.dayChange||0):0, dayChangePercent:existingAcc?(existingAcc.dayChangePercent||0):0, order:existingAcc?(existingAcc.order||0):9999, transactions: window.tempTransactions||[], bankTag: bankTag || (existingAcc && existingAcc.bankTag) || null, bankName: bankName || (existingAcc && existingAcc.bankName) || null }; if(editingId)accounts[accounts.findIndex(x=>x.id===editingId)]=newA; else accounts.push(newA); } saveData(); recordDailyAssetSnapshot(); if(currentChartMode === 'line') renderAssetLineChart(); const wasEditingFromDetail = editingFromDetail; const detailAccId = currentDetailAcc ? currentDetailAcc.id : null; if(pendingJournalModalType === 'batchExpense' || pendingJournalModalType === 'batchIncome') window.pendingNewAccountForBatch = newA;
    closeModal(); if(wasEditingFromDetail && detailAccId && newA.id === detailAccId && newA.isAuto) { openDetailView(newA.id); } else if(wasEditingFromDetail && detailAccId && !newA.isAuto) { closeDetailView(); currentDetailAcc = null; } else if(currentDetailAcc && currentDetailAcc.id === newA.id && newA.isAuto) { openDetailView(newA.id); } else if(currentDetailAcc && !newA.isAuto) { closeDetailView(); currentDetailAcc = null; } if(auto)refreshAllData(); else { renderAssets(); updateChartData(); } }

function deleteAccount() {
    const acc = accounts.find(x => x.id === editingId);
    if (!acc) return;
    const name = acc.name || '此資產';
    if (!confirm(`確定要刪除「${name}」嗎？`)) return;
    if (!confirm(`再次確認：確定要刪除「${name}」嗎？\n此操作無法復原！`)) return;
    accounts = accounts.filter(x => x.id !== editingId);
    saveData();
    recordDailyAssetSnapshot();
    if(currentChartMode === 'line') renderAssetLineChart();
    closeModal();
    closeDetailView();
    renderAssets();
}

function updateOrder(type,container){ let ids=Array.from(container.children).map(c=>parseInt(c.getAttribute('data-id'))); ids.forEach((id,idx)=>{ let a=accounts.find(x=>x.id===id); if(a)a.order=idx; }); saveData(); }

function setFeeRate() { const k=prompt("手續費率 (%):", settings.feeRate); if(k)settings.feeRate=parseFloat(k); saveSettings(); }
function updateFeeDisplay() { const s=document.getElementById('brokerSelect'); if(s.value==='custom'){ const r=prompt("自訂費率 (%):", settings.feeRate||0.1); if(r)settings.feeRate=parseFloat(r); saveSettings(); } }

// Detail View
function openDetailView(id) {
    if (isEditMode) return;
    currentDetailAcc = accounts.find(x => x.id === id);
    if (!currentDetailAcc) return;
    if (!currentDetailAcc.isAuto) { editAccount(id); return; }
    // 美股和台股：只顯示公司名稱，不顯示代碼
    let displayName = currentDetailAcc.name;
    if(currentDetailAcc.type === 'stock') {
        displayName = cleanCompanyName(currentDetailAcc.name);
    } else if(currentDetailAcc.type === 'twstock') {
        displayName = currentDetailAcc.name;
    }
    document.getElementById('dName').innerText = displayName;
    document.getElementById('dSymbol').innerText = ''; // 清空代碼內容
    document.getElementById('dSymbol').style.display = 'none'; // 隱藏代碼
    document.getElementById('dQty').innerText = currentDetailAcc.balance;
    let price = currentDetailAcc.currentPrice || 0;
    document.getElementById('dPrice').innerText = `${price.toLocaleString()}`;
    var dPriceLbl = document.getElementById('dPriceLbl');
    if(dPriceLbl) dPriceLbl.textContent = currentDetailAcc.type === 'twstock' ? '現價 (台幣)' : '現價 (USD)';
    let val = calculateValue(currentDetailAcc); document.getElementById('dVal').innerText = formatAmount(val);
    let cost = currentDetailAcc.cost || 0; let fee = settings.feeRate || 0.1;

    // 當天損益
    let dailyPnL = calculateDailyPnL(currentDetailAcc);
    let dailySign = dailyPnL >= 0 ? '+' : '';
    let dailyColor = dailyPnL >= 0 ? 'var(--color-up)' : (dailyPnL < 0 ? 'var(--color-down)' : '#fff');
    document.getElementById('dDailyPnlVal').innerHTML = `<span style="color:${dailyColor}">${dailySign}${formatAmount(dailyPnL)}</span>`;

    // 持股成本損益
    let costPnL = calculateCostPnL(currentDetailAcc);
    let costPnlPct = (cost > 0) ? ((price - cost) / cost) * 100 : 0;
    let costSign = costPnL >= 0 ? '+' : '';
    let costColor = '#fff';
    if (cost > 0) {
        costColor = costPnL >= 0 ? 'var(--color-up)' : 'var(--color-down)';
    }
    if (cost > 0) {
        document.getElementById('dCostPnl').style.display = 'block';
        document.getElementById('dCostPnlVal').innerHTML = `<span style="color:${costColor}">${costSign}${formatAmount(costPnL)} (${costPnlPct.toFixed(2)}%)</span>`;
    } else {
        document.getElementById('dCostPnl').style.display = 'none';
    }
    const dDivBlock = document.getElementById('dDividendBlock');
    if (dDivBlock) {
        if (currentDetailAcc.type === 'twstock' && currentDetailAcc.symbol) {
            const divInfo = twDividendMap[(currentDetailAcc.symbol || '').toString().trim()];
            if (divInfo && divInfo.cashDiv > 0) {
                const estDiv = divInfo.cashDiv * (currentDetailAcc.balance || 0);
                dDivBlock.style.display = 'block';
                document.getElementById('dDividendAmount').innerText = 'NT$ ' + (estDiv >= 0 ? estDiv.toLocaleString() : '0');
                document.getElementById('dDividendDate').innerText = divInfo.dateStr || '-';
            } else {
                dDivBlock.style.display = 'none';
            }
        } else {
            dDivBlock.style.display = 'none';
        }
    }
    const txList = document.getElementById('detailTxList'); txList.innerHTML = '';
    if (currentDetailAcc.transactions && currentDetailAcc.transactions.length > 0) {
        currentDetailAcc.transactions.forEach((tx, index) => {
            let txPnlHtml = '';
            let txPriceColor = '';
            // 成交價顏色：與現價比較，現價高於成交價用綠色（漲），現價低於成交價用紅色（跌）
            if (price > 0 && tx.price > 0) {
                 let txCost = tx.price * (1 + fee/100); let txProfit = (price - txCost) * tx.shares;
                 let txProfitConverted = currentDetailAcc.type === 'twstock' ? (currentDisplayCurrency === 'USD' ? txProfit / settings.usdRate : txProfit) : (currentDisplayCurrency === 'USD' ? txProfit : txProfit * settings.usdRate);
                 let txSign = txProfitConverted >= 0 ? '+' : ''; let txColor = txProfitConverted >= 0 ? 'val-green' : 'val-red'; let txPct = ((price - txCost) / txCost) * 100;
                 txPnlHtml = `<div class="tx-row"><span class="tx-label">損益</span><span class="tx-val ${txColor}">${txSign}${formatAmount(txProfitConverted)} (${txPct.toFixed(1)}%)</span></div>`;
                 // 成交價顏色：與現價比較，現價高於成交價用綠色（漲），現價低於成交價用紅色（跌）
                 if (price > tx.price) {
                     txPriceColor = 'val-green';
                 } else if (price < tx.price) {
                     txPriceColor = 'val-red';
                 }
            } else if (cost > 0 && tx.price > 0) {
                 // 如果沒有現價，使用平均成本來比較
                 if (cost > tx.price) {
                     txPriceColor = 'val-green';
                 } else if (cost < tx.price) {
                     txPriceColor = 'val-red';
                 }
            }
            // 確保顏色類被正確應用
            const priceClass = txPriceColor ? ` ${txPriceColor}` : '';
            txList.innerHTML += `<div class="tx-item"><div class="tx-header-row"><div><span class="tx-badge">整股</span> <span class="tx-date">${tx.date}</span></div><button class="tx-delete-btn" onclick="deleteStockTransaction(${index})" title="刪除此筆交易"><i class="fas fa-trash"></i></button></div><div class="tx-row"><span class="tx-label">股數</span><span class="tx-val">${tx.shares}</span></div><div class="tx-row"><span class="tx-label">成交價</span><span class="tx-val${priceClass}">$${tx.price.toFixed(2)}</span></div>${txPnlHtml}</div>`;
        });
    } else { txList.innerHTML = '<div class="tx-no-data">無詳細交易紀錄<br>請在編輯模式匯入截圖</div>'; }
    const detailView = document.getElementById('detailView');
    if(detailView) {
        // 檢查詳情頁面是否已經打開（通過檢查 active 類和 display 樣式）
        const isAlreadyOpen = detailView.classList.contains('active') &&
                              (detailView.style.transform === 'translateX(0px)' ||
                               detailView.style.transform === '' ||
                               getComputedStyle(detailView).transform === 'matrix(1, 0, 0, 1, 0, 0)');

        if(!isAlreadyOpen) {
            // 先設置初始位置
            detailView.style.transform = 'translateX(100%)';
            detailView.classList.add('active');
            // 然後動畫滑入
            setTimeout(() => {
                detailView.style.transform = 'translateX(0)';
            }, 10);
        }
        // 如果已經打開，不重新設置 transform，避免觸發動畫
    }
    initDetailViewSwipe();
}

function closeDetailView() {
    const detailView = document.getElementById('detailView');
    if(detailView) {
        // 先動畫滑出
        detailView.style.transform = 'translateX(100%)';
        setTimeout(() => {
            detailView.classList.remove('active');
            // 重置 transform 以便下次打開時動畫正常
            detailView.style.transform = 'translateX(100%)';
        }, 400);
    }
}

function editCurrentAsset() {
    if(currentDetailAcc) {
        editingFromDetail = true; // 標記是從詳情頁面進入
        editAccount(currentDetailAcc.id);
    }
}

function renderTransactions(list) {
    const c = document.getElementById('txListContainer');
    c.innerHTML = '';
    if(!list || list.length === 0) {
        c.innerHTML = '<div class="tx-no-data">無明細</div>';
        return;
    }

    // 獲取當前編輯的帳戶信息，用於比較價格
    let price = 0;
    let cost = 0;
    if(editingId) {
        const acc = accounts.find(x => x.id === editingId);
        if(acc) {
            price = acc.currentPrice || 0;
            cost = acc.cost || 0;
        }
    }

    list.forEach((tx, index) => {
        let txPriceColor = '';
        // 成交價顏色：與現價比較，現價高於成交價用綠色（漲），現價低於成交價用紅色（跌）
        if (price > 0 && tx.price > 0) {
            if (price > tx.price) {
                txPriceColor = 'val-green';
            } else if (price < tx.price) {
                txPriceColor = 'val-red';
            }
        } else if (cost > 0 && tx.price > 0) {
            // 如果沒有現價，使用平均成本來比較
            if (cost > tx.price) {
                txPriceColor = 'val-green';
            } else if (cost < tx.price) {
                txPriceColor = 'val-red';
            }
        }
        const priceClass = txPriceColor ? ` ${txPriceColor}` : '';
        c.innerHTML += `<div class="tx-item"><div class="tx-header-row"><div><span class="tx-badge">整股</span> <span class="tx-date">${tx.date}</span></div><button class="tx-delete-btn" onclick="deleteStockTransactionInEdit(${index})" title="刪除此筆交易"><i class="fas fa-trash"></i></button></div><div class="tx-row"><span class="tx-label">股數</span><span class="tx-val">${tx.shares}</span></div><div class="tx-row"><span class="tx-label">成交價</span><span class="tx-val${priceClass}">$${tx.price}</span></div></div>`;
    });
}

// Page Swiper Functions
function switchToPage(pageIndex) {
    if(pageIndex < 0 || pageIndex >= PAGE_TYPES.length) return;
    // 檢查分頁是否啟用
    if(!isPageEnabled(pageIndex)) {
        // 如果分頁未啟用，切換到第一個啟用的分頁
        const enabledPages = getEnabledPages();
        if(enabledPages.length > 0) {
            pageIndex = enabledPages[0];
        } else {
            pageIndex = 0; // 如果沒有啟用的分頁，默認顯示總覽
        }
    }
    currentPage = pageIndex;

    // 在渲染前先將滾動位置重置到頂端，避免先顯示中間內容再滾動
    const scrollContainer = document.querySelector('.content-grid');
    if(scrollContainer) {
        scrollContainer.scrollTop = 0;
    }

    // 重新排列 page-item 的 DOM 順序，使其與 pageOrder 一致
    reorderPageItems();

    // 方案C：直接切換 active class（不再用 translateX）
    updateActivePageClass();

    // 更新分頁指示器（使用 data-page 屬性匹配，而不是 DOM 索引）
    document.querySelectorAll('.page-tab').forEach((tab) => {
        const tabPageIndex = parseInt(tab.getAttribute('data-page'));
        tab.classList.toggle('active', tabPageIndex === pageIndex);
    });

    // 確保選中的標籤在可見範圍內（但不居中）
    const ensureTabVisible = () => {
        const activeTab = document.querySelector(`.page-tab[data-page="${pageIndex}"]`);
        const indicator = document.querySelector('.page-indicator');

        if(!activeTab || !indicator) return;

        const tabRect = activeTab.getBoundingClientRect();
        const indicatorRect = indicator.getBoundingClientRect();

        // 檢查標籤是否在可見範圍內
        const isVisible = tabRect.left >= indicatorRect.left && tabRect.right <= indicatorRect.right;

        if(!isVisible) {
            // 如果標籤在左側被切掉，滾動到左側
            if(tabRect.left < indicatorRect.left) {
                indicator.scrollTo({
                    left: activeTab.offsetLeft - 10,
                    behavior: 'smooth'
                });
            }
            // 如果標籤在右側被切掉，滾動到右側
            else if(tabRect.right > indicatorRect.right) {
                const scrollLeft = activeTab.offsetLeft + activeTab.offsetWidth - indicator.clientWidth + 10;
                indicator.scrollTo({
                    left: Math.max(0, scrollLeft),
                    behavior: 'smooth'
                });
            }
        }
    };

    // 延遲執行，確保DOM更新完成
    requestAnimationFrame(() => {
        ensureTabVisible();
        setTimeout(ensureTabVisible, 100);
    });

    // 更新箭頭按鈕狀態（桌面版）
    updatePageNavArrows();

    // 隱藏圖表點擊後顯示的資訊
    hideCustomTooltip();

    // 清除圖表的點擊狀態（恢復所有點的狀態）
    if(chartInstance && chartInstance.series.length > 0) {
        chartInstance.series.forEach(series => {
            if(series.points) {
                series.points.forEach(point => {
                    if(point.sliced && typeof point.slice === 'function') {
                        point.slice(false);
                    }
                    point.setState('normal');
                    const pointEl = point.graphic?.element;
                    if(pointEl) {
                        pointEl.style.setProperty('opacity', '1', 'important');
                    }
                });
            }
        });
    }
    activeInactivePoints.clear();

    // 更新圖表和列表 - 切換分頁時退出 detail 模式
    chartLevel = pageIndex === 0 ? 'root' : 'page';

    // 取消當前正在進行的動畫（如果有的話）
    if (chartAnimationEngine && chartAnimationEngine.isAnimating) {
        chartAnimationEngine.cancel();
    }

    // 確保動畫引擎已初始化
    if (chartInstance && !chartAnimationEngine) {
        chartAnimationEngine = new ChartAnimationEngine(chartInstance);
    }

    // 使用動畫更新圖表（動畫引擎會處理沒有起始數據的情況）
    updateChartData(true);
    renderAssets();
    // 如果折線圖正在顯示，切換分頁時重新渲染
    if(currentChartMode === 'line') renderAssetLineChart();
}

// === 方案C：position 疊加頁面管理 ===

// 更新當前頁面的 active class（只有 active 頁面佔空間，其他絕對定位不佔空間）
function updateActivePageClass() {
    const container = document.getElementById('pageContainer');
    if(!container) return;
    container.querySelectorAll('.page-item').forEach(item => {
        const pageIdx = parseInt(item.getAttribute('data-page'));
        const isActive = pageIdx === currentPage;
        item.classList.toggle('page-active', isActive);
        item.classList.remove('page-swipe-visible');
        // 清除任何殘留的動畫 inline style
        item.style.transform = '';
        item.style.transition = '';
    });
    // 清除容器的明確高度（不再需要，active 頁面的 position:relative 自動決定高度）
    container.style.height = '';
    container.style.minHeight = '';
}

// 切換到上一頁
function switchToPrevPage() {
    const orderedPages = getOrderedPages();
    const currentIndex = orderedPages.indexOf(currentPage);
    if(currentIndex > 0) {
        switchToPage(orderedPages[currentIndex - 1]);
    }
}

// 切換到下一頁
function switchToNextPage() {
    const orderedPages = getOrderedPages();
    const currentIndex = orderedPages.indexOf(currentPage);
    if(currentIndex < orderedPages.length - 1) {
        switchToPage(orderedPages[currentIndex + 1]);
    }
}

function renderAssets() {
    sortables.forEach(s=>s.destroy());
    sortables=[];
    unlockScrollForSort(); // 確保切換頁面時解除滾動鎖定

    // 在桌面模式下，動態計算並對齊列表標題與圓餅圖中心
    if(window.matchMedia('(min-width: 768px)').matches) {
        setTimeout(() => {
            const chartWrapper = document.querySelector('#chartWrapper');
            const firstGroupHeader = document.querySelector('.list-section .page-container > div:first-child.group-header');
            if(chartWrapper && firstGroupHeader) {
                // 取得圓餅圖的中心位置（相對於視窗）
                const chartRect = chartWrapper.getBoundingClientRect();
                const chartCenterY = chartRect.top + (chartRect.height / 2);

                // 取得列表標題的位置（相對於視窗）
                const headerRect = firstGroupHeader.getBoundingClientRect();
                const headerTopY = headerRect.top;

                // 計算需要補償的高度差：讓 group-header 的頂部與圓餅圖中心對齊
                const offset = chartCenterY - headerTopY;
                if(offset > 0) {
                    firstGroupHeader.style.marginTop = `${offset}px`;
                } else {
                    firstGroupHeader.style.marginTop = '0px';
                }
            }
        }, 300);
    }

    let displayAmount = 0;
    let totalDailyPnL = 0;

    if(currentPage === 0) {
        // 總覽分頁：計算總淨資產（只包含啟用分頁的資產減去負債）
        accounts.forEach(acc => {
            // 只計算啟用分頁的資產
            if(acc.type !== 'debt') {
                if(acc.type === 'bank' && !pageVisibility['bank']) return;
                if(acc.type === 'stock' && !pageVisibility['stock']) return;
                if(acc.type === 'twstock' && !pageVisibility['twstock']) return;
                if(acc.type === 'crypto' && !pageVisibility['crypto']) return;
            }
            let val = calculateValue(acc);
            if(acc.type === 'bank' && acc.bankTag === '信用卡') return; // 信用卡僅供紀錄，不計入總資產
            if(acc.type === 'debt') displayAmount -= val;
            else displayAmount += val;
            if(acc.isAuto) totalDailyPnL += calculateDailyPnL(acc);
        });
    } else {
        // 其他分頁：只計算該分頁類別的總額
        const currentType = PAGE_TYPES[currentPage];
        accounts.forEach(acc => {
            if(acc.type === currentType) {
                if(acc.type === 'bank' && acc.bankTag === '信用卡') return; // 信用卡僅供紀錄，不計入
                let val = calculateValue(acc);
                displayAmount += val;
                if(acc.isAuto) totalDailyPnL += calculateDailyPnL(acc);
            }
        });
    }

    // 計算總損益
    let totalCostPnL = 0;
    accounts.forEach(acc => {
        if(acc.isAuto) {
            if(currentPage === 0) {
                // 總覽分頁：只計算啟用分頁的資產
                if(acc.type !== 'debt') {
                    if(acc.type === 'bank' && !pageVisibility['bank']) return;
                    if(acc.type === 'stock' && !pageVisibility['stock']) return;
                    if(acc.type === 'twstock' && !pageVisibility['twstock']) return;
                    if(acc.type === 'crypto' && !pageVisibility['crypto']) return;
                }
                totalCostPnL += calculateCostPnL(acc);
            } else {
                // 其他分頁：只計算該分頁類別的資產
                const currentType = PAGE_TYPES[currentPage];
                if(acc.type === currentType) {
                    totalCostPnL += calculateCostPnL(acc);
                }
            }
        }
    });

    // 計算記帳盈虧並加入總計
    if(currentPage === 0) {
        // 總覽頁面：股票盈虧 + 記帳盈虧
        const journalDailyPnL = calculateJournalDailyPnL();
        const journalTotalPnL = calculateJournalTotalPnL();
        // 應用偏移值（如果已歸零）
        totalDailyPnL += journalDailyPnL + getDailyPnLOffset();
        totalCostPnL += journalTotalPnL + getTotalPnLOffset();
    } else if(currentPage === 1) {
        // 錢包頁面：只顯示記帳盈虧
        const journalDailyPnL = calculateJournalDailyPnL();
        const journalTotalPnL = calculateJournalTotalPnL();
        // 應用偏移值（如果已歸零）
        totalDailyPnL = journalDailyPnL + getDailyPnLOffset();
        totalCostPnL = journalTotalPnL + getTotalPnLOffset();
    }
    // 股票頁面（第2、3、4頁）保持原有邏輯，不加入記帳盈虧

    // 更新總資產顯示
    document.getElementById('totalNetWorth').innerText = formatAmount(displayAmount);
    const b = document.getElementById('totalPnLBlock');
    const bd = document.getElementById('totalPnLBadge');
    if(Math.abs(totalDailyPnL) > 1 || Math.abs(totalCostPnL) > 1) {
        b.style.display = 'block';
        // 重置樣式，確保損益正常顯示
        bd.style.visibility = 'visible';
        bd.style.height = '';
        bd.style.margin = '';
        bd.style.padding = '';
        let pnlHtml = '';
        // 顯示當日損益
        if(Math.abs(totalDailyPnL) > 1) {
            const s = totalDailyPnL > 0 ? '+' : '';
            const c = totalDailyPnL > 0 ? 'pnl-up' : 'pnl-down';
            pnlHtml += `今日: <span class="${c}">${s}${formatAmount(totalDailyPnL)}</span>`;
        }
        // 顯示總損益
        if(Math.abs(totalCostPnL) > 1) {
            if(pnlHtml) pnlHtml += ' / ';
            const s = totalCostPnL > 0 ? '+' : '';
            const c = totalCostPnL > 0 ? 'pnl-up' : 'pnl-down';
            pnlHtml += `總計: <span class="${c}">${s}${formatAmount(totalCostPnL)}</span>`;
        }
        bd.innerHTML = pnlHtml;
    } else {
        // 即使沒有損益也顯示空白區塊，保持與其他分頁對齊（完全不可見但佔位）
        b.style.display = 'block';
        bd.style.visibility = 'hidden';
        bd.style.height = '0';
        bd.style.margin = '0';
        bd.style.padding = '0';
        bd.innerHTML = '';
    }

    // 更新摘要標籤
    const summaryLabelEl = document.getElementById('summaryLabel');
    if(currentPage === 0) {
        if(summaryLabelEl) summaryLabelEl.innerText = '總淨資產';
    } else {
        if(summaryLabelEl) summaryLabelEl.innerText = `${PAGE_NAMES[currentPage]} 總額`;
    }

    // 渲染總覽分頁（第0頁）- 顯示各類別卡片（與其他分頁格式一致）
    if(currentPage === 0) {
        const c = document.getElementById('assetsContainer');
        if(c) {
            c.innerHTML = '';
            const categoryConfig = {
                'bank': {t:'錢包', i:'fa-university', s:'icon-bank'},
                'stock': {t:'美股', i:'fa-chart-line', s:'icon-stock'},
                'twstock': {t:'台股', i:'fa-chart-line', s:'icon-twstock'},
                'crypto': {t:'加密貨幣', i:'fa-bitcoin', s:'icon-crypto'}
            };

            // 按照 pageOrder 順序獲取分類類型（排除總覽，只包含啟用的分頁）
            const orderedCategoryTypes = pageOrder
                .filter(index => index !== 0) // 排除總覽
                .map(index => PAGE_TYPES[index]) // 轉換為類型名稱
                .filter(type => pageVisibility[type] !== false); // 只包含啟用的分頁

            let allItems = [];
            orderedCategoryTypes.forEach(type => {

                const g = categoryConfig[type];
                if(!g) return;
                let items = accounts.filter(a => a.type === type);
                let sum = 0;
                let groupPnL = 0;
                items.forEach(acc => {
                    if(type === 'bank' && acc.bankTag === '信用卡') return; // 信用卡僅供紀錄，不計入
                    let val = calculateValue(acc);
                    sum += val;
                    groupPnL += calculatePnL(acc);
                });
                // 即使沒有資產也要顯示，顯示為 0
                allItems.push({type: type, name: g.t, icon: g.i, iconClass: g.s, sum: sum, pnl: groupPnL});
            });

            // 所有分類都會顯示，不需要檢查是否為空

            let totalSum = 0;
            let totalPnL = 0;
            let html = '';

            allItems.forEach(item => {
                totalSum += item.sum;
                totalPnL += item.pnl;

                let htmlContent = `<div class="item-name">${item.name}</div><div class="item-row">總覽</div>`;
                let color = 'amount-green';

                // 檢查該項目是否被隱藏
                let itemHidden = localStorage.getItem(`itemHidden_category-${item.type}`) === 'true';
                let eyeIcon = itemHidden ? 'fa-eye-slash' : 'fa-eye';

                let pnlHtml = '';
                if(Math.abs(item.pnl) > 0.01) {
                    pnlHtml = `<div class="amount-pnl item-numbers">${formatPnL(item.pnl)}</div>`;
                }

                html += `<div class="list-item ${itemHidden ? 'item-hidden' : ''}" onclick="switchToPage(${PAGE_TYPES.indexOf(item.type)})" data-id="category-${item.type}"><div class="item-icon ${item.iconClass}"><i class="fas ${item.icon}"></i></div><div class="item-content">${htmlContent}</div><div class="item-amount-wrapper"><div class="item-amount"><div class="amount-val-wrapper"><div class="amount-val item-numbers ${color}">${formatAmount(item.sum)}</div><button class="item-eye-btn" onclick="event.stopPropagation(); toggleItemNumbers('category-${item.type}')" title="隱藏/顯示數字"><i class="fas ${eyeIcon}"></i></button></div>${pnlHtml}</div></div></div>`;
            });

            let pHtml = totalPnL !== 0 ? `<span class="group-pnl numbers-content">${formatPnL(totalPnL)}</span>` : '';
            c.innerHTML = `<div class="group-header"><span>總覽<span class="drag-hint">長按可拖動排序</span></span><div class="group-total-block"><span class="group-total numbers-content">${formatAmount(totalSum)}</span>${pHtml}</div></div><div class="list-container" id="group-overview">${html}</div>`;

            // 總覽類別卡片：長按可拖動排序
            let elOverview = document.getElementById('group-overview');
            if(elOverview) {
                sortables.push(Sortable.create(elOverview, {
                    animation: 150,
                    delay: 400,
                    filter: '.item-eye-btn, button',
                    onStart: function() { isSorting = true; lockScrollForSort(); },
                    onEnd: function(evt) {
                        isSorting = false; unlockScrollForSort();
                        let newCategoryOrder = Array.from(evt.from.children).map(c => {
                            let dataId = c.getAttribute('data-id');
                            if(dataId && dataId.startsWith('category-')) return dataId.replace('category-', '');
                            return null;
                        }).filter(id => id !== null);
                        const newPageOrder = [0];
                        newCategoryOrder.forEach(type => {
                            const pageIndex = PAGE_TYPES.indexOf(type);
                            if(pageIndex > 0) newPageOrder.push(pageIndex);
                        });
                        pageOrder = newPageOrder;
                        savePageOrder();
                        reorderPageItems();
                        renderPageIndicator();
                        renderPageVisibilitySettings();
                        updateActivePageClass();
                    }
                }));
            }
        }
    }

    // 渲染其他分頁（第1-4頁）
    PAGE_TYPES.forEach((type, pageIdx) => {
        if(pageIdx === 0) return; // 跳過總覽分頁

        // 只渲染啟用的分頁
        if(!isPageEnabled(pageIdx)) {
            const containerId = pageIdx === 1 ? 'assetsContainer1' : (pageIdx === 2 ? 'assetsContainer2' : (pageIdx === 3 ? 'assetsContainer3' : 'assetsContainer4'));
            const c = document.getElementById(containerId);
            if(c) c.innerHTML = '';
            return;
        }

        const containerId = pageIdx === 1 ? 'assetsContainer1' : (pageIdx === 2 ? 'assetsContainer2' : (pageIdx === 3 ? 'assetsContainer3' : 'assetsContainer4'));
        const c = document.getElementById(containerId);
        if(!c) return;

        const groupConfig = {
            'bank': {t:'錢包', i:'fa-university', s:'icon-bank'},
            'stock': {t:'美股', i:'fa-chart-line', s:'icon-stock'},
            'twstock': {t:'台股', i:'fa-chart-line', s:'icon-twstock'},
            'crypto': {t:'加密貨幣', i:'fa-bitcoin', s:'icon-crypto'}
        };
        const g = groupConfig[type];
        if(!g) return;

        // 分頁模式：顯示該類別內的資產列表
        c.innerHTML = '';
        let items = accounts.filter(a => a.type === type).sort((a,b) => (a.order||0) - (b.order||0));
        if(items.length === 0) {
            c.innerHTML = '<div style="text-align:center; color:#666; padding:30px 0;">暫無資產</div>';
            return;
        }

        let sum = 0;
        let groupPnL = 0;
        let html = '';

        // 直接顯示所有帳戶，不按銀行分組（信用卡僅供紀錄，不計入錢包總額）
        items.forEach(acc => {
            let val = calculateValue(acc);
            let pnl = calculatePnL(acc);
            if(acc.bankTag !== '信用卡') {
                sum += val;
                groupPnL += pnl;
            }

            let htmlContent = '';
            let color = (acc.type === 'bank' && acc.bankTag === '信用卡') ? 'amount-red' : 'amount-green';
            if(acc.isAuto) {
                let sym = acc.symbol.replace('COINBASE:','').replace('OKEX:','').replace('-USD','').replace('-USDT','');
                // 台股和美股/加密貨幣都統一格式，不使用前綴
                let pricePrefix = '';
                // 簡化價格顯示，去掉單位（台股和美股都統一格式），沒有資料時顯示 N/A
                // 對於 USDT/USDC 等穩定幣，價格顯示為 1.00
                let price = '';
                if(acc.currentPrice) {
                    if((sym === 'USDT' || sym === 'USDC') && acc.currentPrice === 1) {
                        price = '1.00';
                    } else {
                        price = `${pricePrefix}${acc.currentPrice.toLocaleString()}`;
                    }
                } else {
                    price = 'N/A';
                }
                let chg = '';
                if(acc.dayChangePercent !== undefined && acc.dayChangePercent !== null) {
                    // 對於 USDT/USDC 等穩定幣，如果漲跌幅為 0，不顯示
                    if((sym === 'USDT' || sym === 'USDC') && acc.dayChangePercent === 0) {
                        chg = '';
                    } else {
                        let s = acc.dayChangePercent > 0 ? '+' : '';
                        let c = acc.dayChangePercent > 0 ? 'sub-green' : 'sub-red';
                        chg = `<span class="${c}">${s}${acc.dayChangePercent.toFixed(2)}%</span>`;
                    }
                } else if(acc.currentPrice && (sym !== 'USDT' && sym !== 'USDC')) {
                    // 有價格但沒有漲跌幅，且不是穩定幣，顯示 N/A
                    chg = `<span>N/A</span>`;
                }
                // 計算盈虧（用於顯示在當日和成本行的右邊）
                let dailyPnL = acc.isAuto ? calculateDailyPnL(acc) : 0;
                let costPnL = acc.isAuto ? calculateCostPnL(acc) : 0;
                let dailyPnLHtml = '';
                let costPnLHtml = '';

                // 美股、台股、加密貨幣：將盈虧顯示在當日和成本行的最右邊
                if(acc.type === 'stock' || acc.type === 'twstock' || acc.type === 'crypto') {
                    if(Math.abs(dailyPnL) > 0.01) {
                        dailyPnLHtml = `<span style="margin-left: auto;">${formatPnL(dailyPnL)}</span>`;
                    }
                    if(acc.cost && acc.cost > 0 && acc.currentPrice && acc.currentPrice > 0 && Math.abs(costPnL) > 0.01) {
                        costPnLHtml = `<span style="margin-left: auto;">${formatPnL(costPnL)}</span>`;
                    }
                }

                // 第一行：當日標籤 + 價格 + 當天漲跌幅 + 當日盈虧（美股、台股、加密貨幣）
                // USDT/USDC 特別處理：不顯示當日和成本行
                let line1 = '';
                let line2 = '';
                if(sym !== 'USDT' && sym !== 'USDC') {
                    line1 = chg ? `<div class="item-row-compact"><span class="price-label">當日</span><span>${price}</span>${chg}${dailyPnLHtml}</div>` : `<div class="item-row-compact"><span class="price-label">當日</span><span>${price}</span>${dailyPnLHtml}</div>`;
                    // 第二行：成本標籤 + 成本 + 成本百分比 + 成本盈虧（美股、台股；加密貨幣不顯示成本）
                    if(acc.type !== 'crypto' && acc.cost && acc.cost > 0) {
                        if(acc.currentPrice && acc.currentPrice > 0) {
                            let pnlPct = ((acc.currentPrice - acc.cost) / acc.cost) * 100;
                            let s = pnlPct >= 0 ? '+' : '';
                            let c = pnlPct >= 0 ? 'sub-green' : 'sub-red';
                            let costPrefix = '';
                            // 簡化：只顯示成本和百分比，加上"成本"標籤
                            // 美股、台股：line2 不包含股數，股數會放在代碼行
                            line2 = `<div class="item-row-compact"><span class="price-label">成本</span><span>${costPrefix}${acc.cost.toFixed(2)}</span><span class="${c}">${s}${pnlPct.toFixed(1)}%</span>${costPnLHtml}</div>`;
                        } else {
                            // 有成本但沒有當前價格，顯示成本和 N/A
                            let costPrefix = '';
                            line2 = `<div class="item-row-compact"><span class="price-label">成本</span><span>${costPrefix}${acc.cost.toFixed(2)}</span><span>N/A</span>${costPnLHtml}</div>`;
                        }
                    } else if(acc.type !== 'crypto') {
                        // 沒有成本時，顯示 N/A（加密貨幣不顯示）
                        line2 = `<div class="item-row-compact"><span class="price-label">成本</span><span>N/A</span></div>`;
                    }
                }
                // 美股、台股、加密貨幣：分開顯示公司名稱和代號
                let displayName = acc.type === 'stock' ? cleanCompanyName(acc.name) : acc.name;
                // 美股、台股、加密貨幣使用新佈局：第一行公司名稱，第二行代號+價格資訊
                if(acc.type === 'stock' || acc.type === 'twstock' || acc.type === 'crypto') {
                    // 檢查該項目是否被隱藏（需要在這裡檢查，因為後面會用到 eyeIcon）
                    let itemHiddenTemp = localStorage.getItem(`itemHidden_${acc.id}`) === 'true';
                    let eyeIconTemp = itemHiddenTemp ? 'fa-eye-slash' : 'fa-eye';
                    // 第二行：代號，第三行開始：價格資訊（line1 和 line2）
                    let symbolRow = '';
                    // 美股、台股、加密貨幣：即使 displayName === sym 也要顯示代碼行（因為需要顯示股數和正確的排版）
                    if(acc.type === 'stock' || acc.type === 'twstock' || acc.type === 'crypto') {
                        // 美股、台股、加密貨幣：股數放在代碼同一行的最右邊，當日和成本往下移兩行
                        let balanceUnit = acc.type === 'crypto' ? '' : '股';
                        // USDT/USDC 特別處理：不顯示當日和成本行，所以不需要 spacer
                        let isStableCoin = (sym === 'USDT' || sym === 'USDC');
                        // 加密貨幣沒有成本行（line2），但 line1 要顯示在 line2 的位置，所以需要兩個 spacer
                        let spacerHtml = '';
                        let displayLine1 = '';
                        let displayLine2 = '';
                        if(isStableCoin) {
                            spacerHtml = '';
                            displayLine1 = '';
                            displayLine2 = '';
                        } else if(acc.type === 'crypto') {
                            spacerHtml = '<div class="symbol-spacer"></div><div class="symbol-spacer"></div>'; // 加密貨幣需要兩個 spacer，讓 line1 顯示在 line2 的位置
                            displayLine1 = ''; // 第一個 spacer 位置留空
                            displayLine2 = line1; // line1 顯示在 line2 的位置
                        } else {
                            spacerHtml = '<div class="symbol-spacer"></div><div class="symbol-spacer"></div>'; // 美股、台股有 line1 和 line2，所以需要兩個 spacer
                            displayLine1 = line1;
                            displayLine2 = line2;
                        }
                        if(sym) {
                            symbolRow = `<div class="item-symbol-row"><div class="symbol-text-row"><span class="symbol-text">${sym || 'N/A'}</span><span class="symbol-balance">${acc.balance || 'N/A'}${balanceUnit}</span></div>${spacerHtml}${displayLine1}${displayLine2}</div>`;
                        } else {
                            // 沒有代碼時，也要保持排版結構，但代碼顯示 N/A
                            symbolRow = `<div class="item-symbol-row"><div class="symbol-text-row"><span class="symbol-text">N/A</span><span class="symbol-balance">${acc.balance || 'N/A'}${balanceUnit}</span></div>${spacerHtml}${displayLine1}${displayLine2}</div>`;
                        }
                    } else if(sym && displayName !== sym) {
                        // 其他類型：只有當 displayName !== sym 時才顯示代碼行
                        symbolRow = `<div class="item-symbol-row"><div class="symbol-text-row"><span class="symbol-text">${sym}</span></div><div class="symbol-spacer"></div>${line1}${line2}</div>`;
                    } else {
                        // 沒有代碼時，直接顯示價格資訊
                        symbolRow = `<div class="item-symbol-row">${line1}${line2}</div>`;
                    }
                    // 股數顯示位置
                    let balanceDisplay = '';
                    if(acc.type === 'stock' || acc.type === 'twstock' || acc.type === 'crypto') {
                        // 美股、台股、加密貨幣：股數已移到代碼行，眼睛下方不顯示
                        balanceDisplay = '';
                    } else {
                        // 其他類型：股數放在眼睛按鈕下方
                        balanceDisplay = `<div class="item-balance-below-eye">${acc.balance || 'N/A'}</div>`;
                    }
                    htmlContent = `<div class="item-name-row"><div class="item-name">${displayName}</div><div class="item-eye-wrapper"><button class="item-eye-btn" onclick="event.stopPropagation(); toggleItemNumbers(${acc.id})" title="隱藏/顯示數字"><i class="fas ${eyeIconTemp}"></i></button>${balanceDisplay}</div><div class="amount-val item-numbers ${color}">${formatAmount(val)}</div></div>${symbolRow}`;
                } else {
                    // 其他分類保持原來的佈局
                    htmlContent = `<div class="item-name">${displayName}</div>${line1}${line2}`;
                }
             } else {
                 // 錢包項目：移除幣別顯示，顯示標籤（使用新的標籤格式）
                 const tagHTML = generateAccountTagHTML(acc);
                 htmlContent = `<div class="item-name">${acc.name}</div><div class="item-row">${tagHTML}</div>`;
             }

            let clk = `onclick="openDetailView(${acc.id})"`;
            let dailyPnL = acc.isAuto ? calculateDailyPnL(acc) : 0;
            let costPnL = acc.isAuto ? calculateCostPnL(acc) : 0;
            let pnlHtml = '';

            if(acc.isAuto) {
                // 美股、台股、加密貨幣：盈虧已經顯示在當日和成本行的右邊，所以右側不需要顯示盈虧
                if(acc.type === 'stock' || acc.type === 'twstock' || acc.type === 'crypto') {
                    // USDT/USDC 特別處理：不顯示當日和成本行，所以不需要 spacer
                    let sym = acc.symbol.replace('COINBASE:','').replace('OKEX:','').replace('-USD','').replace('-USDT','');
                    let isStableCoin = (sym === 'USDT' || sym === 'USDC');
                    if(isStableCoin) {
                        pnlHtml = '';
                    } else if(acc.type === 'crypto') {
                        // 加密貨幣只有一行（當日顯示在 line2 位置），所以只需要一個 spacer（對應第二個 symbol-spacer）
                        pnlHtml = `<div class="amount-spacer"></div>`;
                    } else {
                        // 美股、台股有 line1 和 line2，所以需要兩個 spacer
                        pnlHtml = `<div class="amount-spacer"></div><div class="amount-spacer"></div>`;
                    }
                } else {
                    // 其他類型：保持原樣，在右側顯示盈虧
                    let hasLine3 = (acc.cost && acc.cost > 0 && acc.currentPrice && acc.currentPrice > 0);
                    let pnlLines = [];
                    // 同時顯示當日損益和總損益
                    if(Math.abs(dailyPnL) > 0.01) {
                        pnlLines.push(`<span style="font-size: 10px; color: #8e8e93;">今日</span><br>${formatPnL(dailyPnL)}`);
                    }
                    if(hasLine3 && Math.abs(costPnL) > 0.01) {
                        pnlLines.push(`<span style="font-size: 10px; color: #8e8e93;">總計</span><br>${formatPnL(costPnL)}`);
                    }
                    if(pnlLines.length > 0) {
                        pnlHtml = pnlLines.map(value => `<div class="amount-pnl item-numbers">${value}</div>`).join('');
                    } else {
                        pnlHtml = `<div class="amount-spacer"></div><div class="amount-spacer"></div>`;
                    }
                }
            } else {
                pnlHtml = `<div class="amount-spacer"></div>`;
                if(pnl !== 0) {
                    pnlHtml += `<div class="amount-pnl item-numbers">${formatPnL(pnl)}</div>`;
                } else {
                    pnlHtml += '';
                }
            }

            // 檢查該項目是否被隱藏
            let itemHidden = localStorage.getItem(`itemHidden_${acc.id}`) === 'true';
            let eyeIcon = itemHidden ? 'fa-eye-slash' : 'fa-eye';

            // 美股和加密貨幣且有 logo 時顯示 logo，否則顯示 icon
            let iconHtml = '';
            if((acc.type === 'stock' || acc.type === 'crypto') && acc.logo) {
                iconHtml = `<div class="item-icon ${g.s}"><img src="${acc.logo}" alt="${acc.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\'fas ${g.i}\\'></i>';"></div>`;
            } else {
                iconHtml = `<div class="item-icon ${g.s}"><i class="fas ${g.i}"></i></div>`;
            }
            const symForDiv = (acc.symbol || '').toString().trim();
            const hasDiv = acc.type === 'twstock' && twDividendMap[symForDiv] && twDividendMap[symForDiv].cashDiv > 0;
            const divClass = hasDiv ? ' twstock-has-dividend' : '';
             // 美股、台股、加密貨幣使用新佈局：金額已內嵌在 item-name-row 中，不需要 item-amount-wrapper
             if(acc.type === 'stock' || acc.type === 'twstock' || acc.type === 'crypto') {
                 html += `<div class="list-item${divClass} ${itemHidden ? 'item-hidden' : ''}" ${clk} data-id="${acc.id}">${iconHtml}<div class="item-content">${htmlContent}</div></div>`;
            } else {
                // 其他分類（錢包等）：眼睛按鈕放在金額右邊
                html += `<div class="list-item ${itemHidden ? 'item-hidden' : ''}" ${clk} data-id="${acc.id}">${iconHtml}<div class="item-content">${htmlContent}</div><div class="item-amount-wrapper"><div class="item-amount"><div class="amount-val-wrapper"><div class="amount-val item-numbers ${color}">${formatAmount(val)}</div><button class="item-eye-btn" onclick="event.stopPropagation(); toggleItemNumbers(${acc.id})" title="隱藏/顯示數字"><i class="fas ${eyeIcon}"></i></button></div>${pnlHtml}</div></div></div>`;
            }
        });

        let pHtml = groupPnL !== 0 ? `<span class="group-pnl numbers-content">${formatPnL(groupPnL)}</span>` : '';
        c.innerHTML = `<div class="group-header"><span>${g.t}<span class="drag-hint">長按可拖動排序</span></span><div class="group-total-block"><span class="group-total numbers-content">${formatAmount(sum)}</span>${pHtml}</div></div><div class="list-container" id="group-${type}">${html}</div>`;

        // 資產細項：長按可拖動排序
        let el = document.getElementById(`group-${type}`);
        if(el) {
            sortables.push(Sortable.create(el, {
                animation: 150,
                delay: 400,
                filter: '.item-eye-btn, button',
                onStart: function() { isSorting = true; lockScrollForSort(); },
                onEnd: function(evt) {
                    isSorting = false; unlockScrollForSort();
                    updateOrder(type, evt.from);
                }
            }));
        }
    });

    // 渲染負債（始終顯示）
    renderDebt();

    // 更新圖表
    updateChartData();

    // 更新當前頁面顯示（方案C：position 疊加）
    updateActivePageClass();
}
