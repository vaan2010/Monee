// ====== api.js ======
// API and data fetching functions extracted from index.html

// ---------- Global State ----------
let twDividendMap = {};

// ---------- TW Dividend Data (TWSE) ----------
async function loadTwDividendData() {
    try {
        const url = 'https://www.twse.com.tw/exchangeReport/TWT48U?response=json';
        let res = await fetch(url);
        if (!res.ok) res = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(url));
        if (!res.ok) return;
        const data = await res.json();
        if (data.stat !== 'OK' || !data.data) return;
        const f = data.fields || [];
        const dateIdx = f.indexOf('除權除息日期');
        const codeIdx = f.indexOf('股票代號');
        const nameIdx = f.indexOf('名稱');
        const cashIdx = f.indexOf('現金股利');
        const stockIdx = f.indexOf('無償配股率');
        twDividendMap = {};
        for (const row of data.data) {
            const code = (row[codeIdx] || '').toString().trim();
            if (!code) continue;
            const dateStr = (row[dateIdx] || '').toString().trim();
            let cashDiv = 0;
            const cashRaw = (row[cashIdx] || '').toString();
            if (!/待公告/i.test(cashRaw)) {
                const n = parseFloat(cashRaw.replace(/\s/g, '').replace(/<[^>]*>/g, ''));
                if (!isNaN(n)) cashDiv = n;
            }
            const stockDiv = parseFloat((row[stockIdx] || '0').toString()) || 0;
            const m = dateStr.match(/(\d+)年(\d+)月(\d+)日/);
            const dateDisplay = m ? (parseInt(m[1], 10) + 1911) + '/' + parseInt(m[2], 10) + '/' + parseInt(m[3], 10) : dateStr;
            twDividendMap[code] = { name: (row[nameIdx] || '').toString().trim(), cashDiv, stockDiv, dateStr: dateDisplay };
        }
    } catch (e) {}
}

// ---------- TW Stock Tickers (Fugle) ----------
let twStockTickersCache = null;
async function fetchTWStockTickers() {
    if(!settings.fugleKey) return [];
    if(twStockTickersCache && twStockTickersCache.length) return twStockTickersCache;
    try {
        const [r1, r2] = await Promise.all([
            fetch(`https://api.fugle.tw/marketdata/v1.0/stock/intraday/tickers?type=EQUITY&exchange=TWSE&isNormal=true`, { headers: {'X-API-KEY': settings.fugleKey} }),
            fetch(`https://api.fugle.tw/marketdata/v1.0/stock/intraday/tickers?type=EQUITY&exchange=TPEx&isNormal=true`, { headers: {'X-API-KEY': settings.fugleKey} })
        ]);
        const j1 = r1.ok ? await r1.json() : { data: [] };
        const j2 = r2.ok ? await r2.json() : { data: [] };
        const list = (j1.data || []).concat(j2.data || []);
        twStockTickersCache = list;
        return list;
    } catch(e) {
        console.error('Failed to fetch TW tickers:', e);
        return [];
    }
}

/** 依名稱或代碼搜尋台股，回傳 { symbol, name } 或 null */
async function searchTWStockByKeyword(keyword) {
    if(!keyword || !settings.fugleKey) return null;
    const k = String(keyword).trim();
    if(/^\d{4}$/.test(k)) {
        const name = await fetchTWStockName(k);
        return name ? { symbol: k, name: name } : null;
    }
    const list = await fetchTWStockTickers();
    const match = list.find(function(item) {
        return (item.name && item.name.indexOf(k) !== -1) || (item.symbol === k);
    });
    return match ? { symbol: match.symbol, name: match.name || match.symbol } : null;
}

async function fetchTWStockName(symbol) {
    if(!settings.fugleKey || !symbol) return null;
    if(!/^\d{4}$/.test(symbol)) return null;
    try {
        const res = await fetch(`https://api.fugle.tw/marketdata/v1.0/stock/intraday/quote/${symbol}`, {
            headers: {'X-API-KEY': settings.fugleKey}
        });
        if (!res.ok) return null;
        const j = await res.json();
        if(j && j.name) return j.name;
        return null;
    } catch(e) {
        console.error('Failed to fetch stock name:', e);
        return null;
    }
}

// ---------- US Stock Profile (Finnhub) ----------
function cleanCompanyName(name) {
    if(!name) return name;
    // 移除常見的公司後綴（不區分大小寫）
    // 處理有逗號的情況：", INC" 或 ", INC."
    name = name.replace(/,\s*(INC|INCORPORATED|CORP|CORPORATION|LTD|LIMITED|LLC|CO|COMPANY|PLC|SA|AG|NV|BV|LP|LLP)\.?$/i, '');
    // 處理沒有逗號的情況：" INC" 或 " INC." 或 "INC"
    name = name.replace(/\s+(INC|INCORPORATED|CORP|CORPORATION|LTD|LIMITED|LLC|CO|COMPANY|PLC|SA|AG|NV|BV|LP|LLP)\.?$/i, '');
    return name.trim();
}

async function fetchUSStockProfile(symbol) {
    if(!settings.apiKey || !symbol) return null;
    try {
        const res = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${settings.apiKey}`);
        if (!res.ok) return null;
        const j = await res.json();
        // 檢查是否回傳空物件（代表查無此股）
        if (Object.keys(j).length === 0) return null;
        return {
            name: cleanCompanyName(j.name) || symbol,
            logo: j.logo || null
        };
    } catch(e) {
        console.error('Failed to fetch US stock profile:', e);
        return null;
    }
}

// ---------- Crypto Logo (CoinCap) ----------
async function fetchCryptoLogo(symbol) {
    if(!symbol) return null;
    try {
        // 清理代號 (移除 USD, USDT 等後綴，CoinCap 只需要純代號)
        const cleanSymbol = symbol.replace('COINBASE:', '').replace('-USD', '').replace('-USDT', '').toUpperCase();
        // 組合 CoinCap 網址 (必須轉小寫)
        const logoUrl = `https://assets.coincap.io/assets/icons/${cleanSymbol.toLowerCase()}@2x.png`;
        // 嘗試載入圖片來驗證是否存在
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(logoUrl);
            img.onerror = () => resolve(null);
            img.src = logoUrl;
        });
    } catch(e) {
        console.error('Failed to fetch crypto logo:', e);
        return null;
    }
}

// ---------- Sync Name From Symbol (UI helper using API) ----------
let nameQueryTimer = null;
async function syncNameFromSymbol() {
    const t=document.getElementById('inpType').value;
    if(t==='stock'||t==='twstock'||t==='crypto'){
        const s=document.getElementById('inpSymbol').value.trim().toUpperCase();
        if(s) {
            if(t==='twstock') {
                document.getElementById('inpName').value = s;
                if(nameQueryTimer) clearTimeout(nameQueryTimer);
                // 支援代碼（4位數字）或名稱（如台積電）查詢
                nameQueryTimer = setTimeout(async () => {
                    const raw = document.getElementById('inpSymbol').value.trim();
                    if(/^\d{4}$/.test(raw)) {
                        const companyName = await fetchTWStockName(raw);
                        if(companyName) document.getElementById('inpName').value = companyName;
                    } else {
                        const found = await searchTWStockByKeyword(raw);
                        if(found) {
                            document.getElementById('inpSymbol').value = found.symbol;
                            document.getElementById('inpName').value = found.name;
                        }
                    }
                }, 800);
            } else if(t==='stock') {
                // 美股：先顯示代號
                document.getElementById('inpName').value = s.replace('COINBASE:','').replace('OKEX:','').replace('-USD','').replace('-USDT','');
                // 清除之前的計時器
                if(nameQueryTimer) clearTimeout(nameQueryTimer);
                // 延遲查詢，避免頻繁請求
                nameQueryTimer = setTimeout(async () => {
                    const profile = await fetchUSStockProfile(s);
                    if(profile && profile.name) {
                        document.getElementById('inpName').value = profile.name;
                        // 儲存 logo URL 到隱藏欄位或直接保存（稍後在 saveAccount 中處理）
                        if(profile.logo) {
                            document.getElementById('inpSymbol').setAttribute('data-logo', profile.logo);
                        }
                    }
                }, 800);
            } else if(t==='crypto') {
                // 加密貨幣：先顯示代號
                document.getElementById('inpName').value=s.replace('COINBASE:','').replace('OKEX:','').replace('-USD','').replace('-USDT','');
                // 清除之前的計時器
                if(nameQueryTimer) clearTimeout(nameQueryTimer);
                // 延遲查詢，避免頻繁請求
                nameQueryTimer = setTimeout(async () => {
                    const logoUrl = await fetchCryptoLogo(s);
                    if(logoUrl) {
                        document.getElementById('inpSymbol').setAttribute('data-logo', logoUrl);
                    }
                }, 800);
            }
        }
    }
}

// ---------- API Key Setting ----------
function setApiKey(t) { if(t==='finnhub'){const k=prompt("Finnhub Key:", settings.apiKey);if(k)settings.apiKey=k.trim();} else if(t==='fugle'){const k=prompt("Fugle Key:", settings.fugleKey);if(k)settings.fugleKey=k.trim();} else {const k=prompt("Gemini Key:", settings.geminiKey);if(k)settings.geminiKey=k.trim();} saveSettings(); refreshAllData(); }

// ---------- Refresh All Data ----------
async function refreshAllData(updateChart = true) { if(isSorting) return; const icon=document.getElementById('refreshIcon'); if(icon) icon.classList.add('fa-spin-fast'); await updateRates(); if(settings.apiKey||settings.fugleKey)await fetchPrices(); if(updateChart && !isSorting) updateChartData(); setTimeout(()=>{if(icon) icon.classList.remove('fa-spin-fast');},500); }

// ---------- Fetch Prices (Finnhub + Fugle) ----------
async function fetchPrices() { const autos=accounts.filter(a=>a.isAuto&&a.symbol); for(let acc of autos){ try{ if(acc.type==='twstock'){ if(!settings.fugleKey)continue; await new Promise(r=>setTimeout(r,150)); const res=await fetch(`https://api.fugle.tw/marketdata/v1.0/stock/intraday/quote/${acc.symbol}`,{headers:{'X-API-KEY':settings.fugleKey}}); const j=await res.json(); if(j){ const price=j.lastPrice||(j.trade&&j.trade.price)||(j.trades&&j.trades[0]&&j.trades[0].price)||0; const changePercent=j.changePercent||(j.trade&&j.trade.changePercent)||0; const prevClose=j.previousClose||(price&&changePercent?price/(1+changePercent/100):price)||price; acc.currentPrice=price; acc.dayChangePercent=changePercent||0; acc.dayChange=(price-prevClose)||0; } } else { if(!settings.apiKey)continue; let sym=acc.symbol; if(acc.type==='crypto'){ if(acc.symbol==='USDT'||acc.symbol==='USDC'){acc.currentPrice=1;acc.dayChange=0;acc.dayChangePercent=0;continue;} if(!sym.includes(':'))sym=`COINBASE:${sym}-USD`; } await new Promise(r=>setTimeout(r,150)); const res=await fetch(`https://finnhub.io/api/v1/quote?symbol=${sym}&token=${settings.apiKey}`); const j=await res.json(); if(j.c){ acc.currentPrice=j.c; acc.dayChange=j.d||0; acc.dayChangePercent=j.dp||0; } } }catch(e){} } saveData(); recordDailyAssetSnapshot(); if(!isSorting){ renderAssets(); } }

// ---------- Query Dividend History (FinMind API) ----------
async function queryDividendHistory(codes) {
    const loadingEl = document.getElementById('dividendModalLoading');
    const listEl = document.getElementById('dividendModalList');
    const emptyEl = document.getElementById('dividendModalEmpty');
    if (codes.length === 0) {
        loadingEl.style.display = 'none';
        emptyEl.style.display = 'block';
        emptyEl.textContent = '目前無台股持股';
        return;
    }
    loadingEl.style.display = 'block';
    listEl.style.display = 'none';
    emptyEl.style.display = 'none';
    const now = new Date();
    const endDate = now.toISOString().slice(0, 10);
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    const startDate = threeMonthsAgo.toISOString().slice(0, 10);
    const items = [];
    for (let i = 0; i < codes.length; i++) {
        const code = codes[i];
        try {
            const url = `${FINMIND_API}?dataset=TaiwanStockDividendResult&data_id=${code}&start_date=${startDate}&end_date=${endDate}`;
            let res = await fetch(url);
            if (!res.ok) res = await fetch(CORS_PROXY_DIV + encodeURIComponent(url));
            if (!res.ok) continue;
            const json = await res.json();
            if (json.data && Array.isArray(json.data)) {
                for (const row of json.data) {
                    const cashDiv = parseFloat(row.stock_and_cache_dividend) || 0;
                    const typeStr = (row.stock_or_cache_dividend || '').toString();
                    if (cashDiv <= 0) continue;
                    if (!/息|除息|權|除權/.test(typeStr)) continue;
                    const dateDisplay = row.date ? row.date.replace(/-/g, '/') : '-';
                    const divDateStr = row.date || '';
                    const acc = accounts.find(a => a.type === 'twstock' && (a.symbol || '').toString().trim() === code);
                    const rec = acc ? (loadDividendRecords()[acc.id] || {}) : {};
                    let useShares = rec.dividendShares;
                    if (useShares === undefined && acc) {
                        const histBal = getTwstockBalanceAtDate(acc.id, divDateStr);
                        useShares = histBal !== null ? histBal : 0;
                    }
                    if (useShares === undefined) useShares = 0;
                    const calcAmt = cashDiv * useShares;
                    items.push({
                        code: row.stock_id || code,
                        name: acc ? (acc.name || code) : (twDividendMap[code]?.name || code),
                        dateStr: dateDisplay,
                        cashDiv,
                        typeStr,
                        shares: useShares,
                        calcAmt,
                        accId: acc ? acc.id : null
                    });
                }
            }
        } catch (e) {}
        if (i % 5 === 0 && i > 0) loadingEl.innerHTML = `<i class="fas fa-spinner fa-spin" style="font-size: 24px; display: block; margin-bottom: 12px;"></i>查詢中 ${i}/${codes.length}...`;
        await new Promise(r => setTimeout(r, 50));
    }
    const seen = new Set();
    const unique = items.filter(it => {
        const key = it.code + '_' + it.dateStr;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
    unique.sort((a, b) => (b.dateStr || '').localeCompare(a.dateStr || ''));
    loadingEl.style.display = 'none';
    if (unique.length === 0) {
        emptyEl.style.display = 'block';
        emptyEl.textContent = '無符合條件的除權除息資料';
    } else {
        listEl.style.display = 'block';
        listEl.innerHTML = unique.map(it => {
            let detail = it.typeStr && /權|除權/.test(it.typeStr) ? `除權 權息值 ${it.cashDiv}` : `每股現金 ${it.cashDiv} 元`;
            const sharesInput = it.accId ? `<div style="margin-top: 8px;"><span style="font-size: 12px; color: var(--text-secondary);">除息時持股：</span><input type="number" min="0" step="1" value="${it.shares}" data-acc-id="${it.accId}" data-cash-div="${it.cashDiv}" onchange="saveDividendHistoryShares(this)" style="width: 80px; padding: 6px 8px; margin-left: 6px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-primary); font-size: 14px;"> 股 <span style="font-size: 13px; color: var(--text-secondary); margin-left: 8px;">× ${it.cashDiv} 元 = NT$ <span class="dividend-amt">${Math.round(it.calcAmt).toLocaleString()}</span></span></div>` : `<div style="font-size: 14px; color: var(--text-secondary); margin-top: 6px;">除息時持股 ${it.shares} 股 × ${it.cashDiv} 元 = NT$ ${Math.round(it.calcAmt).toLocaleString()}</div>`;
            return `
                    <div style="padding: 16px; border-radius: 12px; background: var(--bg-color); margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div><span style="font-size: 16px; font-weight: 600; color: var(--text-primary);">${it.name}</span> <span style="font-size: 13px; color: var(--text-secondary);">${it.code}</span></div>
                            <span style="font-size: 14px; color: var(--text-secondary);">除息日 ${it.dateStr}</span>
                        </div>
                        <div style="font-size: 13px; color: var(--text-secondary); margin-top: 6px;">${detail}</div>
                        ${sharesInput}
                    </div>`;
        }).join('');
    }
}
