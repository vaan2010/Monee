    // 1. Define Constants & Globals

    
    // 統一的圖表動畫配置
    
    // Page Swiper
    let currentPage = 0;
    
    
    // 頁面載入時立即顯示載入遮罩
    (function() {
        // 確保 DOM 已準備好
        if(document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                const loadingOverlay = document.getElementById('loadingOverlay');
                if(loadingOverlay) {
                    loadingOverlay.classList.remove('hidden');
                }
            });
        } else {
            // DOM 已經準備好
            const loadingOverlay = document.getElementById('loadingOverlay');
            if(loadingOverlay) {
                loadingOverlay.classList.remove('hidden');
            }
        }
    })();

    // 2. Define Data Loading Functions
    
    
    
    // Execute Migration Immediately
    tryMigrateOldData();

    // Multi-User System
    // 如果沒有使用者，創建預設使用者
    if (users.length === 0) {
        const defaultUser = {
            id: Date.now().toString(),
            name: '使用者 1',
            avatar: DEFAULT_AVATARS[0],
            createdAt: new Date().toISOString()
        };
        users.push(defaultUser);
        currentUserId = defaultUser.id;
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, currentUserId);
    }

    // 如果當前使用者不存在，使用第一個使用者
    if (!currentUserId || !users.find(u => u.id === currentUserId)) {
        currentUserId = users[0].id;
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, currentUserId);
    }

    // Load State (多使用者版本)
    // 遷移舊資料到第一個使用者（向後兼容）
    if (!localStorage.getItem(`${STORAGE_KEY_DATA}_${currentUserId}`)) {
        const oldData = localStorage.getItem(STORAGE_KEY_DATA);
        const oldSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
        if (oldData) {
            localStorage.setItem(`${STORAGE_KEY_DATA}_${currentUserId}`, oldData);
        }
        if (oldSettings) {
            localStorage.setItem(`${STORAGE_KEY_SETTINGS}_${currentUserId}`, oldSettings);
        }
    }

    
    // 選單區塊摺疊狀態（預設全部摺疊，不記錄上次狀態）
    // 切換選單區塊摺疊/展開
    // 獲取帳戶標籤的 class（根據帳戶類型）
    function getAccountTagClass(account) {
        const bankTag = account.bankTag || '帳戶';
        let tagClass = 'account-tag-account'; // 預設為帳戶
        if(bankTag === '銀行') {
            tagClass = 'account-tag-bank';
        } else if(bankTag === '信用卡') {
            tagClass = 'account-tag-credit';
        } else if(bankTag === '簽帳金融卡') {
            tagClass = 'account-tag-debit';
        } else if(bankTag === '帳戶') {
            tagClass = 'account-tag-account';
        } else if(bankTag === '負債') {
            tagClass = 'account-tag-debt';
        }
        return tagClass;
    }
    
    // 生成帳戶標籤 HTML（可以有多個標籤）
    function generateAccountTagHTML(account) {
        const bankTag = account.bankTag || '帳戶';
        const bankName = account.bankName || '';
        
        // 判斷是否是銀行、信用卡、簽帳金融卡
        const isBankType = bankTag === '銀行' || bankTag === '信用卡' || bankTag === '簽帳金融卡';
        
        // 根據 bankTag 決定分類標籤的 class
        let tagClass = getAccountTagClass(account);
        
        // 生成標籤 HTML 陣列
        const tags = [];
        
        if(isBankType && bankName) {
            // 如果是銀行類型且有銀行名稱，分成兩個標籤：第一個顯示 tag（根據類型不同顏色），第二個顯示銀行名稱（淡藍底）
            tags.push(`<span class="account-tag ${tagClass}">${bankTag}</span>`);
            tags.push(`<span class="account-tag account-tag-bank-name">${bankName}</span>`);
        } else {
            // 其他情況直接顯示 tag（根據類型不同顏色）
            tags.push(`<span class="account-tag ${tagClass}">${bankTag}</span>`);
        }
        
        // 返回所有標籤的 HTML（用空格分隔，讓標籤之間有間距）
        return tags.join(' ');
    }
    
    // 保存分頁顯示設置
    function savePageVisibility() {
        localStorage.setItem('pageVisibility', JSON.stringify(pageVisibility));
        // 同步到 settings 並保存到 Firestore
        settings.pageVisibility = pageVisibility;
        saveSettings();
    }
    
    // 保存分頁順序
    function savePageOrder() {
        localStorage.setItem('pageOrder', JSON.stringify(pageOrder));
        // 同步到 settings 並保存到 Firestore
        settings.pageOrder = pageOrder;
        saveSettings();
    }
    
    // 獲取排序後的分頁順序（只包含啟用的分頁）
    function getOrderedPages() {
        // 先按照 pageOrder 排序，然後過濾出啟用的分頁
        const ordered = pageOrder.filter(index => isPageEnabled(index));
        // 確保總覽始終在第一位（如果啟用）
        if(ordered.includes(0)) {
            const overviewIndex = ordered.indexOf(0);
            ordered.splice(overviewIndex, 1);
            ordered.unshift(0);
        }
        return ordered;
    }
    
    // 根據順序獲取分頁在顯示中的位置索引
    function getDisplayIndex(pageIndex) {
        const orderedPages = getOrderedPages();
        return orderedPages.indexOf(pageIndex);
    }
    
    // 根據顯示位置索引獲取實際的分頁索引
    function getPageIndexByDisplay(displayIndex) {
        const orderedPages = getOrderedPages();
        return orderedPages[displayIndex] || 0;
    }
    
    // 重新排列 page-item 的 DOM 順序，使其與 pageOrder 一致
    function isPageEnabled(pageIndex) {
        if(pageIndex === 0) return pageVisibility['overview']; // 總覽始終可用
        const pageType = PAGE_TYPES[pageIndex];
        return pageVisibility[pageType] !== false; // 預設為 true
    }
    
    // 獲取所有啟用的分頁索引
    function getEnabledPages() {
        return PAGE_TYPES.map((type, index) => {
            if(index === 0) return pageVisibility['overview'] ? 0 : null;
            return pageVisibility[type] !== false ? index : null;
        }).filter(index => index !== null);
    }
    
    // 渲染分頁顯示設置
    // 渲染分頁指示器（只顯示啟用的分頁，按照順序）
    // 3. Define ALL Functions (Chart, UI, Logic)

    // --- Helper Functions ---
    // 將十六進制顏色轉換為 HSL 色調值

    // --- Chart Animation Engine ---
    // --- Chart ---
    // --- Calculations ---

    // --- UI ---
    function initBankSearch(inputElement) {
        if(!inputElement) return;
        
        const resultsDiv = document.getElementById('bankSearchResults');
        let selectedBank = null;
        
        // 移除舊的事件監聽器（如果有的話）
        const newInput = inputElement.cloneNode(true);
        inputElement.parentNode.replaceChild(newInput, inputElement);
        const bankInput = document.getElementById('inpBankName');
        
        // 輸入事件：搜尋銀行
        bankInput.addEventListener('input', function(e) {
            const query = e.target.value.trim();
            if(query === '') {
                resultsDiv.style.display = 'none';
                selectedBank = null;
                return;
            }
            
            // 搜尋銀行（名稱或代碼）
            const matches = BANK_DATA.filter(bank => 
                bank.name.includes(query) || bank.code.includes(query)
            );
            
            if(matches.length === 0) {
                resultsDiv.innerHTML = '<div style="padding: 12px; color: var(--text-secondary); text-align: center;">找不到符合的銀行</div>';
                resultsDiv.style.display = 'block';
            } else {
                resultsDiv.innerHTML = matches.map(bank => {
                    return `<div class="bank-search-item" style="padding: 12px; cursor: pointer; border-bottom: 1px solid var(--border-color);" data-bank-name="${bank.name}" data-bank-code="${bank.code}">
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                            <div style="color: var(--text-primary); font-size: 16px; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; line-height: 1.5;">${bank.name}</div>
                            ${bank.code ? `<div style="color: var(--text-secondary); font-size: 14px; font-weight: 500; flex-shrink: 0; text-align: right; width: 60px; line-height: 1.5;">${bank.code}</div>` : ''}
                        </div>
                    </div>`;
                }).join('');
                resultsDiv.style.display = 'block';
                
                // 綁定點擊事件
                resultsDiv.querySelectorAll('.bank-search-item').forEach(item => {
                    item.addEventListener('click', function() {
                        selectedBank = {
                            name: this.getAttribute('data-bank-name'),
                            code: this.getAttribute('data-bank-code')
                        };
                        bankInput.value = selectedBank.name;
                        resultsDiv.style.display = 'none';
                    });
                });
            }
        });
        
        // 點擊外部關閉搜尋結果
        document.addEventListener('click', function(e) {
            if(!bankInput.contains(e.target) && !resultsDiv.contains(e.target)) {
                resultsDiv.style.display = 'none';
            }
        });
        
        // 獲取選中的銀行名稱（用於保存）
        window.getSelectedBankName = function() {
            return bankInput.value || selectedBank?.name || '';
        };
    }
    function updateAIButtonState() { const btnAI=document.getElementById('btnAI'); if(btnAI) btnAI.disabled=false; }
    // Detail View
    // 刪除股票交易明細並重新計算成本與股數
    function deleteStockTransaction(index) {
        if (!currentDetailAcc || !currentDetailAcc.transactions || index < 0 || index >= currentDetailAcc.transactions.length) {
            return;
        }
        
        const tx = currentDetailAcc.transactions[index];
        const confirmMsg = `確定要刪除此筆交易嗎？\n日期: ${tx.date}\n股數: ${tx.shares}\n成交價: $${tx.price.toFixed(2)}`;
        if (!confirm(confirmMsg)) {
            return;
        }
        
        // 從 transactions 陣列中刪除
        currentDetailAcc.transactions.splice(index, 1);
        
        // 重新計算總股數和加權平均成本
        let totalShares = 0;
        let totalCost = 0;
        const fee = settings.feeRate || 0.1;
        
        // 判斷是否為台股固定手續費（這裡簡化處理，使用一般手續費率）
        // 如果需要更精確，可以從帳戶資料中讀取原始手續費設定
        const isTWStock = currentDetailAcc.type === 'twstock';
        
        if (currentDetailAcc.transactions && currentDetailAcc.transactions.length > 0) {
            currentDetailAcc.transactions.forEach(tx => {
                const shares = parseFloat(tx.shares) || 0;
                const price = parseFloat(tx.price) || 0;
                // 計算每股成本（含手續費）
                const costPerShare = price * (1 + fee / 100);
                totalShares += shares;
                totalCost += shares * costPerShare;
            });
        }
        
        // 計算加權平均成本
        const avgCost = totalShares > 0 ? totalCost / totalShares : 0;
        
        // 更新帳戶資料
        currentDetailAcc.balance = totalShares;
        currentDetailAcc.cost = avgCost;
        
        // 更新 accounts 陣列中的對應帳戶
        const accountIndex = accounts.findIndex(acc => acc.id === currentDetailAcc.id);
        if (accountIndex >= 0) {
            accounts[accountIndex].balance = totalShares;
            accounts[accountIndex].cost = avgCost;
            accounts[accountIndex].transactions = currentDetailAcc.transactions;
        }
        
        // 保存資料
        saveData();
        recordDailyAssetSnapshot();
        
        // 重新渲染詳情頁面
        openDetailView(currentDetailAcc.id);
        
        // 刷新列表和圖表
        renderAssets();
        updateChartData();
    }
    
    // 在編輯模式中刪除股票交易明細並重新計算成本與股數
    function deleteStockTransactionInEdit(index) {
        if (!window.tempTransactions || index < 0 || index >= window.tempTransactions.length) {
            return;
        }
        
        const tx = window.tempTransactions[index];
        const confirmMsg = `確定要刪除此筆交易嗎？\n日期: ${tx.date}\n股數: ${tx.shares}\n成交價: $${tx.price}`;
        if (!confirm(confirmMsg)) {
            return;
        }
        
        // 從 tempTransactions 陣列中刪除
        window.tempTransactions.splice(index, 1);
        
        // 獲取當前編輯的帳戶類型，用於判斷手續費
        let accountType = '';
        let isFixedFee = false;
        if (editingId) {
            const acc = accounts.find(x => x.id === editingId);
            if (acc) {
                accountType = acc.type;
            }
        } else {
            // 如果沒有 editingId，從輸入欄位獲取
            const typeInput = document.getElementById('inpType');
            if (typeInput) {
                accountType = typeInput.value;
            }
        }
        
        // 判斷手續費類型
        const brokerSelect = document.getElementById('brokerSelect');
        const broker = brokerSelect ? brokerSelect.value : 'custom';
        const isTWStock = accountType === 'twstock';
        isFixedFee = isTWStock && broker === 'cathay_fixed';
        
        // 獲取手續費率
        let fee = 0.1;
        if (accountType === 'crypto') {
            fee = 0;
        } else if (isTWStock && broker === 'cathay') {
            fee = 1.425;
        } else if (isTWStock && broker === 'cathay_fixed') {
            fee = 0;
        } else if (broker === 'fubon') {
            fee = 0.25;
        } else {
            fee = settings.feeRate || 0.1;
        }
        
        // 重新計算總股數和加權平均成本
        let totalShares = 0;
        let totalCost = 0;
        
        if (window.tempTransactions && window.tempTransactions.length > 0) {
            window.tempTransactions.forEach(tx => {
                const shares = parseFloat(tx.shares) || 0;
                const price = parseFloat(tx.price) || 0;
                let costPerShare;
                if (isFixedFee) {
                    costPerShare = price + 1; // 台股定期定額固定加1元
                } else {
                    costPerShare = price * (1 + fee / 100);
                }
                totalShares += shares;
                totalCost += shares * costPerShare;
            });
        }
        
        // 計算加權平均成本
        const avgCost = totalShares > 0 ? totalCost / totalShares : 0;
        
        // 更新輸入欄位
        const balanceInput = document.getElementById('inpBalance');
        const costInput = document.getElementById('inpCost');
        if (balanceInput) {
            balanceInput.value = totalShares;
        }
        if (costInput) {
            costInput.value = avgCost.toFixed(4);
        }
        
        // 重新渲染交易列表
        renderTransactions(window.tempTransactions);
    }
    
    // Detail View Swipe Gesture
    
    function deleteCurrentAsset() {
        if (!currentDetailAcc) return;
        
        const name = currentDetailAcc.name || '此資產';
        if (!confirm(`確定要刪除「${name}」嗎？`)) return;
        if (!confirm(`再次確認：確定要刪除「${name}」嗎？\n此操作無法復原！`)) return;
        
        // 從 accounts 中刪除
        accounts = accounts.filter(x => x.id !== currentDetailAcc.id);
        saveData();
        
        // 關閉詳情頁面
        closeDetailView();
        currentDetailAcc = null;
        
        // 刷新列表和圖表
        renderAssets();
        updateChartData();
    }

    // AI
    function triggerImageUpload() { if(!settings.geminiKey)return alert("請先設定 Gemini Key"); document.getElementById('imgUpload').click(); }
    async function handleImageUpload(input) {
        if(!input.files || input.files.length === 0) return;
        const status = document.getElementById('aiStatus'); 
        const progressContainer = document.getElementById('aiProgress');
        const progressBar = document.getElementById('aiProgressBar');
        status.innerText = `讀取圖片中...`; status.style.color = "#aaa";
        progressContainer.style.display = 'block';
        progressBar.style.width = '10%';
        try {
            const files = Array.from(input.files);
            const promises = files.map((f, idx) => new Promise((res,rej)=>{
                const r=new FileReader();
                r.onload=e=>{
                    progressBar.style.width = `${20 + (idx + 1) * 30 / files.length}%`;
                    res({inlineData:{mimeType:f.type,data:e.target.result.split(',')[1]}});
                };
                r.onerror=rej;
                r.readAsDataURL(f);
            }));
            const images = await Promise.all(promises);
            progressBar.style.width = '60%';
            status.innerText = `AI 分析中...`; status.style.color = "#0a84ff";
            const broker = document.getElementById('brokerSelect').value;
            const accountType = document.getElementById('inpType').value;
            const isTWStock = accountType === 'twstock';
            const isUSStock = accountType === 'stock';
            const isCrypto = accountType === 'crypto';
            const isFixedFee = isTWStock && broker === 'cathay_fixed'; // 台股國泰定期定額固定1元
            let fee = isCrypto ? 0 : 0.1; // 加密貨幣預設手續費為0 
            if (isTWStock && broker === 'cathay') {
                fee = 1.425; // 台股國泰一般交易1.425%
            } else if (isTWStock && broker === 'cathay_fixed') {
                fee = 0; // 台股國泰定期定額固定1元，fee設為0（會在計算時直接加1元）
            } else if (isUSStock && broker === 'cathay') {
                fee = 0.1; // 美股國泰0.1%
            } else if (broker === 'fubon') {
                fee = 0.25;
            } else if (broker === 'custom') {
                fee = settings.feeRate || 0.1;
            }
            let prompt = '';
            if(accountType === 'crypto') {
                // 加密貨幣：看圖左邊的代碼/名字和圖左邊下面的數量
                prompt = `Analyze cryptocurrency wallet/exchange screenshots. 1. Extract cryptocurrency symbol/name from the LEFT side of the image (look for crypto symbols like BTC, ETH, SOL, etc. or names like Bitcoin, Ethereum, etc.). 2. Extract the QUANTITY/AMOUNT from BELOW the symbol/name on the LEFT side. Return JSON: {"symbol": "crypto symbol/name if found", "quantity": number}`;
            } else {
                // 美股、台股：原有邏輯
                prompt = `Analyze brokerage screenshots. 1. Extract stock symbol/code if visible (look for stock ticker symbols like NVDA, TSLA, 2330, etc.). 2. Extract transaction list: [{"date": "MM/DD", "shares": number, "price": number (raw price without fee)}] 3. Calculate TOTAL shares. 4. Calculate Weighted Average Cost PER SHARE. IMPORTANT: For each transaction, Cost = Price${isFixedFee ? ' + 1' : ` * (1 + ${fee}/100)`}. Final Avg Cost = (Sum of (Shares * Cost)) / Total Shares. Return JSON: {"symbol": "stock symbol if found", "transactions": [...], "totalShares": number, "avgCost": number}`;
            }
            progressBar.style.width = '80%';
            const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${settings.geminiKey}`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, ...images] }] }) });
            progressBar.style.width = '90%';
            status.innerText = `處理結果中...`; status.style.color = "#0a84ff";
            const data = await resp.json(); if(data.error) throw new Error(data.error.message);
            if(!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0] || !data.candidates[0].content.parts[0].text) {
                throw new Error("AI 回應格式錯誤，請重試");
            }
            const txt = data.candidates[0].content.parts[0].text; 
            // 嘗試提取 JSON，使用更寬鬆的匹配
            let match = txt.match(/\{[\s\S]*\}/);
            if(!match) {
                // 如果沒有找到 JSON，嘗試尋找 JSON 陣列
                match = txt.match(/\[[\s\S]*\]/);
            }
            if(match) {
                let res;
                try {
                    res = JSON.parse(match[0]);
                } catch(parseError) {
                    // 如果解析失敗，嘗試清理文字後再解析
                    let cleanedJson = match[0].replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
                    // 移除 JSON 後面的非 JSON 字符
                    cleanedJson = cleanedJson.replace(/\}[^}]*$/, '}');
                    try {
                        res = JSON.parse(cleanedJson);
                    } catch(e) {
                        throw new Error("無法解析 AI 回應的 JSON 格式，請重試或檢查圖片內容");
                    }
                }
                if(accountType === 'crypto') {
                    // 加密貨幣：處理 symbol 和 quantity
                    if(res.symbol && res.symbol.trim()) {
                        const symbolInput = document.getElementById('inpSymbol');
                        if(symbolInput && !symbolInput.value.trim()) {
                            symbolInput.value = res.symbol.trim().toUpperCase();
                            syncNameFromSymbol();
                        }
                    }
                    if(res.quantity !== undefined && res.quantity !== null) {
                        document.getElementById('inpBalance').value = parseFloat(res.quantity) || 0;
                    }
                    progressBar.style.width = '100%';
                    status.innerText = `成功! 已辨識代碼: ${res.symbol || '未找到'}，數量: ${res.quantity || 0}`; status.style.color = "#30d158"; 
                    setTimeout(() => { progressContainer.style.display = 'none'; progressBar.style.width = '0%'; }, 1000);
                } else if(res.transactions && res.transactions.length > 0) {
                    // 美股、台股：處理交易明細
                    // 如果有提取到股票代碼，自動填入
                    if(res.symbol && res.symbol.trim()) {
                        const symbolInput = document.getElementById('inpSymbol');
                        if(symbolInput && !symbolInput.value.trim()) {
                            symbolInput.value = res.symbol.trim().toUpperCase();
                            syncNameFromSymbol();
                        }
                    }
                    // 累積到現有交易明細
                    const existingTx = window.tempTransactions || [];
                    const newTx = res.transactions || [];
                    const allTx = [...existingTx, ...newTx];
                    
                    // 重新計算總股數和加權平均成本
                    let totalShares = 0;
                    let totalCost = 0;
                    allTx.forEach(tx => {
                        const shares = parseFloat(tx.shares) || 0;
                        const price = parseFloat(tx.price) || 0;
                        let costPerShare;
                        if (isFixedFee) {
                            costPerShare = price + 1; // 台股定期定額固定加1元
                        } else {
                            costPerShare = price * (1 + fee / 100);
                        }
                        totalShares += shares;
                        totalCost += shares * costPerShare;
                    });
                    const avgCost = totalShares > 0 ? totalCost / totalShares : 0;
                    
                    // 更新顯示
                    window.tempTransactions = allTx;
                    document.getElementById('inpBalance').value = totalShares;
                    document.getElementById('inpCost').value = avgCost.toFixed(4);
                    renderTransactions(window.tempTransactions);
                    progressBar.style.width = '100%';
                    const feeText = isFixedFee ? '固定1元' : `${fee}%`;
                    status.innerText = `成功! 已累積 ${allTx.length} 筆交易，總股數: ${totalShares}，已含 ${feeText} 手續費`; status.style.color = "#30d158"; 
                    setTimeout(() => { progressContainer.style.display = 'none'; progressBar.style.width = '0%'; }, 1000);
                    switchTab('detail');
                } else { 
                    throw new Error("AI 未辨識到資料，請確認圖片內容");
                }
            } else {
                throw new Error("AI 回應中未找到有效的 JSON 資料，請重試");
            }
        } catch(e) { 
            console.error(e); 
            status.innerText = "失敗: " + e.message; 
            status.style.color = "red"; 
            progressContainer.style.display = 'none'; 
            progressBar.style.width = '0%'; 
        } 
        input.value = '';
    }
    // Async Updates
    async function updateRates() { try{const r=await fetch('https://api.exchangerate-api.com/v4/latest/USD');const d=await r.json();if(d.rates?.TWD)settings.usdRate=d.rates.TWD;}catch(e){} if(settings.apiKey){try{const r=await fetch(`https://finnhub.io/api/v1/quote?symbol=COINBASE:USDT-USD&token=${settings.apiKey}`);const j=await r.json();if(j.c)settings.usdtRate=j.c;}catch(e){}} saveSettings(); document.getElementById('rateUsd').innerText=`USD ≈ ${settings.usdRate.toFixed(2)}`; document.getElementById('rateUsdt').innerText=`USDT ≈ ${settings.usdtRate.toFixed(3)} USD`; if(!isSorting) renderAssets(); }
    async function refreshStockInfo() {
        const stockAccounts = accounts.filter(acc => acc.type === 'stock' && acc.symbol);
        const twstockAccounts = accounts.filter(acc => acc.type === 'twstock' && acc.symbol);
        const cryptoAccounts = accounts.filter(acc => acc.type === 'crypto' && acc.symbol);
        
        if(stockAccounts.length === 0 && twstockAccounts.length === 0 && cryptoAccounts.length === 0) {
            alert('沒有需要重新整理的股票資訊');
            return;
        }
        
        // 顯示遮罩層和進度條
        const overlay = document.getElementById('refreshStockOverlay');
        const progressToast = document.getElementById('refreshStockProgressToast');
        const progressBar = document.getElementById('refreshStockProgressBar');
        const progressText = document.getElementById('refreshStockProgressText');
        overlay.style.display = 'block';
        progressToast.style.display = 'block';
        progressBar.style.width = '5%';
        progressText.innerText = '準備中...';
        
        let updated = 0;
        let total = stockAccounts.length + twstockAccounts.length + cryptoAccounts.length;
        let current = 0;
        
        // 重新整理美股資訊
        for(let acc of stockAccounts) {
            current++;
            progressBar.style.width = `${5 + (current / total) * 33}%`;
            progressText.innerText = `更新美股: ${acc.symbol} (${current}/${total})`;
            
            try {
                const sym = acc.symbol.replace('COINBASE:','').replace('OKEX:','').replace('-USD','').replace('-USDT','');
                const profile = await fetchUSStockProfile(sym);
                if(profile) {
                    if(profile.name) acc.name = profile.name;
                    if(profile.logo) acc.logo = profile.logo;
                    updated++;
                }
                // 避免請求過快，添加延遲
                await new Promise(r => setTimeout(r, 200));
            } catch(e) {
                console.error(`Failed to refresh stock info for ${acc.symbol}:`, e);
            }
        }
        
        // 重新整理台股資訊
        for(let acc of twstockAccounts) {
            current++;
            progressBar.style.width = `${38 + ((current - stockAccounts.length) / Math.max(twstockAccounts.length, 1)) * 33}%`;
            progressText.innerText = `更新台股: ${acc.symbol} (${current}/${total})`;
            
            try {
                const sym = acc.symbol;
                if(/^\d{4}$/.test(sym)) {
                    const companyName = await fetchTWStockName(sym);
                    if(companyName) {
                        acc.name = companyName;
                        updated++;
                    }
                }
                // 避免請求過快，添加延遲
                await new Promise(r => setTimeout(r, 150));
            } catch(e) {
                console.error(`Failed to refresh twstock info for ${acc.symbol}:`, e);
            }
        }
        
        // 重新整理加密貨幣資訊
        for(let acc of cryptoAccounts) {
            current++;
            progressBar.style.width = `${71 + ((current - stockAccounts.length - twstockAccounts.length) / Math.max(cryptoAccounts.length, 1)) * 24}%`;
            progressText.innerText = `更新加密貨幣: ${acc.symbol} (${current}/${total})`;
            
            try {
                const sym = acc.symbol;
                const logoUrl = await fetchCryptoLogo(sym);
                if(logoUrl) {
                    acc.logo = logoUrl;
                    updated++;
                }
                // 避免請求過快，添加延遲
                await new Promise(r => setTimeout(r, 150));
            } catch(e) {
                console.error(`Failed to refresh crypto info for ${acc.symbol}:`, e);
            }
        }
        
        // 若有台股帳戶，一併更新除權除息資料
        if(twstockAccounts.length > 0) {
            try {
                await loadTwDividendData();
            } catch(e) {
                console.error('Failed to refresh dividend data:', e);
            }
        }
        
        // 保存更新後的資料
        progressBar.style.width = '95%';
        progressText.innerText = '儲存資料中...';
        saveData();
        
        // 重新渲染列表和圖表
        progressBar.style.width = '100%';
        progressText.innerText = '完成！';
        renderAssets();
        updateChartData();
        
        // 延遲後隱藏遮罩層和進度條
        setTimeout(() => {
            overlay.style.display = 'none';
            progressToast.style.display = 'none';
            progressBar.style.width = '0%';
            alert(`已重新整理 ${updated}/${total} 個股票資訊`);
        }, 500);
    }
    // Page Swiper Functions
    // 更新箭頭按鈕的禁用狀態
    function updatePageNavArrows() {
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        const orderedPages = getOrderedPages();
        const currentIndex = orderedPages.indexOf(currentPage);
        
        if(prevBtn) {
            if(currentIndex <= 0) {
                prevBtn.classList.add('disabled');
            } else {
                prevBtn.classList.remove('disabled');
            }
        }
        
        if(nextBtn) {
            if(currentIndex >= orderedPages.length - 1) {
                nextBtn.classList.add('disabled');
            } else {
                nextBtn.classList.remove('disabled');
            }
        }
    }
    
    function lockScrollForSort() {
        const main = document.querySelector('.main-content');
        if(main) { main.style.touchAction = 'none'; main.style.overflow = 'hidden'; }
        document.body.style.touchAction = 'none';
        document.body.style.overflow = 'hidden';
    }
    function unlockScrollForSort() {
        const main = document.querySelector('.main-content');
        if(main) { main.style.touchAction = ''; main.style.overflow = ''; }
        document.body.style.touchAction = '';
        document.body.style.overflow = '';
    }
    // 共用的滑動邏輯：touchstart
    function initSwiper() {
        const swiper = document.getElementById('pageSwiper');
        if(!swiper) return;
        
        // 資產列表區域滑動
        swiper.addEventListener('touchstart', _onSwipeTouchStart, { passive: true });
        swiper.addEventListener('touchmove', (e) => _onSwipeTouchMove(e, swiper.offsetWidth), { passive: true });
        swiper.addEventListener('touchend', _onSwipeTouchEnd, { passive: true });
        
        // 圖表區域也支援滑動
        const chartSection = document.querySelector('.chart-section');
        if(chartSection) {
            chartSection.addEventListener('touchstart', _onSwipeTouchStart, { passive: true });
            chartSection.addEventListener('touchmove', (e) => _onSwipeTouchMove(e, chartSection.offsetWidth), { passive: true });
            chartSection.addEventListener('touchend', _onSwipeTouchEnd, { passive: true });
        }
    }
    
    function renderDebt(containerId = null) {
        // 如果沒有指定容器，為每個分頁渲染負債
        if(!containerId) {
            for(let i = 0; i < 5; i++) {
                renderDebt(`debtContainer${i}`);
            }
            return;
        }
        
        const debtContainer = document.getElementById(containerId);
        if(!debtContainer) return;
        
        let debtItems = accounts.filter(a => a.type === 'debt').sort((a,b) => (a.order||0) - (b.order||0));
        if(debtItems.length === 0) {
            debtContainer.innerHTML = '';
            return;
        }
        
        let totalDebt = 0;
        let html = '';
        
        debtItems.forEach(acc => {
            let val = calculateValue(acc);
            totalDebt += val;
            // 檢查該項目是否被隱藏
            let itemHidden = localStorage.getItem(`itemHidden_${acc.id}`) === 'true';
            let eyeIcon = itemHidden ? 'fa-eye-slash' : 'fa-eye';
            
            // 顯示當前選擇的顯示幣別，而不是帳戶的原始幣別
            let displayCurrency = currentDisplayCurrency;
            
            let debtClick = `onclick="openDetailView(${acc.id})"`;
            html += `<div class="list-item ${itemHidden ? 'item-hidden' : ''}" ${debtClick} data-id="${acc.id}"><div class="item-icon icon-debt"><i class="fas fa-hand-holding-usd"></i></div><div class="item-content"><div class="item-name">${acc.name}</div><div class="item-row">${displayCurrency}</div></div><div class="item-amount-wrapper"><div class="item-amount"><div class="amount-val item-numbers amount-red">${formatAmount(val)}</div></div><button class="item-eye-btn" onclick="event.stopPropagation(); toggleItemNumbers(${acc.id})" title="隱藏/顯示數字"><i class="fas ${eyeIcon}"></i></button></div></div>`;
        });
        
        debtContainer.innerHTML = `<div class="group-header"><span>負債</span><div class="group-total-block"><span class="group-total numbers-content">${formatAmount(totalDebt)}</span></div></div><div class="list-container" id="group-debt-${containerId}">${html}</div>`;
        
        // 負債不允許拖動排序，即使是在編輯模式下
        // 負債始終鎖定在最底部
    }

    // Currency Toggle Function
    function updateCurrencyButton() {
        const btn = document.getElementById('currencyToggleBtn');
        const text = document.getElementById('currencyToggleText');
        if(btn && text) {
            // 顯示當前幣別
            text.innerText = currentDisplayCurrency;
            btn.title = `當前顯示: ${currentDisplayCurrency}，點擊切換至 ${currentDisplayCurrency === 'TWD' ? 'USD' : 'TWD'}`;
        }
    }
    
    
    function applyTheme() {
        const root = document.documentElement;
        const currentTheme = settings.theme || 'dark';
        root.setAttribute('data-theme', currentTheme);
    }
    
    function updateThemeButton() {
        const icon = document.getElementById('themeIcon');
        const text = document.getElementById('themeText');
        const currentTheme = settings.theme || 'dark';
        
        if(icon && text) {
            if(currentTheme === 'dark') {
                icon.className = 'fas fa-moon';
                text.innerText = '深色模式';
            } else {
                icon.className = 'fas fa-sun';
                text.innerText = '淺色模式';
            }
        }
    }
    
    // 根據主題獲取圖表文字顏色
    // 4. Start the app only after everything is defined
    async function init() {
        // 獲取載入遮罩元素（在整個函數中都可使用）
        const loadingOverlay = document.getElementById('loadingOverlay');
        
        // 確保載入遮罩顯示
        if(loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
            loadingOverlay.style.display = 'flex';
        }
        
        initSidebarState();
        initNumbersState();
        initSwiper();
        initJournalSwipe(); // 初始化記帳詳情的滑動手勢
        applyTheme();
        updateThemeButton();
        updateCurrencyButton();
        chartLevel = 'root';
        currentPage = 0;
        renderAssets();
        
        // 檢查並執行固定轉帳（自動日期匯款）
        checkAndExecuteFixedTransfers();
        // 檢查並執行固定支出、固定收入（當日自動扣款/入帳）
        checkAndExecuteFixedExpenses();
        checkAndExecuteFixedIncomes();
        // 初始化箭頭按鈕狀態
        updatePageNavArrows();
        setTimeout(() => { 
            initChart(); 
            // 初始化時不自動居中，只在用戶切換分頁時才居中
            // 確保圖表在手機模式下正確渲染
            setTimeout(() => {
                if(chartInstance) {
                    const chartWrapper = document.getElementById('chartWrapper');
                    if(chartWrapper) {
                        const wrapperWidth = chartWrapper.clientWidth;
                        const wrapperHeight = chartWrapper.clientHeight;
                        if(wrapperWidth > 0 && wrapperHeight > 0) {
                            chartInstance.setSize(wrapperWidth, wrapperHeight, false);
                            chartInstance.reflow();
                            // 再次確保文字正確顯示
                            setTimeout(() => {
                                if(chartInstance) {
                                    chartInstance.reflow();
                                }
                            }, 100);
                        }
                    }
                }
            }, 200);
        }, 500);
        
        // 監聽窗口大小改變，重新調整圖表
        let resizeTimer;
        let lastWidth = window.innerWidth;
        let lastIsDesktop = window.innerWidth >= 768;
        
        const handleResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const currentWidth = window.innerWidth;
                const currentIsDesktop = currentWidth >= 768;
                const widthChanged = Math.abs(currentWidth - lastWidth) > 50;
                const mediaQueryChanged = lastIsDesktop !== currentIsDesktop;
                
                lastWidth = currentWidth;
                lastIsDesktop = currentIsDesktop;
                
                if(chartInstance) {
                    const chartWrapper = document.getElementById('chartWrapper');
                    const assetChart = document.getElementById('assetChart');
                    if(chartWrapper && assetChart) {
                        // 觸發重排，確保CSS媒體查詢已應用
                        chartWrapper.offsetHeight;
                        assetChart.offsetHeight;
                        
                        // 獲取容器的實際寬度和高度
                        const wrapperWidth = chartWrapper.clientWidth;
                        const wrapperHeight = chartWrapper.clientHeight;
                        
                        // 如果媒體查詢改變或寬度變化較大，需要更徹底地重新渲染
                        if(mediaQueryChanged || widthChanged) {
                            // 強制清除圖表的固定尺寸
                            const svg = chartWrapper.querySelector('svg');
                            if(svg) {
                                svg.removeAttribute('width');
                                svg.removeAttribute('height');
                                svg.style.width = '100%';
                                svg.style.height = '100%';
                                svg.style.maxWidth = '100%';
                            }
                            
                            // 強制設置圖表大小
                            if(wrapperWidth > 0 && wrapperHeight > 0) {
                                chartInstance.setSize(wrapperWidth, wrapperHeight, false);
                            }
                            
                            // 強制重新計算圖表大小
                            chartInstance.reflow();
                            
                            // 多次嘗試確保更新完成
                            requestAnimationFrame(() => {
                                if(chartInstance) {
                                    const newWidth = chartWrapper.clientWidth;
                                    const newHeight = chartWrapper.clientHeight;
                                    if(newWidth > 0 && newHeight > 0) {
                                        chartInstance.setSize(newWidth, newHeight, false);
                                        chartInstance.reflow();
                                        setTimeout(() => {
                                            if(chartInstance) {
                                                const finalWidth = chartWrapper.clientWidth;
                                                const finalHeight = chartWrapper.clientHeight;
                                                if(finalWidth > 0 && finalHeight > 0) {
                                                    chartInstance.setSize(finalWidth, finalHeight, false);
                                                    chartInstance.reflow();
                                                    // 最後一次確保 SVG 尺寸正確
                                                    requestAnimationFrame(() => {
                                                        if(chartInstance) {
                                                            chartInstance.reflow();
                                                            const svg = chartWrapper.querySelector('svg');
                                                            if(svg) {
                                                                svg.style.width = '100%';
                                                                svg.style.height = '100%';
                                                                svg.style.maxWidth = '100%';
                                                            }
                                                        }
                                                    });
                                                }
                                            }
                                        }, 150);
                                    }
                                }
                            });
                        } else {
                            // 小幅度變化，簡單重新計算
                            if(wrapperWidth > 0 && wrapperHeight > 0) {
                                chartInstance.setSize(wrapperWidth, wrapperHeight, false);
                            }
                            chartInstance.reflow();
                            setTimeout(() => {
                                if(chartInstance) {
                                    const newWidth = chartWrapper.clientWidth;
                                    const newHeight = chartWrapper.clientHeight;
                                    if(newWidth > 0 && newHeight > 0) {
                                        chartInstance.setSize(newWidth, newHeight, false);
                                        chartInstance.reflow();
                                    }
                                }
                            }, 100);
                        }
                    }
                }
                // 折線圖：視窗變化時重新渲染以符合顯示尺寸
                if(assetHistoryLineChart && currentChartMode === 'line') {
                    const lineWrapper = document.getElementById('lineChartWrapper');
                    if(lineWrapper && lineWrapper.offsetParent !== null) {
                        const w = lineWrapper.clientWidth;
                        const h = lineWrapper.clientHeight;
                        if(w > 0 && h > 0) {
                            assetHistoryLineChart.setSize(w, h, false);
                            assetHistoryLineChart.reflow();
                        }
                    }
                }
            }, 200);
        };
        
        window.addEventListener('resize', handleResize);
        
        // 監聽窗口大小改變，更新記帳詳情區域高度
        window.addEventListener('resize', () => {
            const detailsContainer = document.getElementById('calendarTransferDetails');
            if(detailsContainer && detailsContainer.style.display !== 'none') {
                updateJournalDetailsHeight();
            }
        });
        
        // 監聽媒體查詢變化（更可靠的方式）
        if(window.matchMedia) {
            const mediaQuery = window.matchMedia('(min-width: 768px)');
            mediaQuery.addEventListener('change', () => {
                handleResize();
            });
        }
        
        await updateRates(); 
        if(settings.apiKey||settings.fugleKey) fetchPrices();
        setInterval(() => { if(isSorting) return; refreshAllData(false); }, 30000);
        
        // 註冊 Service Worker（支援背景執行，僅在 HTTPS 或 localhost 下註冊）
        if('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
            navigator.serviceWorker.register('./service-worker.js')
                .then((registration) => {
                    console.log('Service Worker 註冊成功:', registration.scope);
                    
                    // 監聽 Service Worker 更新
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if(newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                console.log('Service Worker 有新版本可用');
                            }
                        });
                    });
                })
                .catch((error) => {
                    console.log('Service Worker 註冊失敗:', error);
                });
            
            // 監聽來自 Service Worker 的消息（背景備份）
            navigator.serviceWorker.addEventListener('message', (event) => {
                if(event.data && event.data.type === 'BACKGROUND_BACKUP') {
                    console.log('收到背景備份請求');
                    if(settings.cloudBackupEnabled) {
                        performCloudBackup().catch(err => {
                            console.error('背景備份失敗:', err);
                        });
                    }
                }
            });
        }
        
        // 啟動雲端自動備份
        if(settings.cloudBackupEnabled) {
            startCloudBackupTimer();
            // Google Drive：每次開啟 App 自動備份一次
            if(settings.cloudBackupToken === 'google_drive' && settings.driveAccessToken) {
                setTimeout(() => {
                    performCloudBackup().catch(err => console.warn('Google Drive 備份失敗:', err));
                }, 2000);
            }
        }
        
        
        // 初始化選單區塊狀態
        initMenuSections();
        
        // 初始化使用者頭像
        updateUserAvatar();
        
        // 初始化分頁顯示設置
        renderPageVisibilitySettings();
        
        // 初始化時確保 pageOrder 包含所有分頁
        if(pageOrder.length !== PAGE_TYPES.length) {
            // 如果順序不完整，補充缺失的分頁
            PAGE_TYPES.forEach((type, index) => {
                if(!pageOrder.includes(index)) {
                    pageOrder.push(index);
                }
            });
            savePageOrder();
        }
        
        // 重新排列 page-item 的 DOM 順序
        const domIndex = reorderPageItems();
        
        // 渲染分頁指示器
        renderPageIndicator();
        
        // 確保當前分頁是啟用的
        if(!isPageEnabled(currentPage)) {
            const orderedPages = getOrderedPages();
            if(orderedPages.length > 0) {
                switchToPage(orderedPages[0]);
            }
        } else {
            // 方案C：更新當前頁面顯示
            updateActivePageClass();
        }
        
        // 載入完成，等待 Monee 字樣動畫完成後再隱藏載入遮罩
        if(loadingOverlay) {
            // Monee 字樣動畫：1s 動畫時間
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
                // 完全隱藏後移除元素（可選，如果想保留 DOM 可以註解掉）
                setTimeout(() => {
                    loadingOverlay.style.display = 'none';
                    // 首次使用顯示教學（若未看過）
                    if(!localStorage.getItem('monee_tutorial_seen') && typeof openTutorialAssets === 'function') {
                        openTutorialAssets();
                    }
                    if (typeof recordDailyAssetSnapshot === 'function') recordDailyAssetSnapshot();
                    loadTwDividendData().then(() => { if(typeof renderAssets === 'function') renderAssets(); });
                }, 300); // 等待淡出動畫完成
            }, 1000); // 等待 Monee 字樣動畫完成（1s 動畫）
        }
    }
    
    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init);
    }
