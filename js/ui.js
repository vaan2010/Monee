// ====== ui.js ======

// --- Global UI State Variables ---
// (declared here; index.html must remove these declarations)
let isEditMode = false;    // line 1671
let sortables = [];        // line 1672
// isSorting is declared in account.js

// menuSectionsState (lines 1785-1796)
let menuSectionsState = {
    'invest': true,
    'data-settings': true,
    'tutorial': true,
    'system': true,
    'update': true,
    'data': true,
    'pnl': true,
    'linechart': true,
    'api': true,
    'pages': true
};

// --- Sidebar ---

// line 2130
function toggleSidebar() { const s=document.getElementById('sidebar'); const o=document.getElementById('sidebarOverlay'); if(s.classList.contains('active')){s.classList.remove('active');o.classList.remove('active');if(window.matchMedia('(min-width: 768px)').matches){s.classList.add('collapsed');} setTimeout(function(){initMenuSections();},0);}else{s.classList.add('active');o.classList.add('active');if(window.matchMedia('(min-width: 768px)').matches){s.classList.remove('collapsed');}} }

// line 2133
function initSidebarState() { if(window.matchMedia('(min-width: 768px)').matches){ const collapsed=localStorage.getItem('sidebarCollapsed')==='true'; const s=document.getElementById('sidebar'); const o=document.getElementById('sidebarOverlay'); if(collapsed){s.classList.add('collapsed'); s.classList.remove('active'); o.classList.remove('active');}else{s.classList.remove('collapsed'); s.classList.add('active'); o.classList.add('active');} } }

// --- Menu Sections ---

// lines 1799-1818
function toggleMenuSection(sectionId) {
    const section = document.getElementById(`menuSection-${sectionId}`);
    const label = event.currentTarget;

    if(!section) return;

    const isCollapsed = section.classList.contains('collapsed');

    if(isCollapsed) {
        section.classList.remove('collapsed');
        label.classList.remove('collapsed');
        menuSectionsState[sectionId] = false;
    } else {
        section.classList.add('collapsed');
        label.classList.add('collapsed');
        menuSectionsState[sectionId] = true;
    }

    // 不保存狀態到 localStorage，每次重新打開都會重置為摺疊
}

// lines 1821-1844
function initMenuSections() {
    // 每次初始化都強制重置為摺疊狀態
    Object.keys(menuSectionsState).forEach(sectionId => {
        menuSectionsState[sectionId] = true;
    });

    Object.keys(menuSectionsState).forEach(sectionId => {
        const section = document.getElementById(`menuSection-${sectionId}`);
        // 找到對應的 label（通過查找包含該 sectionId 的 onclick 屬性）
        const labels = document.querySelectorAll('.menu-label, .menu-group-label');
        let label = null;
        labels.forEach(l => {
            if(l.getAttribute('onclick') && l.getAttribute('onclick').includes(`'${sectionId}'`)) {
                label = l;
            }
        });

        if(section && label) {
            // 強制全部摺疊
            section.classList.add('collapsed');
            label.classList.add('collapsed');
        }
    });
}

// --- Theme ---

// lines 4091-4108
function toggleTheme() {
    if(!settings.theme) {
        settings.theme = 'dark';
    }
    settings.theme = settings.theme === 'dark' ? 'light' : 'dark';

    // 根據主題自動切換圖表字體顏色
    if(settings.theme === 'dark') {
        settings.chartTextColor = 'white';
    } else {
        settings.chartTextColor = 'black';
    }

    saveSettings();
    applyTheme();
    updateThemeButton();
    updateChartTextColor();
}

// --- Currency Display ---

// lines 4060-4078
function toggleCurrency() {
    currentDisplayCurrency = currentDisplayCurrency === 'TWD' ? 'USD' : 'TWD';
    localStorage.setItem('displayCurrency', currentDisplayCurrency);
    // 同步到 settings 並保存到 Firestore
    settings.displayCurrency = currentDisplayCurrency;
    saveSettings();
    updateCurrencyButton();
    renderAssets();
    // 折線圖需重新渲染以套用幣別
    if(currentChartMode === 'line') {
        hideLineChartPointTooltip();
        renderAssetLineChart();
    }
    // 只有在詳細視圖已經打開的情況下才更新詳細視圖，不要重新打開已關閉的視圖
    const detailView = document.getElementById('detailView');
    if(currentDetailAcc && detailView && detailView.classList.contains('active')) {
        openDetailView(currentDetailAcc.id);
    }
}

// --- Numbers Visibility ---

// lines 2135-2142
function toggleNumbers() {
    const body = document.body;
    const icon = document.getElementById('toggleNumbersIcon');
    const isHidden = body.classList.toggle('numbers-hidden');
    icon.classList.toggle('fa-eye', !isHidden);
    icon.classList.toggle('fa-eye-slash', isHidden);
    localStorage.setItem('numbersHidden', isHidden);
}

// lines 2157-2162
function toggleItemNumbers(itemId) {
    const key = `itemHidden_${itemId}`;
    const isHidden = localStorage.getItem(key) === 'true';
    localStorage.setItem(key, !isHidden);
    renderAssets();
}

// --- Edit Mode ---

// line 2134
function toggleEditMode() { isEditMode=!isEditMode; document.getElementById('sortBtn').classList.toggle('active', isEditMode); document.getElementById('addBtn').style.display=isEditMode?'none':'block'; renderAssets(); }

// --- Calendar Settings Modal ---

// lines 9586-9605
function openCalendarSettingsModal() {
    const modal = document.getElementById('calendarSettingsModal');
    const modalWrapper = modal.querySelector('.modal-content-wrapper');

    // 渲染固定轉帳列表
    renderFixedTransferList();

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
}

// lines 9715-9727
function closeCalendarSettingsModal() {
    const modal = document.getElementById('calendarSettingsModal');
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

// --- Dividend Modal ---

// lines 8745-8761
async function openDividendModal() {
    const modal = document.getElementById('dividendModal');
    const modalWrapper = modal && modal.querySelector('.modal-content-wrapper');
    const loadingEl = document.getElementById('dividendModalLoading');
    const listEl = document.getElementById('dividendModalList');
    const emptyEl = document.getElementById('dividendModalEmpty');
    if (!modal || !modalWrapper) return;
    loadingEl.style.display = 'block';
    listEl.style.display = 'none';
    emptyEl.style.display = 'none';
    modal.style.display = 'flex';
    modal.style.background = 'rgba(0,0,0,0.5)';
    modalWrapper.style.transform = 'translateY(100%)';
    requestAnimationFrame(() => { setTimeout(() => { modalWrapper.style.transform = 'translateY(0)'; }, 10); });
    const codes = [...new Set(accounts.filter(a => a.type === 'twstock' && a.symbol).map(a => (a.symbol || '').toString().trim()).filter(Boolean))];
    await queryDividendHistory(codes);
}

// lines 8790-8795
function closeDividendModal() {
    const modal = document.getElementById('dividendModal');
    const modalWrapper = modal && modal.querySelector('.modal-content-wrapper');
    if (modalWrapper) modalWrapper.style.transform = 'translateY(100%)';
    if (modal) modal.style.display = 'none';
}

// --- Repeat Selector ---

// lines 10623-10639
function openRepeatSelector() {
    const modal = document.getElementById('repeatSelectorModal');
    const modalWrapper = modal.querySelector('.modal-content-wrapper');
    // 確保模態框顯示在最上層
    modal.style.zIndex = '2020';
    modal.style.display = 'block';
    modal.style.background = 'rgba(0,0,0,0.5)';
    if(modalWrapper) {
        modalWrapper.style.transform = 'translateY(100%)';
        // 立即觸發動畫，不等待
        requestAnimationFrame(() => {
            if(modalWrapper) {
                modalWrapper.style.transform = 'translateY(0)';
            }
        });
    }
}

// lines 10641-10653
function closeRepeatSelector() {
    const modal = document.getElementById('repeatSelectorModal');
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

// lines 10655-10680
function selectRepeat(repeat) {
    const repeatNames = { 'daily': '每日', 'weekly': '每星期', 'monthly': '每月', 'yearly': '每年' };
    if(currentFixedFormContext === 'expense') {
        fixedExpenseData.repeat = repeat;
        const el = document.getElementById('fixedExpenseRepeat');
        if(el) el.textContent = repeatNames[repeat];
        closeRepeatSelector();
        updateFixedExpensePeriodCount();
        updateNextDatesForFixed();
        return;
    }
    if(currentFixedFormContext === 'income') {
        fixedIncomeData.repeat = repeat;
        const el = document.getElementById('fixedIncomeRepeat');
        if(el) el.textContent = repeatNames[repeat];
        closeRepeatSelector();
        updateFixedIncomePeriodCount();
        updateNextDatesForFixed();
        return;
    }
    fixedTransferData.repeat = repeat;
    const repeatElement = document.getElementById('fixedTransferRepeat');
    if(repeatElement) repeatElement.textContent = repeatNames[repeat];
    closeRepeatSelector();
    updatePeriodCount();
}

// --- Page Visibility Settings ---

// lines 1986-2068
function renderPageVisibilitySettings() {
    const container = document.getElementById('pageVisibilitySettings');
    if(!container) return;

    container.innerHTML = '';

    // 按照 pageOrder 順序渲染（排除總覽）
    const orderedPages = pageOrder.filter(index => index !== 0);

    orderedPages.forEach((pageIndex) => {
        const pageName = PAGE_NAMES[pageIndex];
        const isEnabled = isPageEnabled(pageIndex);

        const item = document.createElement('div');
        item.className = 'page-visibility-item';
        item.setAttribute('data-page-index', pageIndex);
        item.innerHTML = `
            <i class="fas fa-grip-vertical drag-handle"></i>
            <label>
                <input type="checkbox" ${isEnabled ? 'checked' : ''}
                       onchange="togglePageVisibility(${pageIndex}, this.checked)">
                <span>${pageName}</span>
            </label>
        `;
        container.appendChild(item);
    });

    // 設置拖曳排序
    // 使用 setTimeout 確保 DOM 完全渲染後再初始化 Sortable
    setTimeout(() => {
        if(typeof Sortable !== 'undefined') {
            // 銷毀舊的實例
            const existingSortable = container.sortableInstance;
            if(existingSortable) {
                existingSortable.destroy();
            }

            // 創建新的 Sortable 實例
            container.sortableInstance = Sortable.create(container, {
                animation: 150,
                handle: '.drag-handle',
                filter: 'input, label', // 排除 checkbox 和 label，只允許通過 drag-handle 拖曳
                preventOnFilter: false,
                onStart: function() {
                    // 開始拖動時，禁用左右滑動
                    isSorting = true;
                },
                onEnd: function(evt) {
                    // 結束拖動時，恢復左右滑動
                    isSorting = false;

                    // 獲取新的順序（使用外層的 container，這是 pageVisibilitySettings 容器）
                    const settingsContainer = container;
                    const newOrder = Array.from(settingsContainer.children).map(item => {
                        return parseInt(item.getAttribute('data-page-index'));
                    });

                    // 更新 pageOrder（保持總覽在第一位）
                    pageOrder = [0, ...newOrder];
                    savePageOrder();

                    // 重新排列 page-item 的 DOM 順序（必須在 renderPageIndicator 之前）
                    const domIndex = reorderPageItems();

                    // 重新渲染界面（renderPageIndicator 會根據新的 pageOrder 重新渲染）
                    renderPageIndicator();
                    // 注意：不要在這裡調用 renderPageVisibilitySettings()，因為這會重新初始化 Sortable
                    // 只需要更新主畫面的順序即可
                    renderAssets();
                    updateChartData();

                    // 方案C：更新當前頁面顯示
                    updateActivePageClass();

                    // 更新導航箭頭狀態
                    updatePageNavArrows();
                }
            });
        } else {
            console.warn('Sortable library not loaded');
        }
    }, 100);
}

// lines 2098-2118
function togglePageVisibility(pageIndex, enabled) {
    // 總覽分頁（index 0）不會出現在選項中，所以這裡不需要檢查
    const pageType = PAGE_TYPES[pageIndex];
    pageVisibility[pageType] = enabled;

    savePageVisibility();

    // 如果當前分頁被隱藏，切換到第一個啟用的分頁
    if(!enabled && currentPage === pageIndex) {
        const orderedPages = getOrderedPages();
        if(orderedPages.length > 0) {
            switchToPage(orderedPages[0]);
        }
    }

    // 重新渲染界面
    renderPageVisibilitySettings();
    renderPageIndicator();
    renderAssets();
    updateChartData();
}

    function toggleSidebarCollapse() { const s=document.getElementById('sidebar'); const o=document.getElementById('sidebarOverlay'); const isCollapsed=s.classList.contains('collapsed'); if(isCollapsed){s.classList.remove('collapsed'); if(window.matchMedia('(min-width: 768px)').matches){s.classList.add('active'); o.classList.add('active');} localStorage.setItem('sidebarCollapsed','false');}else{s.classList.add('collapsed'); if(window.matchMedia('(min-width: 768px)').matches){s.classList.remove('active'); o.classList.remove('active');} localStorage.setItem('sidebarCollapsed','true');} }
