// ====== chart.js ======
// Extracted from index.html
// Global variables: lines 1669-1676, 3439-3441
// class ChartAnimationEngine: lines 2130-2570
// function onPointClick: lines 2573-2585
// function showCustomTooltip: lines 2587-2601
// function hideCustomTooltip: line 2603
// function updateChartData: lines 2605-2743
// function enterDetailLevel: lines 2745-2792
// function disableChartHover: lines 2796-2844
// function resetChartLevel: lines 2846-2865
// function initChart: lines 2867-2904
// function toggleChartMode: lines 3446-3489
// function hideLineChartPointTooltip: lines 3492-3498
// function changeLineChartRange: lines 3501-3509
// function showLineChartLoading: lines 3512-3531
// function hideLineChartLoading: lines 3532-3544
// function renderAssetLineChart: lines 3547-3582
// function doRenderLineChart: lines 3584-4021
// function getChartTextColor: lines 6058-6061
// function updateChartTextColor: lines 6063-6110

    // --- Global Chart Variables ---
    let chartInstance = null;
    let chartAnimationEngine = null; // 圖表動畫引擎
    let clickTimer = null;
    let currentDetails = {};
    let chartLevel = 'root';
    let currentDetailAcc = null;

    // ========== 資產歷史快照系統 ==========
    let assetHistoryLineChart = null;
    let currentChartMode = 'pie'; // 'pie' or 'line'
    let currentLineChartRange = 30; // 預設顯示30天

    // --- Chart Animation Engine ---
    class ChartAnimationEngine {
        constructor(chart) {
            this.chart = chart;
            this.isAnimating = false;
            this.animationQueue = [];
            this.currentAnimationFrameId = null;
            this.currentTimeoutIds = [];
        }

        // 取消當前動畫
        cancel() {
            if (this.currentAnimationFrameId !== null) {
                cancelAnimationFrame(this.currentAnimationFrameId);
                this.currentAnimationFrameId = null;
            }
            // 清除所有 setTimeout
            this.currentTimeoutIds.forEach(id => clearTimeout(id));
            this.currentTimeoutIds = [];
            // 清空動畫隊列
            this.animationQueue = [];
            this.isAnimating = false;
        }

        // 主要的動畫方法 - 支持所有場景
        animate(options) {
            const {
                newData,
                animationType = 'switch', // 'switch', 'refresh', 'simulate'
                duration = 800,
                easing = 'easeOutQuart',
                onStart,
                onProgress,
                onComplete
            } = options;

            // 如果正在動畫中，取消當前動畫並立即開始新的動畫
            if (this.isAnimating) {
                this.cancel();
            }

            this.isAnimating = true;
            // 清除之前的動畫ID
            this.currentAnimationFrameId = null;
            this.currentTimeoutIds = [];

            if (onStart) onStart();

            switch (animationType) {
                case 'switch':
                    this.animateSwitch(newData, duration, easing, onProgress, () => {
                        this.isAnimating = false;
                        if (onComplete) onComplete();
                        this.processQueue();
                    });
                    break;

                case 'refresh':
                    this.animateRefresh(newData, duration, easing, onProgress, () => {
                        this.isAnimating = false;
                        if (onComplete) onComplete();
                        this.processQueue();
                    });
                    break;

                case 'simulate':
                    this.animateSimulate(newData, duration, easing, onProgress, () => {
                        this.isAnimating = false;
                        if (onComplete) onComplete();
                        this.processQueue();
                    });
                    break;

                default:
                    this.animateSwitch(newData, duration, easing, onProgress, () => {
                        this.isAnimating = false;
                        if (onComplete) onComplete();
                        this.processQueue();
                    });
            }
        }

        // 分類切換動畫 - 手動步進式動畫（支持不同數量項目）
        animateSwitch(newData, duration, easing, onProgress, onComplete) {
            if (!this.chart || !this.chart.series) {
                if (onComplete) onComplete();
                return;
            }

            // 如果沒有系列，先創建一個空系列以便動畫可以工作
            if (!this.chart.series[0] || this.chart.series[0].data.length === 0) {
                // 使用空數據初始化系列
                this.chart.addSeries({
                    name: '資產',
                    data: newData.map(item => ({ name: item.name, y: 0, color: item.color || '#667eea' })),
                    type: 'pie',
                    innerSize: '55%',
                    size: '90%',
                    center: ['50%', '50%'],
                    borderWidth: 0,
                    slicedOffset: 8,
                    animation: { duration: 0 },
                    dataLabels: { enabled: true },
                    states: { hover: { enabled: false } }
                }, false);
            }

            if (!this.chart.series[0]) {
                if (onComplete) onComplete();
                return;
            }

            // 獲取起始數據（按名稱建立映射）
            const startDataMap = new Map();
            this.chart.series[0].data.forEach(point => {
                startDataMap.set(point.name, {
                    name: point.name,
                    y: point.y,
                    color: point.color || point.options?.color
                });
            });

            // 建立目標數據映射
            const targetDataMap = new Map();
            newData.forEach(item => {
                targetDataMap.set(item.name, {
                    name: item.name,
                    y: item.y,
                    color: item.color
                });
            });

            // 合併所有唯一的項目名稱（起始 + 目標）
            const allNames = new Set([...startDataMap.keys(), ...targetDataMap.keys()]);

            // 建立動畫映射：每個項目都有起始值和目標值
            const animationMap = new Map();
            allNames.forEach(name => {
                const startPoint = startDataMap.get(name) || { name, y: 0, color: targetDataMap.get(name)?.color || '#667eea' };
                const targetPoint = targetDataMap.get(name) || { name, y: 0, color: startPoint.color };
                animationMap.set(name, {
                    start: startPoint.y,
                    target: targetPoint.y,
                    color: targetPoint.color || startPoint.color
                });
            });

            const startTime = performance.now();
            let lastUpdateTime = startTime;
            let frameCount = 0;

            const animate = (currentTime) => {
                // 檢查動畫是否已被取消
                if (!this.isAnimating) {
                    return;
                }
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = this.easeFunctions[easing] ? this.easeFunctions[easing](progress) : progress;

                // 限制更新頻率，避免過於頻繁的重繪（約60fps）
                if (currentTime - lastUpdateTime >= 16) {
                    // 計算每個項目的中間值，按照目標數據的順序排列
                    const intermediateData = [];

                    // 先添加目標數據中存在的項目（按目標順序）
                    newData.forEach(targetItem => {
                        const anim = animationMap.get(targetItem.name);
                        if (anim) {
                            const currentY = anim.start + (anim.target - anim.start) * easedProgress;

                            // 只包含值大於0的項目（避免顯示0值項目）
                            if (currentY > 0.1 || progress >= 1) {
                                intermediateData.push({
                                    name: targetItem.name,
                                    y: Math.max(0, currentY),
                                    color: anim.color
                                });
                            }
                        }
                    });

                    // 再添加只在起始數據中存在的項目（將要消失的項目）
                    allNames.forEach(name => {
                        if (!targetDataMap.has(name) && startDataMap.has(name)) {
                            const anim = animationMap.get(name);
                            const currentY = anim.start + (anim.target - anim.start) * easedProgress;

                            // 只包含值大於0的項目
                            if (currentY > 0.1) {
                                intermediateData.push({
                                    name: name,
                                    y: Math.max(0, currentY),
                                    color: anim.color
                                });
                            }
                        }
                    });

                    // 更新圖表數據，保持起始角度不變
                    try {
                        this.chart.series[0].setData(intermediateData, false);
                        this.chart.redraw(false);
                    } catch (e) {
                        console.error('動畫更新錯誤:', e);
                    }

                    lastUpdateTime = currentTime;
                }

                if (onProgress) onProgress(easedProgress);

                if (progress < 1) {
                    this.currentAnimationFrameId = requestAnimationFrame(animate);
                } else {
                    // 最終更新到精確值（只包含目標數據中存在的項目）
                    try {
                        this.chart.series[0].setData(newData, false);
                        this.chart.redraw(false);
                    } catch (e) {
                        console.error('最終更新錯誤:', e);
                    }
                    if (onProgress) onProgress(1.0);
                    onComplete();
                }
            };

            this.currentAnimationFrameId = requestAnimationFrame(animate);
        }

        // 數據重新整理動畫 - 帶載入效果
        animateRefresh(newData, duration, easing, onProgress, onComplete) {
            // 第一階段：顯示載入狀態 (淡出舊數據)
            this.fadeOutSeries(300, () => {
                // 檢查動畫是否已被取消
                if (!this.isAnimating) {
                    return;
                }
                if (onProgress) onProgress(0.3);

                // 第二階段：數據更新 (隱藏狀態)
                const timeoutId1 = setTimeout(() => {
                    // 檢查動畫是否已被取消
                    if (!this.isAnimating) {
                        return;
                    }
                    if (!this.chart || !this.chart.series || !this.chart.series[0]) {
                        if (onComplete) onComplete();
                        return;
                    }

                    this.chart.series[0].setData(newData, false);
                    this.chart.redraw(false);

                    if (onProgress) onProgress(0.7);

                    // 第三階段：淡入新數據
                    const timeoutId2 = setTimeout(() => {
                        // 檢查動畫是否已被取消
                        if (!this.isAnimating) {
                            return;
                        }
                        this.chart.series[0].setData(newData, true);
                        if (onProgress) onProgress(1.0);
                        const timeoutId3 = setTimeout(() => {
                            if (!this.isAnimating) {
                                return;
                            }
                            onComplete();
                        }, duration + 100);
                        this.currentTimeoutIds.push(timeoutId3);
                    }, 200);
                    this.currentTimeoutIds.push(timeoutId2);
                }, 200);
                this.currentTimeoutIds.push(timeoutId1);
            });
        }

        // 數據變化模擬動畫 - 步進式更新（支持不同數量的項目）
        animateSimulate(targetData, totalDuration, easing, onProgress, onComplete) {
            if (!this.chart || !this.chart.series || !this.chart.series[0]) {
                if (onComplete) onComplete();
                return;
            }

            // 獲取起始數據（按名稱建立映射）
            const startDataMap = new Map();
            this.chart.series[0].data.forEach(point => {
                startDataMap.set(point.name, {
                    name: point.name,
                    y: point.y,
                    color: point.color || point.options?.color
                });
            });

            // 建立目標數據映射
            const targetDataMap = new Map();
            targetData.forEach(item => {
                targetDataMap.set(item.name, {
                    name: item.name,
                    y: item.y,
                    color: item.color
                });
            });

            // 合併所有唯一的項目名稱（起始 + 目標）
            const allNames = new Set([...startDataMap.keys(), ...targetDataMap.keys()]);

            // 建立動畫映射：每個項目都有起始值和目標值
            const animationMap = new Map();
            allNames.forEach(name => {
                const startPoint = startDataMap.get(name) || { name, y: 0, color: targetDataMap.get(name)?.color || '#667eea' };
                const targetPoint = targetDataMap.get(name) || { name, y: 0, color: startPoint.color };
                animationMap.set(name, {
                    start: startPoint.y,
                    target: targetPoint.y,
                    color: targetPoint.color || startPoint.color
                });
            });

            const steps = 15;
            const stepDuration = totalDuration / steps;
            let currentStep = 0;

            const animateStep = () => {
                // 檢查動畫是否已被取消
                if (!this.isAnimating) {
                    return;
                }

                currentStep++;
                const progress = currentStep / steps;
                const easedProgress = this.easeFunctions[easing](progress);

                // 計算每個項目的中間值
                const intermediateData = [];
                allNames.forEach(name => {
                    const anim = animationMap.get(name);
                    const currentY = anim.start + (anim.target - anim.start) * easedProgress;

                    // 只包含值大於0的項目（避免顯示0值項目）
                    if (currentY > 0.1 || currentStep === steps) {
                        intermediateData.push({
                            name: name,
                            y: Math.max(0, currentY),
                            color: anim.color
                        });
                    }
                });

                // 更新圖表（無動畫，避免閃爍）
                try {
                    this.chart.series[0].setData(intermediateData, false);
                    this.chart.redraw(false);
                } catch (e) {
                    console.error('動畫更新錯誤:', e);
                }

                if (onProgress) onProgress(easedProgress);

                if (currentStep < steps) {
                    const timeoutId = setTimeout(animateStep, stepDuration);
                    this.currentTimeoutIds.push(timeoutId);
                } else {
                    // 檢查動畫是否已被取消
                    if (!this.isAnimating) {
                        return;
                    }
                    // 最終更新到精確值（只包含目標數據中存在的項目）
                    try {
                        this.chart.series[0].setData(targetData, false);
                        this.chart.redraw(false);
                    } catch (e) {
                        console.error('最終更新錯誤:', e);
                    }
                    onComplete();
                }
            };

            animateStep();
        }

        // 淡出系列
        fadeOutSeries(duration, callback) {
            const series = this.chart.series[0];
            if (!series) {
                if (callback) callback();
                return;
            }

            // 動畫淡出
            series.points.forEach(point => {
                if (point.graphic) {
                    point.graphic.animate({
                        opacity: 0
                    }, {
                        duration: duration,
                        easing: 'easeOut'
                    });
                }
            });

            // 同時淡出標籤
            if (series.dataLabelsGroup) {
                series.dataLabelsGroup.animate({
                    opacity: 0
                }, {
                    duration: duration,
                    easing: 'easeOut'
                });
            }

            const timeoutId = setTimeout(() => {
                if (callback) callback();
            }, duration);
            this.currentTimeoutIds.push(timeoutId);
        }

        // Easing 函數
        easeFunctions = {
            linear: t => t,
            easeIn: t => t * t,
            easeOut: t => t * (2 - t),
            easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            easeOutQuart: t => 1 - Math.pow(1 - t, 4),
            easeInQuart: t => t * t * t * t,
            bounce: t => {
                if (t < 1/2.75) return 7.5625 * t * t;
                if (t < 2/2.75) return 7.5625 * (t -= 1.5/2.75) * t + 0.75;
                if (t < 2.5/2.75) return 7.5625 * (t -= 2.25/2.75) * t + 0.9375;
                return 7.5625 * (t -= 2.625/2.75) * t + 0.984375;
            }
        };

        // 處理動畫隊列
        processQueue() {
            if (this.animationQueue.length > 0) {
                const nextAnimation = this.animationQueue.shift();
                this.animate(nextAnimation);
            }
        }
    }

    // --- Chart ---
    function onPointClick(e) {
        e.stopPropagation();
        if (clickTimer) {
            clearTimeout(clickTimer); clickTimer = null;
            if((chartLevel==='root' || currentPage === 0) && currentDetails[this.drilldown]){
                hideCustomTooltip();
                enterDetailLevel(this.drilldown, currentDetails[this.drilldown]);
            }
        } else {
            let t=this; let ex=e;
            clickTimer=setTimeout(function(){ clickTimer=null; activeInactivePoints.clear(); if(t.sliced){ if(typeof t.slice === 'function'){ t.slice(false); } t.setState('normal'); const prevPointEl = t.graphic?.element; if(prevPointEl) { prevPointEl.style.setProperty('opacity', '1', 'important'); } if(t.series.data) t.series.data.forEach(p=>{ if(p!==t) { p.setState('normal'); const pEl = p.graphic?.element; if(pEl) pEl.style.setProperty('opacity', '1', 'important'); } }); hideCustomTooltip(); } else { if(t.series.data) { t.series.data.forEach(p=>{ if(p!==t){ if(p.sliced) { if(typeof p.slice === 'function'){ p.slice(false); } p.setState('inactive'); const pointEl = p.graphic?.element; if(pointEl) { const pointId = pointEl.getAttribute('data-highcharts-point-index') || pointEl.getAttribute('class') || `point-${p.index}`; activeInactivePoints.add(pointId); pointEl.style.setProperty('opacity', '0.3', 'important'); } } else { p.setState('inactive'); const pointEl = p.graphic?.element; if(pointEl) { const pointId = pointEl.getAttribute('data-highcharts-point-index') || pointEl.getAttribute('class') || `point-${p.index}`; activeInactivePoints.add(pointId); pointEl.style.setProperty('opacity', '0.3', 'important'); } } } }); } if(typeof t.slice === 'function'){ t.slice(true); } t.setState('normal'); const newPointEl = t.graphic?.element; if(newPointEl) { newPointEl.style.setProperty('opacity', '1', 'important'); } showCustomTooltip(t, ex); } }, 250);
        }
    }

    function showCustomTooltip(p,e){
        const t=document.getElementById('customTooltip');
        const w=document.getElementById('chartWrapper');
        t.querySelector('.tt-header').innerText=p.name;
        const formattedAmount = currentDisplayCurrency === 'USD' ? parseFloat(p.y).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : Math.round(p.y).toLocaleString();
        t.querySelector('.tt-body').innerHTML=`<span class="tt-dot" style="background-color:${p.color}"></span>資產: ${formattedAmount} ${currentDisplayCurrency}`;
        t.className=''; t.style.display='block';
        let cx=e.chartX; let cy=e.chartY;
        if(!cx&&e.clientX){const r=w.getBoundingClientRect();cx=e.clientX-r.left;cy=e.clientY-r.top;}
        const tw=t.offsetWidth; const th=t.offsetHeight;
        let top=cy-th-25; let left=cx;
        if(cy<160){top=cy+30;t.classList.add('bottom');}else{t.classList.remove('bottom');}
        if(left<tw/2)left=tw/2+10; if(left>w.offsetWidth-tw/2)left=w.offsetWidth-tw/2-10;
        t.style.top=top+'px'; t.style.left=left+'px';
    }

    function hideCustomTooltip(){ document.getElementById('customTooltip').style.display='none'; }

    function updateChartData(animate = true) {
        if(typeof Highcharts === 'undefined') return;
        let groups={'bank':0,'stock':0,'twstock':0,'crypto':0};
        currentDetails={'bank':[],'stock':[],'twstock':[],'crypto':[]};

        accounts.forEach(acc=>{
            if(acc.type==='debt')return;
            // 排除信用卡（不納入資產分佈）
            if(acc.type === 'bank' && acc.bankTag === '信用卡') return;
            // 只計算啟用分頁的資產
            if(acc.type === 'bank' && !pageVisibility['bank']) return;
            if(acc.type === 'stock' && !pageVisibility['stock']) return;
            if(acc.type === 'twstock' && !pageVisibility['twstock']) return;
            if(acc.type === 'crypto' && !pageVisibility['crypto']) return;

            let val=calculateValue(acc);
            if(val>0){
                if(groups[acc.type]!==undefined){
                    groups[acc.type]+=val;
                    // 美股顯示代碼，台股顯示公司名稱
                    let displayName = acc.name;
                    if(acc.type === 'stock') {
                        let sym = acc.symbol.replace('COINBASE:','').replace('OKEX:','').replace('-USD','').replace('-USDT','');
                        displayName = sym || acc.name;
                    }
                    currentDetails[acc.type].push({name:displayName,y:currentDisplayCurrency === 'USD' ? parseFloat(val) : Math.round(val)});
                }
            }
        });

        // 根據當前分頁和圖表層級決定顯示的數據
        let chartData = [];
        let chartTitle = '';

        if(chartLevel === 'root' || (chartLevel === 'page' && currentPage === 0)) {
            // 總覽分頁：依 pageOrder 顯示各類別，使用各分類主題的第一個顏色（與其他圓餅圖一致）
            const orderedCategoryTypes = pageOrder
                .filter(index => index !== 0)
                .map(index => PAGE_TYPES[index])
                .filter(type => pageVisibility[type] !== false);
            chartData = orderedCategoryTypes.map(type => ({
                name: TYPE_NAMES[type],
                y: Math.round(groups[type] || 0),
                drilldown: type,
                color: OVERVIEW_COLORS[type] || CHART_ITEM_COLORS_FALLBACK[0]
            })).filter(d => d.y > 0);
            chartTitle = '';
        } else if(chartLevel === 'page' && currentPage > 0) {
            // 分頁模式：顯示當前分頁類別內的資產分布
            const currentType = PAGE_TYPES[currentPage];
            // 使用該分類專屬的色系（循環使用）
            const colorPalette = CHART_ITEM_COLOR_PALETTES[currentType] || CHART_ITEM_COLORS_FALLBACK;
            chartData = (currentDetails[currentType] || []).map((item, index) => {
                return {
                    ...item,
                    color: colorPalette[index % colorPalette.length]
                };
            });
            chartTitle = PAGE_NAMES[currentPage];
        } else if(chartLevel === 'detail') {
            // 詳細模式：已經在enterDetailLevel中處理，不在此更新
            return;
        }

        // 禁用 Highcharts 內建動畫，使用自定義動畫引擎
        const animationConfig = {duration:0};

        // 處理空數據：如果沒有數據且已有圖表實例，清除圖表
        if (chartData.length === 0 && chartInstance) {
            // 取消當前動畫
            if (chartAnimationEngine && chartAnimationEngine.isAnimating) {
                chartAnimationEngine.cancel();
            }
            // 清除標題
            if (chartInstance) {
                chartInstance.setTitle({text:'',style:{color:'#fff',fontSize:'14px'},align:'center',verticalAlign:'middle',y:10});
                // 清除所有系列
                while(chartInstance.series.length > 0) {
                    chartInstance.series[0].remove(false);
                }
                chartInstance.redraw();
            }
            return;
        }

        if(!chartInstance){
            // 如果沒有數據，不創建圖表
            if (chartData.length === 0) {
                return;
            }
            const chartTextColor = getChartTextColor();
            chartInstance=Highcharts.chart('assetChart',{
                chart:{type:'pie',backgroundColor:'transparent',spacing:[30,20,20,20],height:'100%',width:null,reflow:true,margin:[30,20,20,20]},
                title:{text:chartTitle,style:{color:chartTextColor,fontSize:'14px'},align:'center',verticalAlign:'middle',y:10},
                credits:{enabled:false},tooltip:{enabled:false},
                plotOptions:{pie:{innerSize:'55%',size:'90%',center:['50%','50%'],borderWidth:0,slicedOffset:8,animation:animationConfig,dataLabels:{enabled:true,distance:3,format:'{point.name}<br><span style="opacity:0.7">{point.percentage:.1f}%</span>',style:{color:chartTextColor,textOutline:'none',fontWeight:'normal',fontSize:'12px',pointerEvents:'none'},connectorColor:'#666',softConnector:true},states:{hover:{enabled:false,halo:{size:0},opacity:1,brightness:0},inactive:{opacity:0.3}},point:{states:{hover:{enabled:false,halo:{size:0},opacity:1,brightness:0}},events:{click:onPointClick}}}},
                series:[{name:'資產',data:chartData}]
            });
            disableChartHover();
            // 初始化動畫引擎
            if (!chartAnimationEngine && chartInstance) {
                chartAnimationEngine = new ChartAnimationEngine(chartInstance);
            }
        } else {
            if(chartLevel==='root' || (chartLevel==='page' && (currentPage === 0 || currentPage > 0))){
                const chartTextColor = getChartTextColor();
                chartInstance.setTitle({text:chartTitle,style:{color:chartTextColor,fontSize:'14px'},align:'center',verticalAlign:'middle',y:10});

                if(chartInstance.series.length===0){
                    chartInstance.addSeries({name:'資產',data:chartData,type:'pie',innerSize:'55%',size:'90%',center:['50%','50%'],borderWidth:0,slicedOffset:8,animation:{duration:0},dataLabels:{enabled:true,distance:3,format:'{point.name}<br><span style="opacity:0.7">{point.percentage:.1f}%</span>',style:{color:chartTextColor,textOutline:'none',fontWeight:'normal',fontSize:'12px',pointerEvents:'none'},connectorColor:'#666'},states:{hover:{enabled:false,halo:{size:0},opacity:1,brightness:0},inactive:{opacity:0.3}},point:{states:{hover:{enabled:false,halo:{size:0},opacity:1,brightness:0}},events:{click:onPointClick}}}, false);
                    disableChartHover();
                    // 初始化動畫引擎
                    if (!chartAnimationEngine) {
                        chartAnimationEngine = new ChartAnimationEngine(chartInstance);
                    }
                } else {
                    // 使用動畫引擎更新圖表
                    if (chartAnimationEngine && animate) {
                        chartAnimationEngine.animate({
                            newData: chartData,
                            animationType: CHART_ANIMATION_CONFIG.animationType,
                            duration: CHART_ANIMATION_CONFIG.duration,
                            easing: CHART_ANIMATION_CONFIG.easing,
                            onComplete: () => {
                                // 更新圖表大小
                                chartInstance.series[0].update({size:'90%'}, false);
                            }
                        });
                    } else {
                        // 沒有動畫或動畫引擎未初始化，直接更新
                        chartInstance.series[0].setData(chartData, false);
                        chartInstance.series[0].update({size:'90%'}, false);
                    }
                }
            } else if(chartLevel === 'detail') {
                // 詳細模式不在此更新，由enterDetailLevel處理
            }
        }
    }

    function enterDetailLevel(cat, data) {
        chartLevel='detail';
        hideCustomTooltip();

        // 切換到對應的分頁（總覽是0，所以類別分頁要+1）
        const pageIndex = PAGE_TYPES.indexOf(cat);
        if(pageIndex > 0) {
            switchToPage(pageIndex);
        }

        // 準備數據（使用該分類專屬的色系）
        const colorPalette = CHART_ITEM_COLOR_PALETTES[cat] || CHART_ITEM_COLORS_FALLBACK;
        const formattedData = data.map((item, index) => ({
            name: item.name,
            y: item.y,
            color: item.color || colorPalette[index % colorPalette.length]
        }));

        if(chartInstance.series[0]) {
            // 使用動畫引擎進行切換
            if (chartAnimationEngine) {
                chartAnimationEngine.animate({
                    newData: formattedData,
                    animationType: CHART_ANIMATION_CONFIG.animationType,
                    duration: CHART_ANIMATION_CONFIG.duration,
                    easing: CHART_ANIMATION_CONFIG.easing,
                    onComplete: () => {
                        const chartTextColor = getChartTextColor();
                    chartInstance.setTitle({text:TYPE_NAMES[cat],style:{color:chartTextColor,fontSize:'14px'},align:'center',verticalAlign:'middle',y:10});
                        disableChartHover();
                    }
                });
            } else {
                // 如果動畫引擎未初始化，直接更新
                const chartTextColor = getChartTextColor();
                chartInstance.series[0].remove(false);
                chartInstance.addSeries({ name:TYPE_NAMES[cat]||cat, data:formattedData, type:'pie', innerSize:'55%', size:'90%', center:['50%','50%'], borderWidth:0, slicedOffset:8, animation:{duration:CHART_ANIMATION_CONFIG.duration,easing:CHART_ANIMATION_CONFIG.easing}, colorByPoint:true, dataLabels:{enabled:true,distance:3,format:'{point.name}<br><span style="opacity:0.7">{point.percentage:.1f}%</span>',style:{color:chartTextColor,textOutline:'none',fontWeight:'normal',fontSize:'12px',pointerEvents:'none'},connectorColor:'#666'}, states:{hover:{enabled:false,halo:{size:0},opacity:1,brightness:0},inactive:{opacity:0.3}}, point:{states:{hover:{enabled:false,halo:{size:0},opacity:1,brightness:0}},events:{click:onPointClick}} }, true);
                chartInstance.setTitle({text:TYPE_NAMES[cat],style:{color:chartTextColor,fontSize:'14px'},align:'center',verticalAlign:'middle',y:10});
                disableChartHover();
            }
        } else {
            // 如果沒有系列，直接添加
            const chartTextColor = getChartTextColor();
            chartInstance.addSeries({ name:TYPE_NAMES[cat]||cat, data:formattedData, type:'pie', innerSize:'55%', size:'90%', center:['50%','50%'], borderWidth:0, slicedOffset:8, animation:{duration:0}, colorByPoint:true, dataLabels:{enabled:true,distance:3,format:'{point.name}<br><span style="opacity:0.7">{point.percentage:.1f}%</span>',style:{color:chartTextColor,textOutline:'none',fontWeight:'normal',fontSize:'12px',pointerEvents:'none'},connectorColor:'#666'}, states:{hover:{enabled:false,halo:{size:0},opacity:1,brightness:0},inactive:{opacity:0.3}}, point:{states:{hover:{enabled:false,halo:{size:0},opacity:1,brightness:0}},events:{click:onPointClick}} }, false);
            chartInstance.setTitle({text:TYPE_NAMES[cat],style:{color:chartTextColor,fontSize:'14px'},align:'center',verticalAlign:'middle',y:10});
            disableChartHover();
        }
    }

    let hoverCheckInterval = null;
    let activeInactivePoints = new Set();
    function disableChartHover() {
        if(!chartInstance) return;
        if(hoverCheckInterval) clearInterval(hoverCheckInterval);
        const forceResetStyle = function() {
            const points = document.querySelectorAll('#chartWrapper .highcharts-point');
            points.forEach(point => {
                const pointId = point.getAttribute('data-highcharts-point-index') || point.getAttribute('class');
                if(activeInactivePoints.has(pointId)) return;
                point.style.transition = 'none';
                const computedStyle = window.getComputedStyle(point);
                const computedOpacity = parseFloat(computedStyle.opacity);
                if(computedOpacity !== 1 && computedOpacity !== 0.3) {
                    point.style.setProperty('opacity', '1', 'important');
                }
                if(computedOpacity === 0.3) {
                    activeInactivePoints.add(pointId);
                }
                if(computedStyle.filter && computedStyle.filter !== 'none' && computedStyle.filter !== 'brightness(1)' && computedOpacity !== 0.3) {
                    point.style.setProperty('filter', 'brightness(1)', 'important');
                }
            });
            const chartTextColor = getChartTextColor();
            const dataLabels = document.querySelectorAll('#chartWrapper .highcharts-data-label, #chartWrapper .highcharts-data-label text');
            dataLabels.forEach(label => {
                label.style.setProperty('opacity', '1', 'important');
                if(label.tagName === 'text') {
                    label.style.setProperty('fill', chartTextColor, 'important');
                }
            });
        };
        setTimeout(() => {
            const points = document.querySelectorAll('#chartWrapper .highcharts-point');
            points.forEach(point => {
                const pointId = point.getAttribute('data-highcharts-point-index') || point.getAttribute('class');
                point.style.transition = 'none';
                const resetStyle = function() {
                    const id = this.getAttribute('data-highcharts-point-index') || this.getAttribute('class');
                    const computedOpacity = parseFloat(window.getComputedStyle(this).opacity);
                    if(computedOpacity !== 0.3 && !activeInactivePoints.has(id)) {
                        this.style.setProperty('opacity', '1', 'important');
                        this.style.setProperty('filter', 'brightness(1)', 'important');
                    }
                };
                point.addEventListener('mouseenter', resetStyle, {capture: true, passive: false});
                point.addEventListener('mouseover', resetStyle, {capture: true, passive: false});
            });
            hoverCheckInterval = setInterval(forceResetStyle, 16);
        }, 100);
    }

    function resetChartLevel() {
        activeInactivePoints.clear();
        const previousLevel = chartLevel;
        if(chartLevel === 'detail') {
            // 從詳細模式返回，根據當前分頁決定
            chartLevel = currentPage === 0 ? 'root' : 'page';
        } else {
            chartLevel = currentPage === 0 ? 'root' : 'page';
        }
        hideCustomTooltip();

        // 確保動畫引擎已初始化
        if (chartInstance && !chartAnimationEngine) {
            chartAnimationEngine = new ChartAnimationEngine(chartInstance);
        }

        // 使用動畫切換（動畫引擎會自動處理沒有起始數據的情況）
        updateChartData(true);
        disableChartHover();
    }

    function initChart() {
        if(typeof Highcharts==='undefined')return;
        Highcharts.setOptions({chart:{style:{fontFamily:'sans-serif'},events:{click:function(e){if(clickTimer){clearTimeout(clickTimer);clickTimer=null;}activeInactivePoints.clear();if(this.series[0]){this.series[0].points.forEach(p=>{if(typeof p.slice === 'function'){p.slice(false);}p.setState('normal');const pEl = p.graphic?.element;if(pEl) pEl.style.setProperty('opacity', '1', 'important');});}hideCustomTooltip();}}},title:{text:''},tooltip:{enabled:false},plotOptions:{pie:{states:{hover:{enabled:false,halo:{size:0},opacity:1,brightness:0}},point:{states:{hover:{enabled:false,halo:{size:0},opacity:1,brightness:0}}}}}});
        updateChartData();
        // 確保圖表在初始化時正確渲染，特別是手機模式
        setTimeout(() => {
            if(chartInstance) {
                // 初始化動畫引擎
                if (!chartAnimationEngine && chartInstance) {
                    chartAnimationEngine = new ChartAnimationEngine(chartInstance);
                }

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
        }, 300);
        document.getElementById('chartWrapper').addEventListener('click',function(e){const t=e.target;if(t.tagName!=='path'&&!t.closest('.highcharts-point')&&chartInstance){if(clickTimer)clearTimeout(clickTimer);activeInactivePoints.clear();if(chartInstance.series[0]){chartInstance.series[0].points.forEach(p=>{if(typeof p.slice === 'function'){p.slice(false);}p.setState('normal');const pEl = p.graphic?.element;if(pEl) pEl.style.setProperty('opacity', '1', 'important');});}hideCustomTooltip();}});
        // 只有點擊折線圖「外」的區域才隱藏標籤；點擊折線圖內會由 chart.events.click 顯示
        document.addEventListener('click', function(e) {
            const tooltipEl = document.getElementById('lineChartPointTooltip');
            if(!tooltipEl || tooltipEl.style.display !== 'block') return;
            if(e.target.closest('#lineChartWrapper')) return; // 點擊在折線圖內不隱藏
            hideLineChartPointTooltip();
        });
    }

    // 切換圖表模式（圓餅圖 ↔ 折線圖）
    function toggleChartMode() {
        const pieWrapper = document.getElementById('chartWrapper');
        const lineWrapper = document.getElementById('lineChartWrapper');
        const rangeSelector = document.getElementById('lineChartRangeSelector');
        const toggleBtn = document.getElementById('chartModeToggleBtn');
        const toggleIcon = document.getElementById('chartModeIcon');

        if(currentChartMode === 'pie') {
            currentChartMode = 'line';
            pieWrapper.style.display = 'none';
            lineWrapper.style.display = 'block';
            rangeSelector.style.display = 'flex';
            const growthEl = document.getElementById('lineChartGrowthRate');
            if(growthEl) growthEl.style.display = 'block';
            // 同步時間範圍按鈕的 active 狀態
            document.querySelectorAll('#lineChartRangeSelector .range-btn').forEach(btn => {
                btn.classList.toggle('active', parseInt(btn.getAttribute('data-range')) === currentLineChartRange);
            });
            toggleBtn.classList.add('active');
            toggleIcon.className = 'fas fa-chart-pie';
            toggleBtn.title = '切換為圓餅圖';
            // 延遲渲染，確保 lineChartWrapper 已取得正確尺寸
            requestAnimationFrame(() => {
                requestAnimationFrame(() => renderAssetLineChart());
            });
        } else {
            currentChartMode = 'pie';
            pieWrapper.style.display = 'flex';
            lineWrapper.style.display = 'none';
            rangeSelector.style.display = 'none';
            const growthEl = document.getElementById('lineChartGrowthRate');
            if(growthEl) growthEl.style.display = 'none';
            hideLineChartPointTooltip();
            toggleBtn.classList.remove('active');
            toggleIcon.className = 'fas fa-chart-line';
            toggleBtn.title = '切換為折線圖';
            // 重新 reflow 圓餅圖
            if(chartInstance) {
                setTimeout(() => {
                    chartInstance.reflow();
                }, 100);
            }
        }
    }

    // 隱藏折線圖點擊標籤（點選其他地方時呼叫）
    function hideLineChartPointTooltip() {
        const tooltipEl = document.getElementById('lineChartPointTooltip');
        if(tooltipEl) {
            tooltipEl.style.display = 'none';
            clearTimeout(window._lineChartTooltipTimer);
        }
    }

    // 切換折線圖時間範圍
    function changeLineChartRange(days) {
        currentLineChartRange = days;
        hideLineChartPointTooltip();
        // 更新按鈕狀態
        document.querySelectorAll('#lineChartRangeSelector .range-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.getAttribute('data-range')) === days);
        });
        renderAssetLineChart();
    }

    // 折線圖載入遮罩：顯示/隱藏，durationMs 為進度條總時長（毫秒）
    function showLineChartLoading(text, durationMs) {
        const overlay = document.getElementById('lineChartLoadingOverlay');
        const bar = document.getElementById('lineChartLoadingBar');
        const textEl = overlay ? overlay.querySelector('.loading-text') : null;
        if(overlay) {
            if(textEl) textEl.textContent = text || '載入中...';
            overlay.style.display = 'flex';
            if(bar) bar.style.width = '0%';
            const duration = durationMs || 800;
            const interval = 50;
            const step = (100 / duration) * interval;
            let p = 0;
            const tid = setInterval(() => {
                p += step;
                if(p >= 100) { p = 100; clearInterval(tid); }
                if(bar) bar.style.width = Math.min(p, 100) + '%';
            }, interval);
            overlay._loadingTimer = tid;
        }
    }
    function hideLineChartLoading() {
        const overlay = document.getElementById('lineChartLoadingOverlay');
        const bar = document.getElementById('lineChartLoadingBar');
        if(overlay && overlay._loadingTimer) {
            clearInterval(overlay._loadingTimer);
            overlay._loadingTimer = null;
        }
        if(bar) bar.style.width = '100%';
        setTimeout(() => {
            if(overlay) overlay.style.display = 'none';
            if(bar) bar.style.width = '0%';
        }, 200);
    }

    // 渲染資產折線圖
    function renderAssetLineChart() {
        if(typeof Highcharts === 'undefined') return;

        let history = loadAssetHistory();
        let dates = Object.keys(history).sort();

        // 若無歷史但有資產，先嘗試記錄今日快照（僅在此時顯示載入進度條，1秒）
        if(dates.length === 0 && accounts && accounts.length > 0) {
            showLineChartLoading('正在取得今日資產快照...', 1000);
            recordDailyAssetSnapshot();
            history = loadAssetHistory();
            dates = Object.keys(history).sort();
            setTimeout(() => {
                hideLineChartLoading();
                if(dates.length === 0) {
                    const container = document.getElementById('assetLineChart');
                    if(container) {
                        container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-secondary);font-size:14px;text-align:center;padding:20px;">尚無歷史資料<br><span style="font-size:12px;opacity:0.7;">資料會在每次更新價格時自動記錄</span></div>';
                    }
                } else {
                    doRenderLineChart(history, dates);
                }
            }, 1000);
            return;
        }

        if(dates.length === 0) {
            const container = document.getElementById('assetLineChart');
            if(container) {
                container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-secondary);font-size:14px;text-align:center;padding:20px;">尚無歷史資料<br><span style="font-size:12px;opacity:0.7;">資料會在每次更新價格時自動記錄</span></div>';
            }
            return;
        }

        doRenderLineChart(history, dates);
    }

    function doRenderLineChart(history, dates) {
        if(typeof Highcharts === 'undefined') return;

        // 生成完整日期範圍（從 cutoff 到今天，每天）
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        let cutoffStr;
        if(currentLineChartRange > 0) {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - currentLineChartRange);
            cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth()+1).padStart(2,'0')}-${String(cutoff.getDate()).padStart(2,'0')}`;
        } else {
            cutoffStr = dates.length > 0 ? dates[0] : todayStr;
        }

        // 建立完整日期陣列（每天一筆）
        const fullDateRange = [];
        const d = new Date(cutoffStr);
        const endD = new Date(todayStr);
        while(d <= endD) {
            fullDateRange.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
            d.setDate(d.getDate() + 1);
        }

        // 填充缺失日期：某天沒開 App 則延續前一天的數值
        const filledHistory = {};
        let lastKnown = null;
        // 若範圍第一天之前有歷史，用最近一筆作為起始
        const beforeRange = dates.filter(d => d < cutoffStr);
        if(beforeRange.length > 0) {
            lastKnown = history[beforeRange[beforeRange.length - 1]];
        }
        for(const dateStr of fullDateRange) {
            if(history[dateStr]) {
                lastKnown = history[dateStr];
            }
            if(lastKnown) {
                filledHistory[dateStr] = lastKnown;
            }
        }

        let filteredDates = Object.keys(filledHistory).sort();
        if(filteredDates.length === 0) {
            filteredDates = dates.length > 0 ? dates.slice(-1) : [todayStr];
        }

        // 點距優化：90天/1年等資料過多時，採樣至約35點，保持與30天相近的視覺密度
        const TARGET_POINTS = 35;
        let chartDates = filteredDates;
        if(filteredDates.length > TARGET_POINTS) {
            chartDates = [];
            const step = (filteredDates.length - 1) / (TARGET_POINTS - 1);
            for(let i = 0; i < TARGET_POINTS; i++) {
                const idx = Math.min(Math.round(i * step), filteredDates.length - 1);
                chartDates.push(filteredDates[idx]);
            }
            chartDates[chartDates.length - 1] = filteredDates[filteredDates.length - 1]; // 確保最後一天
        }

        // 準備各系列資料
        // 為了讓折線從0垂直上升：使用 [0,0] 與 [0,value] 同 x 形成垂直線（非斜線）
        const allSeriesConfig = [
            { key: 'total', name: '總資產', color: '#ffffff', dashStyle: 'Solid', lineWidth: 2.5, zIndex: 5 },
            { key: 'bank', name: '錢包', color: TYPE_COLORS.bank, dashStyle: 'Solid', lineWidth: 1.5, zIndex: 4 },
            { key: 'stock', name: '美股', color: TYPE_COLORS.stock, dashStyle: 'Solid', lineWidth: 1.5, zIndex: 3 },
            { key: 'twstock', name: '台股', color: TYPE_COLORS.twstock, dashStyle: 'Solid', lineWidth: 1.5, zIndex: 2 },
            { key: 'crypto', name: '加密貨幣', color: TYPE_COLORS.crypto, dashStyle: 'Solid', lineWidth: 1.5, zIndex: 1 }
        ];

        // 根據當前分頁篩選要顯示的系列
        let seriesConfig;
        if(currentPage === 0) {
            // 總覽：只顯示總資產折線
            seriesConfig = allSeriesConfig.filter(cfg => cfg.key === 'total');
        } else {
            // 其他分頁：只顯示該分類
            const currentType = PAGE_TYPES[currentPage];
            seriesConfig = allSeriesConfig.filter(cfg => cfg.key === currentType);
            // 加粗單一分類的線條
            seriesConfig = seriesConfig.map(cfg => ({ ...cfg, lineWidth: 2.5 }));
        }

        // 幣別轉換：assetHistory 存 TWD，USD 時需除以匯率
        const usdRate = settings.usdRate || 31;
        const toDisplayValue = (twdVal) => currentDisplayCurrency === 'USD' ? (twdVal / usdRate) : twdVal;

        // 計算資產成長率（依尺度顯示周/月/季度/年）
        const growthKey = seriesConfig[0]?.key || 'total';
        const getVal = (dateStr) => (filledHistory[dateStr] || history[dateStr])?.[growthKey] || 0;
        const startRaw = getVal(chartDates[0]);
        const endRaw = getVal(chartDates[chartDates.length - 1]);
        const startVal = toDisplayValue(startRaw);
        const endVal = toDisplayValue(endRaw);
        let growthRate = 0;
        if(startVal > 0) growthRate = ((endVal - startVal) / startVal) * 100;
        let growthLabel = '年成長率';
        if(currentLineChartRange === 7) growthLabel = '周成長率';
        else if(currentLineChartRange === 30) growthLabel = '月成長率';
        else if(currentLineChartRange === 90) growthLabel = '季度成長率';
        else if(currentLineChartRange === 365 || currentLineChartRange === 0) growthLabel = '年成長率';
        const growthEl = document.getElementById('lineChartGrowthRate');
        if(growthEl) {
            const sign = growthRate >= 0 ? '+' : '';
            const cls = growthRate >= 0 ? 'positive' : 'negative';
            growthEl.innerHTML = '<span class="growth-label">' + growthLabel + '</span><span class="growth-value ' + cls + '">' + sign + growthRate.toFixed(2) + '%</span>';
        }

        // 為每個系列準備數據：每天一個點，使用 Highcharts step 繪製階梯效果（起始日不再畫垂直線）
        const series = seriesConfig.map(cfg => {
            const dataPoints = [];

            if(chartDates.length > 0) {
                const getVal = (dateStr) => (filledHistory[dateStr] || history[dateStr])?.[cfg.key] || 0;

                for(let idx = 0; idx < chartDates.length; idx++) {
                    const raw = getVal(chartDates[idx]);
                    const value = toDisplayValue(raw);
                    dataPoints.push([idx, value]);
                }
            }

            return {
                name: cfg.name,
                data: dataPoints,
                color: cfg.color,
                dashStyle: cfg.dashStyle,
                lineWidth: cfg.lineWidth,
                zIndex: cfg.zIndex,
                marker: {
                    enabled: true, // 始終顯示標記點
                    radius: chartDates.length <= 14 ? 5 : 3,
                    states: {
                        hover: {
                            enabled: true,
                            radius: chartDates.length <= 14 ? 7 : 5
                        }
                    }
                },
                point: {
                    events: {
                        click: function() {
                            // 點擊時顯示該點的日期與金額（使用 DOM 元素，避免被裁切）
                            const point = this;
                            const value = point.y;
                            let dateStr = '開始';
                            if(point.y !== 0 && chartDates.length > 0) {
                                const idx = Math.round(point.x);
                                const d = chartDates[Math.min(idx, chartDates.length - 1)];
                                if(d) {
                                    const [y, m, day] = d.split('-');
                                    dateStr = `${y}/${parseInt(m)}/${parseInt(day)}`;
                                }
                            }
                            const amountStr = currentDisplayCurrency === 'USD'
                                ? '$' + value.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})
                                : 'NT$' + Math.round(value).toLocaleString('zh-TW');

                            const chart = assetHistoryLineChart;
                            const tooltipEl = document.getElementById('lineChartPointTooltip');
                            const wrapper = document.getElementById('lineChartWrapper');
                            const chartContainer = document.getElementById('assetLineChart');
                            if(!tooltipEl || !wrapper || !chartContainer) return;

                            tooltipEl.innerHTML = '<div style="margin-bottom:4px;">' + dateStr + '</div><div>' + amountStr + '</div>';
                            tooltipEl.style.display = 'block';
                            tooltipEl.style.left = '-9999px';
                            tooltipEl.style.top = '0';
                            const tw = tooltipEl.offsetWidth;
                            const th = tooltipEl.offsetHeight;

                            const wrapperRect = wrapper.getBoundingClientRect();
                            const chartRect = chartContainer.getBoundingClientRect();
                            const plotX = chart.plotLeft + point.plotX;
                            const plotY = chart.plotTop + point.plotY;
                            const left = (chartRect.left - wrapperRect.left) + plotX + 15;
                            const top = (chartRect.top - wrapperRect.top) + plotY - th - 8;
                            tooltipEl.style.left = Math.max(8, Math.min(left, wrapperRect.width - tw - 8)) + 'px';
                            tooltipEl.style.top = Math.max(8, top) + 'px';

                            clearTimeout(window._lineChartTooltipTimer);
                            window._lineChartTooltipTimer = setTimeout(() => {
                                tooltipEl.style.display = 'none';
                            }, 5000);
                        }
                    }
                }
            };
        });

        // 自動計算 Y 軸顯示區間：根據資料範圍按比例留白
        let allValues = [];
        series.forEach(s => {
            s.data.forEach(point => {
                // 數據點格式為 [x, y]，提取y值
                const yValue = Array.isArray(point) ? point[1] : point;
                if(typeof yValue === 'number') allValues.push(yValue);
            });
        });
        let dataMin = allValues.length > 0 ? Math.min(...allValues) : 0;
        let dataMax = allValues.length > 0 ? Math.max(...allValues) : 0;
        let dataRange = dataMax - dataMin;
        // 如果只有一個值或所有值相同，用該值的 20% 作為範圍
        if(dataRange === 0) dataRange = Math.max(dataMax * 0.2, 1000);
        // 上方留 20% 空間，下方留 10% 空間，但最小值至少為0（確保從0開始）
        let yAxisMax = dataMax + dataRange * 0.2;
        let yAxisMin = 0; // 強制從0開始
        // 選擇合適的刻度對齊單位（依落差自動計算，支援大金額範圍）
        const rawRange = yAxisMax - yAxisMin;
        let tickSize;
        if(rawRange >= 1000000000) tickSize = 200000000;
        else if(rawRange >= 500000000) tickSize = 100000000;
        else if(rawRange >= 100000000) tickSize = 20000000;
        else if(rawRange >= 50000000) tickSize = 10000000;
        else if(rawRange >= 10000000) tickSize = 2000000;
        else if(rawRange >= 5000000) tickSize = 1000000;
        else if(rawRange >= 2000000) tickSize = 500000;
        else if(rawRange >= 500000) tickSize = 100000;
        else if(rawRange >= 200000) tickSize = 50000;
        else if(rawRange >= 50000) tickSize = 10000;
        else if(rawRange >= 20000) tickSize = 5000;
        else if(rawRange >= 5000) tickSize = 1000;
        else tickSize = 500;
        yAxisMin = 0; // 強制保持為0，確保從0開始顯示
        yAxisMax = Math.ceil(yAxisMax / tickSize) * tickSize;

        // 設定文字顏色
        const chartTextColor = getChartTextColor();

        // 找到今天在 chartDates 中的索引位置（用於標記今日）
        let todayIndex = -1;
        for(let i = 0; i < chartDates.length; i++) {
            if(chartDates[i] === todayStr) {
                todayIndex = i;
                break;
            }
        }
        // 如果今天不在 chartDates 中，但今天在範圍內，使用最後一個索引
        if(todayIndex === -1 && chartDates.length > 0) {
            const lastDate = chartDates[chartDates.length - 1];
            if(lastDate === todayStr || new Date(lastDate) >= new Date(todayStr)) {
                todayIndex = chartDates.length - 1;
            }
        }

        // 準備今日標記的 plotLines（如果今天在圖表範圍內）
        const todayPlotLine = todayIndex >= 0 ? {
            value: todayIndex,
            color: '#0a84ff',
            width: 2,
            dashStyle: 'Dash',
            zIndex: 10,
            label: {
                text: '今日',
                align: 'right',
                x: -5,
                style: {
                    color: '#0a84ff',
                    fontSize: '11px',
                    fontWeight: '600'
                },
                rotation: 0
            }
        } : null;

        // 銷毀舊圖表
        if(assetHistoryLineChart) {
            const oldContainer = assetHistoryLineChart.container;
            if(oldContainer && assetHistoryLineChart._lineChartContainerClick) {
                oldContainer.removeEventListener('click', assetHistoryLineChart._lineChartContainerClick);
            }
            assetHistoryLineChart.destroy();
            assetHistoryLineChart = null;
        }

        // 取得容器實際尺寸，確保圖表大小=顯示大小
        const lineWrapper = document.getElementById('lineChartWrapper');
        const chartContainer = document.getElementById('assetLineChart');
        let chartW = chartContainer ? chartContainer.clientWidth : 0;
        let chartH = chartContainer ? chartContainer.clientHeight : 0;
        if(chartH <= 0 && lineWrapper) {
            chartW = lineWrapper.clientWidth;
            chartH = lineWrapper.clientHeight;
        }
        if(chartH <= 0) chartH = window.innerWidth <= 767 ? 280 : 350;
        if(chartW <= 0) chartW = (lineWrapper || chartContainer || {}).clientWidth || 300;

        assetHistoryLineChart = Highcharts.chart('assetLineChart', {
            chart: {
                type: 'line',
                backgroundColor: 'transparent',
                width: chartW,
                height: chartH,
                margin: [20, 10, 40, 50],
                spacing: [0, 0, 0, 0],
                style: { fontFamily: 'sans-serif' }
            },
            title: { text: '' },
            credits: { enabled: false },
            legend: {
                enabled: true,
                align: 'center',
                verticalAlign: 'top',
                floating: false,
                itemStyle: { color: chartTextColor, fontSize: '11px', fontWeight: 'normal' },
                itemHoverStyle: { color: '#0a84ff' },
                symbolRadius: 2,
                padding: 0,
                margin: 8
            },
            xAxis: {
                type: 'linear',
                min: -0.2,
                max: Math.max(chartDates.length - 1, 0) + 0.2,
                labels: {
                    style: { color: chartTextColor, fontSize: '10px' },
                    rotation: chartDates.length > 30 ? -45 : 0,
                    step: chartDates.length > 60 ? Math.ceil(chartDates.length / 15) : (chartDates.length > 14 ? 2 : 1),
                    formatter: function() {
                        const idx = Math.round(this.value);
                        if(idx < 0 || idx >= chartDates.length) return '';
                        if(idx === 0) return '開始';
                        const d = chartDates[idx];
                        if(!d) return '';
                        const parts = d.split('-');
                        return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
                    }
                },
                tickPositions: chartDates.map((d, idx) => idx),
                lineColor: 'rgba(255,255,255,0.1)',
                tickColor: 'rgba(255,255,255,0.1)',
                crosshair: {
                    color: 'rgba(255,255,255,0.15)',
                    width: 1
                },
                plotLines: todayPlotLine ? [todayPlotLine] : []
            },
            yAxis: {
                title: { text: '' },
                min: yAxisMin,
                max: yAxisMax,
                startOnTick: false,
                endOnTick: false,
                tickAmount: 6,
                labels: {
                    enabled: true,
                    style: { color: chartTextColor, fontSize: '10px' },
                    formatter: function() {
                        const v = this.value;
                        if(Math.abs(v) >= 1000000) return (v/1000000).toFixed(1) + 'M';
                        if(currentDisplayCurrency === 'TWD' && Math.abs(v) >= 10000) return (v/10000).toFixed(0) + '萬';
                        if(currentDisplayCurrency === 'USD' && Math.abs(v) >= 1000) return (v/1000).toFixed(1) + 'K';
                        return v.toLocaleString();
                    }
                },
                gridLineColor: 'rgba(255,255,255,0.05)',
                gridLineDashStyle: 'Dot',
                lineColor: 'rgba(255,255,255,0.1)',
                tickColor: 'rgba(255,255,255,0.1)'
            },
            tooltip: {
                shared: true,
                backgroundColor: 'rgba(30,30,30,0.95)',
                borderColor: 'rgba(255,255,255,0.1)',
                borderRadius: 8,
                style: { color: '#fff', fontSize: '12px' },
                formatter: function() {
                    let s = '<b>' + this.x + '</b><br/>';
                    this.points.forEach(p => {
                        s += '<span style="color:' + p.series.color + '">●</span> ' + p.series.name + ': <b>' + p.y.toLocaleString() + '</b><br/>';
                    });
                    return s;
                }
            },
            plotOptions: {
                line: {
                    animation: { duration: 500 },
                    connectNulls: true,
                    step: 'left'  // 階梯式折線：每天一個點，水平後垂直
                }
            },
            series: series
        });

        // 使用容器點擊監聽（比 chart.events.click 更可靠，確保折線圖內任一點擊都有反應）
        const chart = assetHistoryLineChart;
        const container = chart.container;
        const onChartClick = function(e) {
            if(chartDates.length === 0) return;
            const rect = container.getBoundingClientRect();
            const relX = e.clientX - rect.left;
            const relY = e.clientY - rect.top;
            if(relX < chart.plotLeft || relX > chart.plotLeft + chart.plotWidth || relY < chart.plotTop || relY > chart.plotTop + chart.plotHeight) return;
            const xVal = chart.xAxis[0].toValue(relX);
            let idx = Math.round(xVal);
            idx = Math.max(0, Math.min(idx, chartDates.length - 1));
            const series = chart.series[0];
            if(!series || !series.points) return;
            // 找到 x=idx 的點
            let pt = null;
            for(let i = 0; i < series.points.length; i++) {
                if(Math.round(series.points[i].x) === idx) {
                    pt = series.points[i];
                    break;
                }
            }
            const value = pt ? pt.y : (series.points[idx] != null ? series.points[idx].y : 0);
            let dateStr = '開始';
            const d = chartDates[idx];
            if(d) {
                const [y, m, day] = d.split('-');
                dateStr = `${y}/${parseInt(m)}/${parseInt(day)}`;
            }
            const amountStr = currentDisplayCurrency === 'USD'
                ? '$' + value.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})
                : 'NT$' + Math.round(value).toLocaleString('zh-TW');
            const tooltipEl = document.getElementById('lineChartPointTooltip');
            const wrapper = document.getElementById('lineChartWrapper');
            const chartContainer = document.getElementById('assetLineChart');
            if(!tooltipEl || !wrapper || !chartContainer) return;
            tooltipEl.innerHTML = '<div style="margin-bottom:4px;">' + dateStr + '</div><div>' + amountStr + '</div>';
            tooltipEl.style.display = 'block';
            tooltipEl.style.left = '-9999px';
            tooltipEl.style.top = '0';
            const tw = tooltipEl.offsetWidth;
            const th = tooltipEl.offsetHeight;
            const wrapperRect = wrapper.getBoundingClientRect();
            const chartRect = chartContainer.getBoundingClientRect();
            const left = (chartRect.left - wrapperRect.left) + relX + 15;
            const top = (chartRect.top - wrapperRect.top) + relY - th - 8;
            tooltipEl.style.left = Math.max(8, Math.min(left, wrapperRect.width - tw - 8)) + 'px';
            tooltipEl.style.top = Math.max(8, top) + 'px';
            clearTimeout(window._lineChartTooltipTimer);
            window._lineChartTooltipTimer = setTimeout(function() { tooltipEl.style.display = 'none'; }, 5000);
        };
        if(chart._lineChartContainerClick) container.removeEventListener('click', chart._lineChartContainerClick);
        chart._lineChartContainerClick = onChartClick;
        container.addEventListener('click', onChartClick);
    }

    // 根據主題獲取圖表文字顏色
    function getChartTextColor() {
        const currentTheme = settings.theme || 'dark';
        return currentTheme === 'dark' ? '#fff' : '#000';
    }

    function updateChartTextColor() {
        if(!chartInstance) return;

        const textColor = getChartTextColor();

        // 更新標題顏色
        if(chartInstance.title) {
            chartInstance.setTitle({
                text: chartInstance.title.textStr || '',
                style: { color: textColor, fontSize: '14px' }
            }, false);
        }

        // 更新數據標籤顏色
        if(chartInstance.series && chartInstance.series.length > 0) {
            chartInstance.series.forEach(series => {
                if(series.options && series.options.dataLabels) {
                    series.update({
                        dataLabels: {
                            ...series.options.dataLabels,
                            style: {
                                ...series.options.dataLabels.style,
                                color: textColor
                            }
                        }
                    }, false);
                }
            });
        }

        // 強制更新所有文字元素的顏色
        setTimeout(() => {
            const dataLabels = document.querySelectorAll('#chartWrapper .highcharts-data-label text, #chartWrapper .highcharts-title text');
            dataLabels.forEach(label => {
                label.style.setProperty('fill', textColor, 'important');
            });

            // 更新 disableChartHover 中的顏色設置
            const hoverLabels = document.querySelectorAll('#chartWrapper .highcharts-data-label, #chartWrapper .highcharts-data-label text');
            hoverLabels.forEach(label => {
                if(label.tagName === 'text') {
                    label.style.setProperty('fill', textColor, 'important');
                }
            });
        }, 100);

        chartInstance.redraw();
    }
