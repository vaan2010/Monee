// ====== utils.js ======

    function safeParseFloat(val) { let v = parseFloat(val); return isNaN(v) ? 0 : v; }

    function hexToHue(hex) {
        // 移除 # 符號
        hex = hex.replace('#', '');

        // 轉換為 RGB
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;

        let hue = 0;
        if (delta !== 0) {
            if (max === r) {
                hue = ((g - b) / delta) % 6;
            } else if (max === g) {
                hue = (b - r) / delta + 2;
            } else {
                hue = (r - g) / delta + 4;
            }
        }
        hue = Math.round(hue * 60);
        return hue < 0 ? hue + 360 : hue;
    }

    function calculateTWD(acc) { let val=0; if(acc.isAuto){ let p=acc.currentPrice||0; if(acc.type==='twstock')val=acc.balance*p; else if(acc.currency==='USD')val=acc.balance*p*settings.usdRate; else if(acc.type==='crypto')val=acc.balance*p*settings.usdtRate*settings.usdRate; else val=acc.balance*p*settings.usdRate; } else { if(acc.currency==='USD')val=acc.balance*settings.usdRate; else val=acc.balance; } return safeParseFloat(val); }
    function calculateUSD(acc) { let val=0; if(acc.isAuto){ let p=acc.currentPrice||0; if(acc.type==='twstock')val=acc.balance*p/settings.usdRate; else if(acc.currency==='USD')val=acc.balance*p; else if(acc.type==='crypto')val=acc.balance*p*settings.usdtRate; else val=acc.balance*p; } else { if(acc.currency==='USD')val=acc.balance; else val=acc.balance/settings.usdRate; } return safeParseFloat(val); }
    function calculateValue(acc) { return currentDisplayCurrency === 'USD' ? calculateUSD(acc) : calculateTWD(acc); }
    function calculateDailyPnL_TWD(acc) { if(!acc.isAuto||!acc.dayChange)return 0; let pnl=0; if(acc.type==='twstock')pnl=acc.balance*acc.dayChange; else if(acc.currency==='USD')pnl=acc.balance*acc.dayChange*settings.usdRate; else if(acc.type==='crypto')pnl=acc.balance*acc.dayChange*settings.usdtRate*settings.usdRate; else pnl=acc.balance*acc.dayChange*settings.usdRate; return safeParseFloat(pnl); }
    function calculateDailyPnL_USD(acc) { if(!acc.isAuto||!acc.dayChange)return 0; let pnl=0; if(acc.type==='twstock')pnl=acc.balance*acc.dayChange/settings.usdRate; else if(acc.currency==='USD')pnl=acc.balance*acc.dayChange; else if(acc.type==='crypto')pnl=acc.balance*acc.dayChange*settings.usdtRate; else pnl=acc.balance*acc.dayChange; return safeParseFloat(pnl); }
    function calculateDailyPnL(acc) { return currentDisplayCurrency === 'USD' ? calculateDailyPnL_USD(acc) : calculateDailyPnL_TWD(acc); }
    function calculateCostPnL_TWD(acc) { if(!acc.cost||acc.cost<=0||!acc.isAuto)return 0; let cur=calculateTWD(acc); let cost=acc.type==='twstock'?acc.balance*acc.cost:acc.balance*acc.cost*settings.usdRate; return safeParseFloat(cur-cost); }
    function calculateCostPnL_USD(acc) { if(!acc.cost||acc.cost<=0||!acc.isAuto)return 0; let cur=calculateUSD(acc); let cost=acc.type==='twstock'?acc.balance*acc.cost/settings.usdRate:acc.balance*acc.cost; return safeParseFloat(cur-cost); }
    function calculateCostPnL(acc) { return currentDisplayCurrency === 'USD' ? calculateCostPnL_USD(acc) : calculateCostPnL_TWD(acc); }
    function calculatePnL_TWD(acc) { if(acc.cost>0&&acc.isAuto){ return calculateCostPnL_TWD(acc); } return calculateDailyPnL_TWD(acc); }
    function calculatePnL(acc) { return currentDisplayCurrency === 'USD' ? (acc.cost>0&&acc.isAuto?calculateCostPnL_USD(acc):calculateDailyPnL_USD(acc)) : calculatePnL_TWD(acc); }
    function formatAmount(val) {
        if(currentDisplayCurrency === 'USD') {
            return parseFloat(val).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        } else {
            return Math.round(val).toLocaleString();
        }
    }
    function formatPnL(val) {
        if(!val)return'';
        const sign=val>0?'+':'';
        const cls=val>0?'pnl-up':(val<0?'pnl-down':'');
        const formatted = currentDisplayCurrency === 'USD' ? parseFloat(val).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : Math.round(val).toLocaleString();
        return `<span class="${cls}">${sign}${formatted}</span>`;
    }
