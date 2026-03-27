// ====== tutorial.js ======

    const ASSET_TUTORIAL_STEPS = [
        { selector: '.navbar .hamburger-btn', title: '功能選單', desc: '點這裡可開啟側邊選單：匯出備份、雲端設定、API 設定、使用教學等。' },
        { selector: '.summary-card', title: '總淨資產', desc: '這裡顯示你的總淨資產。可點旁邊眼睛圖示隱藏/顯示數字。' },
        { selector: '#addBtn', title: '新增資產', desc: '點 + 可新增錢包、美股、台股、加密貨幣或負債。' },
        { selector: '#chartWrapper', title: '資產分佈圖', desc: '圓餅圖顯示各類資產佔比。可點圖切換圓餅/折線圖。' },
        { selector: '.page-indicator', title: '分頁切換', desc: '總覽、錢包、美股、台股、加密貨幣，左右滑動或點分頁切換。' },
        { selector: '.tab-bar', title: '資產 / 記帳', desc: '切換到「記帳」可查看日曆與收支紀錄。' }
    ];
    const JOURNAL_TUTORIAL_STEPS = [
        { selector: '.tab-bar', title: '記帳分頁', desc: '你現在在記帳頁。點「資產」可回到資產總覽。' },
        { selector: '#calendarHeaderDate', title: '月份切換', desc: '左右箭頭可切換月份，點中間可選月份。' },
        { selector: '#calendarGrid', title: '日曆', desc: '點選日期可查看當天收支詳情。有記帳的日期底下會顯示藍色標記。' },
        { selector: '#calendarSettingsBtn', title: '新增記帳', desc: '在記帳頁點右上角 + 可新增收入、支出或轉帳。' },
        { selector: '#journalFabWrapper', title: '視圖切換', desc: '點右下角可展開選單：日曆記帳趣（按日期查看與新增收支）、收支圓餅圖（當月支出／收入占比）、收支趨勢圖（整年收支趨勢）。' },
        { selector: '#calendarTransferDetails', title: '當日詳情', desc: '選日期後這裡會顯示當天的收入、支出、轉帳，可編輯或刪除。' }
    ];
    let spotlightSteps = [];
    let spotlightIndex = 0;
    const SPOTLIGHT_PADDING = 10;
    let tutorialSampleChartInstance = null;

    function destroyTutorialSampleChart() {
        if (tutorialSampleChartInstance) {
            try { tutorialSampleChartInstance.destroy(); } catch (e) {}
            tutorialSampleChartInstance = null;
        }
        const sampleEl = document.getElementById('assetChartTutorialSample');
        if (sampleEl) sampleEl.remove();
    }

    function showTutorialSamplePieIfEmpty() {
        const wrapper = document.getElementById('chartWrapper');
        if (!wrapper || typeof Highcharts === 'undefined') return;
        var chartEmpty = !chartInstance || !chartInstance.series || !chartInstance.series[0] || !chartInstance.series[0].points || chartInstance.series[0].points.length === 0;
        if (!chartEmpty) return;
        destroyTutorialSampleChart();
        var sampleDiv = document.createElement('div');
        sampleDiv.id = 'assetChartTutorialSample';
        sampleDiv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;min-height:200px;z-index:5;';
        wrapper.style.position = 'relative';
        wrapper.appendChild(sampleDiv);
        var chartTextColor = typeof getChartTextColor === 'function' ? getChartTextColor() : '#fff';
        var sampleData = [
            { name: (typeof TYPE_NAMES !== 'undefined' && TYPE_NAMES.bank) ? TYPE_NAMES.bank : '錢包', y: 40, color: (typeof OVERVIEW_COLORS !== 'undefined' && OVERVIEW_COLORS.bank) ? OVERVIEW_COLORS.bank : '#6bb5ff' },
            { name: (typeof TYPE_NAMES !== 'undefined' && TYPE_NAMES.stock) ? TYPE_NAMES.stock : '美股', y: 30, color: (typeof OVERVIEW_COLORS !== 'undefined' && OVERVIEW_COLORS.stock) ? OVERVIEW_COLORS.stock : '#d9a8f8' },
            { name: (typeof TYPE_NAMES !== 'undefined' && TYPE_NAMES.twstock) ? TYPE_NAMES.twstock : '台股', y: 20, color: (typeof OVERVIEW_COLORS !== 'undefined' && OVERVIEW_COLORS.twstock) ? OVERVIEW_COLORS.twstock : '#7ee58f' },
            { name: (typeof TYPE_NAMES !== 'undefined' && TYPE_NAMES.crypto) ? TYPE_NAMES.crypto : '加密貨幣', y: 10, color: (typeof OVERVIEW_COLORS !== 'undefined' && OVERVIEW_COLORS.crypto) ? OVERVIEW_COLORS.crypto : '#ffcc80' }
        ];
        tutorialSampleChartInstance = Highcharts.chart('assetChartTutorialSample', {
            chart: { type: 'pie', backgroundColor: 'transparent', spacing: [30, 20, 20, 20], height: '100%', width: null, reflow: true, margin: [30, 20, 20, 20] },
            title: { text: '', style: { color: chartTextColor, fontSize: '14px' }, align: 'center', verticalAlign: 'middle', y: 10 },
            credits: { enabled: false },
            tooltip: { enabled: false },
            plotOptions: { pie: { innerSize: '55%', size: '90%', center: ['50%', '50%'], borderWidth: 0, slicedOffset: 8, animation: { duration: 400 }, dataLabels: { enabled: true, distance: 3, format: '{point.name}<br><span style="opacity:0.7">{point.percentage:.1f}%</span>', style: { color: chartTextColor, textOutline: 'none', fontWeight: 'normal', fontSize: '12px', width: 80, textOverflow: 'none' }, connectorColor: '#666', softConnector: true }, states: { hover: { enabled: false }, inactive: { opacity: 0.3 } } } },
            series: [{ name: '資產', data: sampleData }]
        });
        var w = wrapper.clientWidth;
        var h = wrapper.clientHeight;
        if (w > 0 && h > 0) {
            tutorialSampleChartInstance.setSize(w, h, false);
            tutorialSampleChartInstance.reflow();
            setTimeout(function() {
                if (tutorialSampleChartInstance) {
                    tutorialSampleChartInstance.reflow();
                }
            }, 100);
        }
    }

    function openTutorialAssets() {
        if(typeof switchToCalendarPage === 'function') switchToCalendarPage(false);
        setTimeout(function() {
            spotlightSteps = ASSET_TUTORIAL_STEPS.slice();
            spotlightIndex = 0;
            startSpotlightTutorial();
        }, 100);
    }
    function openTutorialJournal() {
        if(typeof switchToCalendarPage === 'function') switchToCalendarPage(true);
        if(typeof selectJournalView === 'function') selectJournalView('calendar');
        setTimeout(function() {
            spotlightSteps = JOURNAL_TUTORIAL_STEPS.slice();
            spotlightIndex = 0;
            startSpotlightTutorial();
        }, 350);
    }
    function startSpotlightTutorial() {
        const overlay = document.getElementById('spotlightOverlay');
        if(!overlay) return;
        overlay.classList.add('show');
        overlay.style.display = 'block';
        positionSpotlight();
    }
    function closeSpotlightTutorial() {
        destroyTutorialSampleChart();
        var jFab = document.getElementById('journalFabWrapper');
        if(jFab) jFab.classList.remove('expanded');
        const overlay = document.getElementById('spotlightOverlay');
        if(overlay) {
            overlay.classList.remove('show');
            overlay.style.display = 'none';
        }
        localStorage.setItem('monee_tutorial_seen', '1');
    }
    function nextSpotlightStep() {
        spotlightIndex++;
        if(spotlightIndex >= spotlightSteps.length) {
            closeSpotlightTutorial();
            return;
        }
        const btn = document.getElementById('spotlightNextBtn');
        if(btn) btn.textContent = spotlightIndex === spotlightSteps.length - 1 ? '完成' : '下一步';
        positionSpotlight();
    }
    function positionSpotlight() {
        destroyTutorialSampleChart();
        var jFab = document.getElementById('journalFabWrapper');
        if(jFab) jFab.classList.remove('expanded');
        const hole = document.getElementById('spotlightHole');
        const tooltip = document.getElementById('spotlightTooltip');
        const titleEl = document.getElementById('spotlightTitle');
        const descEl = document.getElementById('spotlightDesc');
        const nextBtn = document.getElementById('spotlightNextBtn');
        if(!hole || !tooltip || !spotlightSteps.length) return;

        const step = spotlightSteps[spotlightIndex];
        if(!step) { closeSpotlightTutorial(); return; }

        const el = document.querySelector(step.selector);
        if(titleEl) titleEl.textContent = step.title;
        if(descEl) descEl.textContent = step.desc;
        if(nextBtn) nextBtn.textContent = spotlightIndex === spotlightSteps.length - 1 ? '完成' : '下一步';
        if(step.selector === '#chartWrapper') showTutorialSamplePieIfEmpty();
        if(step.selector === '#journalFabWrapper' && jFab) jFab.classList.add('expanded');

        void tooltip.offsetHeight;
        var tooltipH = Math.max(60, tooltip.getBoundingClientRect().height);

        var boxBottom = 0, boxTop = 0;
        if(!el) {
            hole.style.left = '50%';
            hole.style.top = '40%';
            hole.style.width = '200px';
            hole.style.height = '80px';
            hole.style.transform = 'translate(-50%, -50%)';
        } else {
            el.scrollIntoView({ block: 'center', behavior: 'auto' });
            if(step.selector === '#journalFabWrapper') {
                setTimeout(function() {
                    if(!hole || !tooltip) return;
                    var stepNow = spotlightSteps[spotlightIndex];
                    if(!stepNow || stepNow.selector !== '#journalFabWrapper') return;
                    var w = document.getElementById('journalFabWrapper');
                    if(!w) return;
                    var r2 = w.getBoundingClientRect();
                    var opts2 = w.querySelector('.journal-fab-options');
                    if(opts2) {
                        var ro2 = opts2.getBoundingClientRect();
                        var left2 = Math.min(r2.left, ro2.left);
                        var top2 = Math.min(r2.top, ro2.top);
                        var right2 = Math.max(r2.right, ro2.right);
                        var bottom2 = Math.max(r2.bottom, ro2.bottom);
                        r2 = { left: left2, top: top2, width: right2 - left2, height: bottom2 - top2 };
                    }
                    hole.style.left = (r2.left - SPOTLIGHT_PADDING) + 'px';
                    hole.style.top = (r2.top - SPOTLIGHT_PADDING) + 'px';
                    hole.style.width = (r2.width + SPOTLIGHT_PADDING * 2) + 'px';
                    hole.style.height = (r2.height + SPOTLIGHT_PADDING * 2) + 'px';
                    var boxBottom2 = r2.top + r2.height + SPOTLIGHT_PADDING;
                    var boxTop2 = r2.top - SPOTLIGHT_PADDING;
                    var tooltipH2 = Math.max(60, tooltip.getBoundingClientRect().height);
                    var viewportH2 = window.innerHeight;
                    var gap = 12, marginBottom = 24;
                    var tooltipTop2 = boxBottom2 + gap;
                    if(tooltipTop2 + tooltipH2 > viewportH2 - marginBottom) tooltipTop2 = Math.max(20, boxTop2 - gap - tooltipH2);
                    tooltip.style.top = tooltipTop2 + 'px';
                }, 260);
            } else {
                var r = el.getBoundingClientRect();
                boxBottom = r.bottom + SPOTLIGHT_PADDING;
                boxTop = r.top - SPOTLIGHT_PADDING;
                hole.style.left = (r.left - SPOTLIGHT_PADDING) + 'px';
                hole.style.top = (r.top - SPOTLIGHT_PADDING) + 'px';
                hole.style.width = (r.width + SPOTLIGHT_PADDING * 2) + 'px';
                hole.style.height = (r.height + SPOTLIGHT_PADDING * 2) + 'px';
                hole.style.transform = 'none';
            }
        }

        if(!el) {
            void hole.offsetHeight;
            const holeRect = hole.getBoundingClientRect();
            boxBottom = holeRect.bottom;
            boxTop = holeRect.top;
        }
        if(step.selector !== '#journalFabWrapper') {
            const viewportH = window.innerHeight;
            const gap = 12;
            const marginBottom = 24;
            tooltip.style.bottom = '';
            tooltip.style.top = '';
            var tooltipTop = boxBottom + gap;
            if(tooltipTop + tooltipH > viewportH - marginBottom) {
                tooltipTop = Math.max(20, boxTop - gap - tooltipH);
            }
            tooltip.style.top = tooltipTop + 'px';
        }
    }

    function openExpenseAiTutorial() {
        var overlay = document.getElementById('expenseAiTutorialOverlay');
        if(!overlay) return;
        expenseAiTutorialIndex = 0;
        buildExpenseAiCarouselDots();
        updateExpenseAiCarousel();
        overlay.classList.add('show');
        startExpenseAiTutorialAutoAdvance();
    }
    
    // 支出 AI 匯入教學範例（發票怪獸 / 財政部發票存摺 / 國泰信用卡）
    var expenseAiTutorialIndex = 0;
    var expenseAiTutorialTimer = null;
    var EXPENSE_AI_TUTORIAL_SLIDES = 3;
    function openExpenseAiTutorial() {
        var overlay = document.getElementById('expenseAiTutorialOverlay');
        if(!overlay) return;
        expenseAiTutorialIndex = 0;
        buildExpenseAiCarouselDots();
        updateExpenseAiCarousel();
        overlay.classList.add('show');
        startExpenseAiTutorialAutoAdvance();
    }
    function closeExpenseAiTutorial() {
        var overlay = document.getElementById('expenseAiTutorialOverlay');
        if(overlay) overlay.classList.remove('show');
        stopExpenseAiTutorialAutoAdvance();
    }
    function updateExpenseAiCarousel() {
        var inner = document.getElementById('expenseAiCarouselInner');
        if(inner) inner.style.transform = 'translateX(-' + (expenseAiTutorialIndex * 100) + '%)';
        var dots = document.querySelectorAll('.expense-ai-carousel-dots span');
        dots.forEach(function(d, i) { d.classList.toggle('active', i === expenseAiTutorialIndex); });
    }
    function buildExpenseAiCarouselDots() {
        var container = document.getElementById('expenseAiCarouselDots');
        if(!container) return;
        container.innerHTML = '';
        for(var i = 0; i < EXPENSE_AI_TUTORIAL_SLIDES; i++) {
            var span = document.createElement('span');
            span.classList.toggle('active', i === 0);
            span.onclick = (function(j){ return function(){ expenseAiTutorialIndex = j; updateExpenseAiCarousel(); startExpenseAiTutorialAutoAdvance(); }; })(i);
            container.appendChild(span);
        }
    }
    function expenseAiCarouselPrev() {
        expenseAiTutorialIndex = (expenseAiTutorialIndex - 1 + EXPENSE_AI_TUTORIAL_SLIDES) % EXPENSE_AI_TUTORIAL_SLIDES;
        updateExpenseAiCarousel();
        startExpenseAiTutorialAutoAdvance();
    }
    function expenseAiCarouselNext() {
        expenseAiTutorialIndex = (expenseAiTutorialIndex + 1) % EXPENSE_AI_TUTORIAL_SLIDES;
        updateExpenseAiCarousel();
        startExpenseAiTutorialAutoAdvance();
    }
    function startExpenseAiTutorialAutoAdvance() {
        stopExpenseAiTutorialAutoAdvance();
        expenseAiTutorialTimer = setInterval(function() {
            expenseAiTutorialIndex = (expenseAiTutorialIndex + 1) % EXPENSE_AI_TUTORIAL_SLIDES;
            updateExpenseAiCarousel();
        }, 3500);
    }
    function stopExpenseAiTutorialAutoAdvance() {
        if(expenseAiTutorialTimer) { clearInterval(expenseAiTutorialTimer); expenseAiTutorialTimer = null; }
    }

