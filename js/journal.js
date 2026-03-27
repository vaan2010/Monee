// ====== journal.js ======
    // Calendar Functions
    let currentCalendarDate = new Date();
    let selectedDate = null;
    
    // 保存記帳頁面狀態的函數
    function saveJournalPageState() {
        try {
            const state = {
                calendarDate: currentCalendarDate.getTime(),
                journalPageIndex: currentJournalPageIndex || 0,
                journalViewMode: journalViewMode || 'calendar'  // 記住是日曆還是圖表模式
            };
            localStorage.setItem(`journalPageState_${currentUserId}`, JSON.stringify(state));
        } catch(e) {
            console.error('保存記帳頁面狀態失敗:', e);
        }
    }
    
    // 恢復記帳頁面狀態的函數
    function restoreJournalPageState() {
        try {
            const savedState = localStorage.getItem(`journalPageState_${currentUserId}`);
            if(savedState) {
                const state = JSON.parse(savedState);
                if(state.calendarDate) {
                    currentCalendarDate = new Date(state.calendarDate);
                }
                if(state.journalPageIndex !== undefined) {
                    currentJournalPageIndex = state.journalPageIndex;
                }
                if(state.journalViewMode) {
                    journalViewMode = state.journalViewMode;  // 恢復視圖模式
                }
            }
        } catch(e) {
            console.error('恢復記帳頁面狀態失敗:', e);
        }
    }
    function switchToCalendarPage(showCalendar) {
        const calendarPage = document.getElementById('calendarPage');
        const contentGrid = document.querySelector('.content-grid');
        const assetListTab = document.getElementById('assetListTab');
        const calendarTabBtn = document.getElementById('calendarTabBtn');
        const pageIndicator = document.querySelector('.page-indicator');
        const navbarTitle = document.querySelector('.navbar h1');
        if(showCalendar) {
            // 恢復記帳頁面狀態（日期、頁面位置和視圖模式）
            restoreJournalPageState();
            // 不再強制設置為日曆模式，使用恢復的狀態
            calendarPage.style.display = 'block';
            if(contentGrid) contentGrid.style.display = 'none';
            assetListTab?.classList.remove('active');
            calendarTabBtn?.classList.add('active');
            if(pageIndicator) {
                pageIndicator.innerHTML = '';
                pageIndicator.style.display = 'none';  // 完全隱藏頁面指示器
            }
            if(navbarTitle) {
                navbarTitle.innerHTML = '<img src="./favico.png" alt="Logo" class="title-logo">記帳';
            }
            // 隱藏右上角的新增和排序按鈕，顯示圖表按鈕和新增按鈕
            const addBtn = document.getElementById('addBtn');
            const sortBtn = document.getElementById('sortBtn');
            const fabWrapper = document.getElementById('journalFabWrapper');
            const settingsBtn = document.getElementById('calendarSettingsBtn');
            const floatingControls = document.getElementById('journalFloatingControls');
            if(addBtn) addBtn.style.display = 'none';
            if(sortBtn) sortBtn.style.display = 'none';
            if(fabWrapper) fabWrapper.style.display = 'flex';
            if(settingsBtn) {
                settingsBtn.style.display = 'block';
            }
            
            // 恢復日期顯示
            const monthYear = document.getElementById('calendarMonthYear');
            if(monthYear) {
                const year = currentCalendarDate.getFullYear();
                const month = currentCalendarDate.getMonth();
                monthYear.textContent = `${year}年${month + 1}月`;
            }
            
            // 恢復收入支出頁面位置
            const journalPageContainer = document.getElementById('journalPageContainer');
            if(journalPageContainer && currentJournalPageIndex !== undefined) {
                const transform = -currentJournalPageIndex * 33.333;
                journalPageContainer.style.transform = `translateX(${transform}%)`;
            }
            
            // 根據恢復的視圖模式顯示對應的內容
            if(journalViewMode === 'chart') {
                const calendarGrid = document.getElementById('calendarGrid');
                const calendarWeekdays = document.querySelector('.calendar-weekdays');
                const monthlyChartContainer = document.getElementById('monthlyChartContainer');
                const journalLineChartContainer = document.getElementById('journalMonthlyLineChartContainer');
                const calendarTransferDetails = document.getElementById('calendarTransferDetails');
                const headerDate = document.getElementById('calendarHeaderDate');
                const headerLinechart = document.getElementById('calendarHeaderLinechart');
                if(calendarGrid) calendarGrid.style.display = 'none';
                if(calendarWeekdays) calendarWeekdays.style.display = 'none';
                if(monthlyChartContainer) {
                    monthlyChartContainer.style.display = 'block';
                    renderMonthlyCharts();
                    initMonthlyChartSwipe();
                }
                if(journalLineChartContainer) journalLineChartContainer.style.display = 'none';
                if(calendarTransferDetails) calendarTransferDetails.style.display = 'none';
                if(headerDate) headerDate.style.display = 'flex';
                if(headerLinechart) headerLinechart.style.display = 'none';
            } else if(journalViewMode === 'linechart') {
                const calendarGrid = document.getElementById('calendarGrid');
                const calendarWeekdays = document.querySelector('.calendar-weekdays');
                const monthlyChartContainer = document.getElementById('monthlyChartContainer');
                const journalLineChartContainer = document.getElementById('journalMonthlyLineChartContainer');
                const calendarTransferDetails = document.getElementById('calendarTransferDetails');
                const headerDate = document.getElementById('calendarHeaderDate');
                const headerLinechart = document.getElementById('calendarHeaderLinechart');
                if(calendarGrid) calendarGrid.style.display = 'none';
                if(calendarWeekdays) calendarWeekdays.style.display = 'none';
                if(monthlyChartContainer) monthlyChartContainer.style.display = 'none';
                if(headerDate) headerDate.style.display = 'none';
                if(headerLinechart) headerLinechart.style.display = 'flex';
                if(journalLineChartContainer) {
                    journalLineChartContainer.style.display = 'block';
                    journalLinechartYear = new Date().getFullYear();
                    const yearEl = document.getElementById('linechartYearDisplay');
                    if(yearEl) yearEl.textContent = journalLinechartYear + '年';
                    buildJournalLinechartCheckboxes();
                    initLinechartDropdownTouch();
                    renderJournalMonthlyLineChart();
                }
                if(calendarTransferDetails) calendarTransferDetails.style.display = 'none';
            } else {
                const calendarGrid = document.getElementById('calendarGrid');
                const calendarWeekdays = document.querySelector('.calendar-weekdays');
                const monthlyChartContainer = document.getElementById('monthlyChartContainer');
                const journalLineChartContainer = document.getElementById('journalMonthlyLineChartContainer');
                const headerDate = document.getElementById('calendarHeaderDate');
                const headerLinechart = document.getElementById('calendarHeaderLinechart');
                if(calendarGrid) calendarGrid.style.display = 'grid';
                if(calendarWeekdays) calendarWeekdays.style.display = 'grid';
                if(monthlyChartContainer) monthlyChartContainer.style.display = 'none';
                if(journalLineChartContainer) journalLineChartContainer.style.display = 'none';
                if(headerDate) headerDate.style.display = 'flex';
                if(headerLinechart) headerLinechart.style.display = 'none';
                renderCalendar();
            }
            // 不顯示今日日期
            const todayDateEl = document.getElementById('calendarTodayDate');
            if(todayDateEl) {
                todayDateEl.style.display = 'none';
            }
            
            // 只有在日曆模式下才顯示詳情
            if(journalViewMode === 'calendar') {
                // 自動選中今天並顯示詳情（如果沒有選中其他日期）
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if(!selectedDate) {
                    // 如果沒有選中日期，自動選中今天並顯示詳情
                    selectedDate = new Date(today);
                    renderCalendar();
                    showFixedTransferDetailsForDate(today);
                } else {
                    // 如果有選中日期，顯示該日期的詳情
                    showFixedTransferDetailsForDate(selectedDate);
                }
            } else {
                // 圖表模式下隱藏詳情
                const calendarTransferDetails = document.getElementById('calendarTransferDetails');
                if(calendarTransferDetails) {
                    calendarTransferDetails.style.display = 'none';
                }
            }
        } else {
            calendarPage.style.display = 'none';
            if(contentGrid) contentGrid.style.display = '';
            assetListTab?.classList.add('active');
            calendarTabBtn?.classList.remove('active');
            
            // 切換到資產頁面時，重置所有圓餅圖高亮
            resetPieChartHighlight('monthlyExpenseTotalChart');
            resetPieChartHighlight('monthlyExpenseChart');
            resetPieChartHighlight('monthlyExpenseAdvanceChart');
            resetPieChartHighlight('monthlyIncomeTotalChart');
            resetPieChartHighlight('monthlyIncomeChart');
            resetPieChartHighlight('monthlyIncomeAdvanceChart');
            
            if(pageIndicator) {
                // 顯示頁面指示器
                pageIndicator.style.display = 'flex';  // 恢復顯示
                // 保存當前頁面索引，避免閃爍
                const savedPage = currentPage;
                // 根據 pageVisibility 動態生成分頁按鈕，只顯示啟用的分頁
                let tabsHTML = '';
                PAGE_TYPES.forEach((type, index) => {
                    if(isPageEnabled(index)) {
                        const pageName = PAGE_NAMES[index];
                        const isActive = index === savedPage ? 'active' : '';
                        tabsHTML += `<button class="page-tab ${isActive}" data-page="${index}" onclick="switchToPage(${index})">${pageName}</button>`;
                    }
                });
                pageIndicator.innerHTML = tabsHTML;
                // 然後調用 switchToPage 來更新內容
                switchToPage(savedPage);
            }
            if(navbarTitle) {
                navbarTitle.innerHTML = '<img src="./favico.png" alt="Logo" class="title-logo">Monee';
            }
            // 顯示右上角的新增和排序按鈕，隱藏記帳 FAB（因在資產頁）
            const addBtn = document.getElementById('addBtn');
            const sortBtn = document.getElementById('sortBtn');
            const fabWrapper = document.getElementById('journalFabWrapper');
            const settingsBtn = document.getElementById('calendarSettingsBtn');
            if(addBtn && !isEditMode) addBtn.style.display = 'block';
            if(sortBtn) sortBtn.style.display = 'none';
            if(fabWrapper) fabWrapper.style.display = 'none';
            if(settingsBtn) settingsBtn.style.display = 'none';
        }
    }
    function changeCalendarMonth(delta) {
        if(journalViewMode !== 'calendar') {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
            saveJournalPageState();
            if(journalViewMode === 'chart') {
                renderMonthlyCharts();
                initMonthlyChartSwipe();
            } else if(journalViewMode === 'linechart') {
                renderJournalMonthlyLineChart();
            }
            const monthYear = document.getElementById('calendarMonthYear');
            if(monthYear) {
                const year = currentCalendarDate.getFullYear();
                const month = currentCalendarDate.getMonth();
                monthYear.textContent = `${year}年${month + 1}月`;
            }
            return;
        }
        
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
        // 保存日期狀態
        saveJournalPageState();
        renderCalendar();
        // 不顯示今日日期
        const todayDateEl = document.getElementById('calendarTodayDate');
        if(todayDateEl) {
            todayDateEl.style.display = 'none';
        }
        
        // 如果之前有選中的日期，重新顯示詳情
        if(selectedDate) {
            showFixedTransferDetailsForDate(selectedDate);
        } else {
            // 如果沒有選中日期，檢查今天是否有固定轉帳
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayTransfers = getFixedTransfersForDate(today);
            if(todayTransfers.length > 0) {
                // 如果今天有固定轉帳，自動選中今天並顯示詳情
                selectedDate = new Date(today);
                renderCalendar();
                showFixedTransferDetailsForDate(today);
            }
        }
    }
    
    function goToCalendarToday() {
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        currentCalendarDate.setTime(today.getTime());
        selectedDate = new Date(today);
        closeCalendarMonthYearDropdown();
        saveJournalPageState();
        if(journalViewMode === 'calendar') {
            renderCalendar();
            showFixedTransferDetailsForDate(today);
        } else if(journalViewMode === 'chart') {
            renderMonthlyCharts();
            var monthYear = document.getElementById('calendarMonthYear');
            if(monthYear) monthYear.textContent = today.getFullYear() + '年' + (today.getMonth() + 1) + '月';
        } else if(journalViewMode === 'linechart') {
            journalLinechartYear = today.getFullYear();
            var yearEl = document.getElementById('linechartYearDisplay');
            if(yearEl) yearEl.textContent = journalLinechartYear + '年';
            buildJournalLinechartCheckboxes();
            renderJournalMonthlyLineChart();
        }
    }
    
    function toggleCalendarMonthYearDropdown(e) {
        e.stopPropagation();
        var parent = document.querySelector('.calendar-month-year');
        if(!parent) return;
        if(parent.classList.contains('open')) {
            parent.classList.remove('open');
            document.removeEventListener('click', closeCalendarMonthYearDropdown);
            return;
        }
        parent.classList.add('open');
        buildCalendarMonthYearDropdown();
        setTimeout(function() { document.addEventListener('click', closeCalendarMonthYearDropdown); }, 0);
    }
    function closeCalendarMonthYearDropdown() {
        var parent = document.querySelector('.calendar-month-year');
        if(parent) parent.classList.remove('open');
        document.removeEventListener('click', closeCalendarMonthYearDropdown);
    }
    function buildCalendarMonthYearDropdown() {
        var yearSel = document.getElementById('calendarYearSelect');
        var grid = document.getElementById('calendarMonthGrid');
        if(!yearSel || !grid) return;
        var y = currentCalendarDate.getFullYear();
        var m = currentCalendarDate.getMonth();
        yearSel.innerHTML = '';
        var startY = y - 5, endY = y + 5;
        for(var i = startY; i <= endY; i++) {
            var opt = document.createElement('option');
            opt.value = i;
            opt.textContent = i + '年';
            if(i === y) opt.selected = true;
            yearSel.appendChild(opt);
        }
        yearSel.onchange = function() { applyCalendarMonthYear(parseInt(yearSel.value, 10), m + 1); };
        grid.innerHTML = '';
        for(var mo = 1; mo <= 12; mo++) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = mo + '月';
            btn.classList.toggle('active', mo === m + 1);
            btn.onclick = (function(monthNum) { return function() { applyCalendarMonthYear(parseInt(yearSel.value, 10), monthNum); }; })(mo);
            grid.appendChild(btn);
        }
    }
    function applyCalendarMonthYear(year, month) {
        currentCalendarDate.setFullYear(year);
        currentCalendarDate.setMonth(month - 1);
        saveJournalPageState();
        renderCalendar();
        if(selectedDate) showFixedTransferDetailsForDate(selectedDate);
        closeCalendarMonthYearDropdown();
    }
    
    // ========== 日期記事功能（必須在 renderCalendar 之前定義）==========
    function formatDateKey(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    function loadDateNotes() {
        const notesKey = `${STORAGE_KEY_DATE_NOTES}_${currentUserId}`;
        return JSON.parse(localStorage.getItem(notesKey) || '{}');
    }
    
    function getDateNote(date) {
        const notes = loadDateNotes();
        const dateStr = formatDateKey(date);
        return notes[dateStr] || '';
    }
    
    function hasDateNote(date) {
        return getDateNote(date) !== '';
    }
    
    let currentNoteDate = null;
    
    function openDateNoteEditor(date) {
        currentNoteDate = new Date(date);
        currentNoteDate.setHours(0, 0, 0, 0);
        
        const modal = document.getElementById('dateNoteModal');
        const modalWrapper = modal.querySelector('.modal-content-wrapper');
        const title = document.getElementById('dateNoteTitle');
        const dateDisplay = document.getElementById('dateNoteDateDisplay');
        const noteInput = document.getElementById('dateNoteInput');
        
        if(title) {
            title.textContent = '記事';
        }
        
        if(dateDisplay) {
            const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
            const dateStr = `${currentNoteDate.getFullYear()}年${currentNoteDate.getMonth() + 1}月${currentNoteDate.getDate()}日 ${weekdays[currentNoteDate.getDay()]}`;
            dateDisplay.textContent = dateStr;
        }
        
        if(noteInput) {
            noteInput.value = getDateNote(currentNoteDate);
        }
        
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
                if(noteInput) {
                    noteInput.focus();
                }
            }, 10);
        });
    }
    
    function closeDateNoteEditor() {
        const modal = document.getElementById('dateNoteModal');
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
        currentNoteDate = null;
    }
    
    function saveDateNoteFromEditor() {
        if(!currentNoteDate) return;
        
        const noteInput = document.getElementById('dateNoteInput');
        const note = noteInput ? noteInput.value.trim() : '';
        
        saveDateNote(currentNoteDate, note);
        renderCalendar(); // 重新渲染日曆以顯示星號
        closeDateNoteEditor();
    }
    
    function saveDateNote(date, note) {
        if (isUserSwitching) return; // 鎖定攔截
        const notesKey = `${STORAGE_KEY_DATE_NOTES}_${currentUserId}`;
        const notes = loadDateNotes();
        const dateStr = formatDateKey(date);
        if(note && note.trim()) {
            notes[dateStr] = note.trim();
        } else {
            delete notes[dateStr];
        }
        localStorage.setItem(notesKey, JSON.stringify(notes));
        
        // 同步到 Firestore
        if (window.syncDateNotesToFirestore && window.firebaseUserLoggedIn) {
            window.syncDateNotesToFirestore(notes);
        }
    }
    
    // ========== 記帳類型選擇器（必須在 openNewExpenseFromCalendar 之前定義）==========
    function openJournalTypeSelector() {
        // 依上次使用的分頁打開對應表單，避免按鈕顯示收入卻開出支出
        if (currentJournalType === 'income') {
            openNewIncome();
        } else if (currentJournalType === 'transfer') {
            openNewTransfer();
        } else {
            openNewExpense();
        }
    }
    
    // 切換記帳表單分頁（在表單上方）
    function switchJournalFormTab(tab) {
        // 切換分頁時立即隱藏日期選擇器，避免閃一下日期頁面
        if (typeof closeDatePicker === 'function') closeDatePicker(true);
        // 轉帳／固定轉帳需至少兩個帳戶，一按就檢查，不切換分頁、不關閉頁面
        if (tab === 'transfer' || tab === 'fixed') {
            const availableAccounts = accounts.filter(acc => acc.type === 'bank' || acc.type === 'debt');
            if (availableAccounts.length < 2) {
                alert(tab === 'transfer' ? '使用轉帳功能需要至少兩個帳戶，請先至「新增」建立兩個以上的帳戶後再試，謝謝您。' : '使用固定轉帳需要至少兩個帳戶，請先至「新增」建立兩個以上的帳戶後再試，謝謝您。');
                return;
            }
        }
        // 檢查是否已經在當前分頁
        if (tab === 'expense' && currentJournalType === 'expense') return;
        if (tab === 'income' && currentJournalType === 'income') return;
        if (tab === 'transfer' && currentJournalType === 'transfer') return;
        // 固定轉帳比較特殊，它可能沒有 currentJournalType 或者有單獨的狀態
        const fixedTransferListModal = document.getElementById('fixedTransferListModal');
        if (tab === 'fixed' && fixedTransferListModal && fixedTransferListModal.style.display === 'block') return;

        // 直接打開對應的表單，不先隱藏舊的，避免露出底層
        if(tab === 'expense') {
            openNewExpense();
        } else if(tab === 'income') {
            openNewIncome();
        } else if(tab === 'transfer') {
            openNewTransfer();
        } else if(tab === 'fixed') {
            openFixedTransferListFromJournal();
        }
        
        // 延遲隱藏其他模態框，讓新的模態框有時間覆蓋上來
        // 同時更新分頁樣式
        setTimeout(() => {
            const allModals = ['expenseModal', 'incomeModal', 'transferModal', 'fixedTransferModal', 'fixedTransferListModal'];
            
            // 找出當前應該顯示的模態框 ID
            let currentModalId = '';
            if(tab === 'expense') currentModalId = 'expenseModal';
            else if(tab === 'income') currentModalId = 'incomeModal';
            else if(tab === 'transfer') currentModalId = 'transferModal';
            else if(tab === 'fixed') currentModalId = 'fixedTransferListModal';

            allModals.forEach(modalId => {
                const modal = document.getElementById(modalId);
                if(modal) {
                    if (modalId === currentModalId) {
                        modal.style.display = 'block';
                    } else {
                        // 如果不是當前要顯示的模態框，則隱藏它
                        modal.style.display = 'none';
                        const modalWrapper = modal.querySelector('.modal-content-wrapper');
                        if(modalWrapper) {
                            modalWrapper.style.transform = 'translateX(100%)';
                        }
                    }

                    // 更新分頁樣式 (針對所有模態框，確保一致性)
                    const tabs = modal.querySelectorAll('.journal-form-tab');
                    tabs.forEach(t => {
                        t.classList.remove('active');
                        t.style.background = 'var(--border-color)';
                        t.style.color = 'var(--text-secondary)';
                        t.style.border = 'none';
                    });
                    
                    // 設置當前分頁為 active
                    tabs.forEach(t => {
                        const text = t.textContent.trim();
                        if ((tab === 'expense' && text === '支出') ||
                            (tab === 'income' && text === '收入') ||
                            (tab === 'transfer' && text === '轉帳') ||
                            (tab === 'fixed' && text === '固定轉帳')) {
                            
                            t.classList.add('active');
                            t.style.background = 'var(--card-bg)';
                            
                            if(tab === 'expense') {
                                t.style.color = 'var(--color-down)'; // 紅色
                                t.style.border = '2px solid var(--color-down)';
                            } else if(tab === 'income') {
                                t.style.color = 'var(--color-up)'; // 綠色
                                t.style.border = '2px solid var(--color-up)';
                            } else if(tab === 'transfer') {
                                t.style.color = '#0a84ff'; // 藍色
                                t.style.border = '2px solid #0a84ff';
                            } else if(tab === 'fixed') {
                                t.style.color = '#ffd60a'; // 黃色
                                t.style.border = '2px solid #ffd60a';
                            }
                        }
                    });
                }
            });
        }, 50);
    }
    
    // 切換記帳分頁
    function switchJournalTab(tab) {
        // 更新 tab 樣式
        document.querySelectorAll('.journal-tab').forEach(t => {
            t.classList.remove('active');
            t.style.background = 'var(--border-color)';
            t.style.color = 'var(--text-secondary)';
        });
        
        const activeTab = document.getElementById(`journalTab${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
        if(activeTab) {
            activeTab.classList.add('active');
            activeTab.style.background = 'var(--card-bg)';
            activeTab.style.color = 'var(--text-primary)';
        }
        
        // 更新內容顯示
        document.querySelectorAll('.journal-tab-content').forEach(c => {
            c.style.display = 'none';
        });
        
        const activeContent = document.getElementById(`journalTabContent${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
        if(activeContent) {
            activeContent.style.display = 'block';
        }
    }
    
    function renderCalendar() {
        const grid = document.getElementById('calendarGrid');
        const monthYear = document.getElementById('calendarMonthYear');
        if(!grid || !monthYear) return;
        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();
        monthYear.textContent = `${year}年${month + 1}月`;
        grid.innerHTML = '';
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        // 計算需要的總天數：從上個月的第一天到當月的最後一天（不包含下個月的日期）
        const lastDayOfMonth = lastDay.getDate();
        const daysInPrevMonth = firstDay.getDay(); // 上個月需要顯示的天數
        const totalDays = daysInPrevMonth + lastDayOfMonth; // 不包含下個月的日期
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selected = selectedDate ? new Date(selectedDate) : null;
        if(selected) selected.setHours(0, 0, 0, 0);
        for(let i = 0; i < totalDays; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            date.setHours(0, 0, 0, 0); // 確保時間部分為0，以便正確比較
            const day = date.getDate();
            const isOtherMonth = date.getMonth() !== month;
            const isToday = date.getTime() === today.getTime();
            const isSelected = selected && date.getTime() === selected.getTime();
            const dayBtn = document.createElement('button');
            dayBtn.className = 'calendar-day';
            dayBtn.textContent = day;
            if(isOtherMonth) dayBtn.classList.add('other-month');
            if(isToday) dayBtn.classList.add('today');
            if(isSelected) dayBtn.classList.add('selected');
            
            // 檢查是否有固定轉帳在這個日期
            const transfers = loadFixedTransfers();
            const dateStr = formatLocalDate(date);
            const dateObj = new Date(date);
            dateObj.setHours(0, 0, 0, 0);
            
            let hasTransfer = false;
            transfers.forEach(transfer => {
                const startDate = new Date(transfer.startDate);
                startDate.setHours(0, 0, 0, 0);
                const endDate = transfer.endDate ? new Date(transfer.endDate) : null;
                if(endDate) endDate.setHours(0, 0, 0, 0);
                
                // 檢查日期是否在範圍內
                if(dateObj >= startDate && (!endDate || dateObj <= endDate)) {
                    // 檢查是否符合重複規則
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
                    
                    if(matches) {
                        hasTransfer = true;
                        dayBtn.classList.add('has-fixed-transfer');
                        dayBtn.style.borderBottom = `3px solid ${transfer.tagColor}`;
                    }
                }
            });
            
            // 檢查是否有記帳記錄在這個日期（使用緩存提高性能）
            const journalDatesSet = getJournalDatesSet();
            const hasJournalRecord = journalDatesSet.has(dateStr);
            if(hasJournalRecord && !hasTransfer) {
                // 如果有記帳記錄但沒有固定轉帳，顯示一個通用標記
                dayBtn.classList.add('has-fixed-transfer');
                dayBtn.style.borderBottom = '3px solid #0a84ff';
            } else if(hasJournalRecord && hasTransfer) {
                // 如果兩者都有，保持固定轉帳的顏色標記
            }
            
            // 檢查是否有記事，如果有則顯示星號框住日期
            if(hasDateNote(date)) {
                dayBtn.style.border = '2px solid #ffd700';
                dayBtn.style.borderRadius = '8px';
                dayBtn.style.boxSizing = 'border-box';
            }
            
            // 使用計時器區分單擊和雙擊（縮短延遲以提升點擊反應）
            let clickTimer = null;
            let clickCount = 0;
            dayBtn.addEventListener('click', (e) => {
                clickCount++;
                if(clickCount === 1) {
                    // 立即視覺回饋：先標示選中狀態
                    grid.querySelectorAll('.calendar-day.selected').forEach(el => el.classList.remove('selected'));
                    dayBtn.classList.add('selected');
                    clickTimer = setTimeout(() => {
                        selectDate(date);
                        clickCount = 0;
                    }, 180);
                } else if(clickCount === 2) {
                    clearTimeout(clickTimer);
                    e.stopPropagation();
                    selectDate(date);
                    setTimeout(() => openDateNoteEditor(date), 50);
                    clickCount = 0;
                }
            });
            grid.appendChild(dayBtn);
        }
    }
    function selectDate(date) {
        selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0); // 確保時間部分為 00:00:00
        renderCalendar();
        console.log('Selected date:', selectedDate.toLocaleDateString('zh-TW'));
        // 下一幀再更新詳情區，讓日曆先完成繪製，操作更順暢
        requestAnimationFrame(() => { showFixedTransferDetailsForDate(date); });
    }
    
    // 當前記帳詳情的分頁索引（0: 支出, 1: 收入, 2: 轉帳）
    let currentJournalPageIndex = 0;
    // 記帳顯示模式：'calendar' 日曆記帳趣 | 'chart' 收支圓餅圖 | 'linechart' 收支趨勢圖
    let journalViewMode = 'calendar';
    // 月份圓餅圖當前分頁索引（0: 支出, 1: 收入）
    let currentMonthlyChartIndex = 0;
    // 支出圖表當前視圖（'total': 總支出, 'normal': 原始支出, 'advance': 代墊）
    let currentExpenseChartView = 'total';
    // 收入圖表當前視圖（'total': 總收入, 'normal': 原始收入, 'advance': 代墊）
    let currentIncomeChartView = 'total';
    // 收支趨勢圖勾選
    let journalLinechartExpenseTotal = true;
    let journalLinechartExpenseNormal = false;   // 原始支出
    let journalLinechartExpenseAdvance = false;  // 代墊
    let journalLinechartIncomeTotal = true;
    let journalLinechartIncomeNormal = false;    // 原始收入
    let journalLinechartIncomeAdvance = false;   // 代墊
    let journalLinechartExpenseCategories = {};  // { 房租: true, 食物: true }
    let journalLinechartIncomeCategories = {};
    let journalLinechartYear = new Date().getFullYear();  // 收支趨勢圖顯示年份
    // 記帳日程圖表動畫引擎
    let monthlyExpenseChartAnimationEngine = null;
    let monthlyExpenseAdvanceChartAnimationEngine = null;
    let monthlyIncomeChartAnimationEngine = null;
    let monthlyIncomeAdvanceChartAnimationEngine = null;
    
    // 切換 FAB 展開/收合
    function toggleJournalFab() {
        const wrapper = document.getElementById('journalFabWrapper');
        if(wrapper) wrapper.classList.toggle('expanded');
    }
    
    // 選擇記帳視圖模式：calendar 日曆記帳趣 | chart 收支圓餅圖 | linechart 收支趨勢圖
    function selectJournalView(mode) {
        journalViewMode = mode;
        saveJournalPageState();
        
        const fabWrapper = document.getElementById('journalFabWrapper');
        if(fabWrapper) fabWrapper.classList.remove('expanded');
        
        const calendarGrid = document.getElementById('calendarGrid');
        const calendarWeekdays = document.querySelector('.calendar-weekdays');
        const monthlyChartContainer = document.getElementById('monthlyChartContainer');
        const journalLineChartContainer = document.getElementById('journalMonthlyLineChartContainer');
        const calendarTransferDetails = document.getElementById('calendarTransferDetails');
        
        const headerDate = document.getElementById('calendarHeaderDate');
        const headerLinechart = document.getElementById('calendarHeaderLinechart');
        
        if(mode === 'calendar') {
            if(calendarGrid) calendarGrid.style.display = 'grid';
            if(calendarWeekdays) calendarWeekdays.style.display = 'grid';
            if(monthlyChartContainer) monthlyChartContainer.style.display = 'none';
            if(journalLineChartContainer) journalLineChartContainer.style.display = 'none';
            if(calendarTransferDetails) calendarTransferDetails.style.display = 'block';
            if(headerDate) headerDate.style.display = 'flex';
            if(headerLinechart) headerLinechart.style.display = 'none';
            resetPieChartHighlight('monthlyExpenseTotalChart');
            resetPieChartHighlight('monthlyExpenseChart');
            resetPieChartHighlight('monthlyExpenseAdvanceChart');
            resetPieChartHighlight('monthlyIncomeTotalChart');
            resetPieChartHighlight('monthlyIncomeChart');
            resetPieChartHighlight('monthlyIncomeAdvanceChart');
            renderCalendar();
            if(selectedDate) {
                showFixedTransferDetailsForDate(selectedDate);
            } else {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                selectedDate = new Date(today);
                renderCalendar();
                showFixedTransferDetailsForDate(today);
            }
        } else if(mode === 'chart') {
            if(calendarGrid) calendarGrid.style.display = 'none';
            if(calendarWeekdays) calendarWeekdays.style.display = 'none';
            if(monthlyChartContainer) {
                monthlyChartContainer.style.display = 'block';
                renderMonthlyCharts();
                initMonthlyChartSwipe();
            }
            if(journalLineChartContainer) journalLineChartContainer.style.display = 'none';
            if(calendarTransferDetails) calendarTransferDetails.style.display = 'none';
            if(headerDate) headerDate.style.display = 'flex';
            if(headerLinechart) headerLinechart.style.display = 'none';
        } else if(mode === 'linechart') {
            if(calendarGrid) calendarGrid.style.display = 'none';
            if(calendarWeekdays) calendarWeekdays.style.display = 'none';
            if(monthlyChartContainer) monthlyChartContainer.style.display = 'none';
            if(journalLineChartContainer) {
                journalLineChartContainer.style.display = 'block';
                journalLinechartYear = new Date().getFullYear();
                const yearEl = document.getElementById('linechartYearDisplay');
                if(yearEl) yearEl.textContent = journalLinechartYear + '年';
                buildJournalLinechartCheckboxes();
                initLinechartDropdownTouch();
                renderJournalMonthlyLineChart();
            }
            if(calendarTransferDetails) calendarTransferDetails.style.display = 'none';
            if(headerDate) headerDate.style.display = 'none';
            if(headerLinechart) headerLinechart.style.display = 'flex';
        }
    }
    
    // 渲染月份圓餅圖
    function renderMonthlyCharts() {
        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();
        
        // 獲取該月份的所有記帳記錄
        const records = loadJournalRecords();
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);
        monthStart.setHours(0, 0, 0, 0);
        monthEnd.setHours(23, 59, 59, 999);
        
        const monthRecords = records.filter(record => {
            if(!record.date) return false;
            const recordDate = new Date(record.date);
            recordDate.setHours(0, 0, 0, 0);
            return recordDate >= monthStart && recordDate <= monthEnd;
        });
        
        // 分類記錄
        const expenseRecords = monthRecords.filter(r => r.type === 'expense');
        const incomeRecords = monthRecords.filter(r => r.type === 'income');
        
        // 根據代墊狀態分類
        const expenseRecordsNormal = expenseRecords.filter(r => !r.isAdvance);
        const expenseRecordsAdvance = expenseRecords.filter(r => r.isAdvance);
        const incomeRecordsNormal = incomeRecords.filter(r => !r.isAdvance);
        const incomeRecordsAdvance = incomeRecords.filter(r => r.isAdvance);
        
        // 計算各類別的總金額
        const totalExpense = expenseRecords.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
        const totalExpenseNormal = expenseRecordsNormal.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
        const totalExpenseAdvance = expenseRecordsAdvance.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
        
        const totalIncome = incomeRecords.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
        const totalIncomeNormal = incomeRecordsNormal.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
        const totalIncomeAdvance = incomeRecordsAdvance.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
        
        // 更新總金額顯示
        const expenseTotalElement = document.getElementById('monthlyExpenseTotal');
        const expenseNormalTotalElement = document.getElementById('monthlyExpenseNormalTotal');
        const expenseAdvanceTotalElement = document.getElementById('monthlyExpenseAdvanceTotal');
        const incomeTotalElement = document.getElementById('monthlyIncomeTotal');
        const incomeNormalTotalElement = document.getElementById('monthlyIncomeNormalTotal');
        const incomeAdvanceTotalElement = document.getElementById('monthlyIncomeAdvanceTotal');
        
        if(expenseTotalElement) {
            expenseTotalElement.textContent = `總支出：$${totalExpense.toLocaleString()}`;
        }
        if(expenseNormalTotalElement) {
            expenseNormalTotalElement.textContent = `原始支出：$${totalExpenseNormal.toLocaleString()}`;
        }
        if(expenseAdvanceTotalElement) {
            expenseAdvanceTotalElement.textContent = `代墊：$${totalExpenseAdvance.toLocaleString()}`;
        }
        if(incomeTotalElement) {
            incomeTotalElement.textContent = `總收入：$${totalIncome.toLocaleString()}`;
        }
        if(incomeNormalTotalElement) {
            incomeNormalTotalElement.textContent = `原始收入：$${totalIncomeNormal.toLocaleString()}`;
        }
        if(incomeAdvanceTotalElement) {
            incomeAdvanceTotalElement.textContent = `代墊：$${totalIncomeAdvance.toLocaleString()}`;
        }
        
        // 在重新渲染前，先清除所有圓餅圖的高亮狀態和中心文字
        resetPieChartHighlight('monthlyExpenseTotalChart');
        resetPieChartHighlight('monthlyExpenseChart');
        resetPieChartHighlight('monthlyExpenseAdvanceChart');
        resetPieChartHighlight('monthlyIncomeTotalChart');
        resetPieChartHighlight('monthlyIncomeChart');
        resetPieChartHighlight('monthlyIncomeAdvanceChart');
        
        // 渲染支出圓餅圖（合計、一般、代墊）
        renderMonthlyPieChart('expense', expenseRecords, 'monthlyExpenseTotalChart');
        renderMonthlyPieChart('expense', expenseRecordsNormal, 'monthlyExpenseChart');
        renderMonthlyPieChart('expense', expenseRecordsAdvance, 'monthlyExpenseAdvanceChart');
        
        // 渲染收入圓餅圖（合計、一般、代墊）
        renderMonthlyPieChart('income', incomeRecords, 'monthlyIncomeTotalChart');
        renderMonthlyPieChart('income', incomeRecordsNormal, 'monthlyIncomeChart');
        renderMonthlyPieChart('income', incomeRecordsAdvance, 'monthlyIncomeAdvanceChart');
        
        // 確保切換到當前顯示的圖表
        switchMonthlyChartPage(currentMonthlyChartIndex);
        
        // 動態設定卡片（page-item）的 max-height，根據螢幕長短調整
        setTimeout(() => {
            const pageItems = document.querySelectorAll('#monthlyChartSwiper .page-item');
            pageItems.forEach(item => {
                const itemRect = item.getBoundingClientRect();
                const bottomNavHeight = 70;
                const availableHeight = window.innerHeight - itemRect.top - bottomNavHeight;
                item.style.maxHeight = Math.max(availableHeight, 200) + 'px';
            });
        }, 60);
        
        // 監聽視窗大小改變，自動重新調整圓餅圖
        if(!window.monthlyChartResizeHandler) {
            let resizeTimeout;
            window.monthlyChartResizeHandler = () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    // 重新渲染所有圓餅圖以應用新的響應式配置
                    if(journalViewMode === 'chart') {
                        renderMonthlyCharts();
                    } else if(journalViewMode === 'linechart') {
                        renderJournalMonthlyLineChart();
                    }
                }, 300); // 防抖處理
            };
            window.addEventListener('resize', window.monthlyChartResizeHandler);
        }
    }
    
    // 收支趨勢圖：切換下拉開關（手機版：快速滑動後切換時，延遲開啟新選單以釋放 touch 捲動鎖定）
    let _linechartSwitchTimer = null;
    function toggleLinechartDropdown(type, e) {
        e.stopPropagation();
        if(_linechartSwitchTimer) { clearTimeout(_linechartSwitchTimer); _linechartSwitchTimer = null; }
        const expenseDd = document.getElementById('linechartExpenseDropdown');
        const incomeDd = document.getElementById('linechartIncomeDropdown');
        const expenseOpen = expenseDd?.classList.contains('open');
        const incomeOpen = incomeDd?.classList.contains('open');
        const isSwitching = (type === 'expense' && incomeOpen) || (type === 'income' && expenseOpen);
        if(isSwitching) {
            expenseDd?.classList.remove('open');
            incomeDd?.classList.remove('open');
            const openTarget = type === 'expense' ? expenseDd : incomeDd;
            const panel = type === 'expense' ? document.getElementById('linechartExpensePanel') : document.getElementById('linechartIncomePanel');
            _linechartSwitchTimer = setTimeout(function() {
                _linechartSwitchTimer = null;
                openTarget?.classList.add('open');
                if(panel) { panel.scrollTop = 0; }
            }, 50);
        } else {
            if(type === 'expense') {
                expenseDd?.classList.toggle('open');
                incomeDd?.classList.remove('open');
            } else {
                incomeDd?.classList.toggle('open');
                expenseDd?.classList.remove('open');
            }
        }
    }
    
    // 點擊頁面關閉趨勢圖下拉
    document.addEventListener('click', function() {
        document.getElementById('linechartExpenseDropdown')?.classList.remove('open');
        document.getElementById('linechartIncomeDropdown')?.classList.remove('open');
    });
    
    // 收支趨勢圖：防止下拉選單捲動時被父層 touch 攔截
    function initLinechartDropdownTouch() {
        const panels = [document.getElementById('linechartExpensePanel'), document.getElementById('linechartIncomePanel')];
        const stopTouch = (e) => e.stopPropagation();
        panels.forEach(p => {
            if(!p || p._linechartTouchInit) return;
            p._linechartTouchInit = true;
            p.addEventListener('touchstart', stopTouch, { passive: true });
            p.addEventListener('touchmove', stopTouch, { passive: true });
        });
    }
    
    // 收支趨勢圖：建立支出/收入細項勾選清單（分層分組：總覽 + 細項）
    function buildJournalLinechartCheckboxes() {
        const records = loadJournalRecords();
        const expenseCats = new Set();
        const incomeCats = new Set();
        records.forEach(r => {
            const cat = r.category || '其他';
            if(r.type === 'expense') expenseCats.add(cat);
            else if(r.type === 'income') incomeCats.add(cat);
        });
        
        const expensePanel = document.getElementById('linechartExpensePanel');
        const incomePanel = document.getElementById('linechartIncomePanel');
        if(!expensePanel || !incomePanel) return;
        
        expensePanel.innerHTML = '';
        // 總覽：總支出、原始支出、代墊
        const expOverviewTitle = document.createElement('div');
        expOverviewTitle.className = 'linechart-dropdown-section';
        expOverviewTitle.textContent = '總覽';
        expensePanel.appendChild(expOverviewTitle);
        ['總支出','原始支出','代墊'].forEach(key => {
            const checked = key === '總支出' ? journalLinechartExpenseTotal : (key === '原始支出' ? journalLinechartExpenseNormal : journalLinechartExpenseAdvance);
            const div = document.createElement('div');
            div.className = 'dropdown-check-item';
            div.innerHTML = `<input type="checkbox" ${checked ? 'checked' : ''} data-cat="${key}" onchange="updateLinechartCategory('expense', this.dataset.cat, this.checked, this)"><label>${key}</label>`;
            expensePanel.appendChild(div);
        });
        const expDivider = document.createElement('div');
        expDivider.className = 'linechart-dropdown-divider';
        expensePanel.appendChild(expDivider);
        const expDetailTitle = document.createElement('div');
        expDetailTitle.className = 'linechart-dropdown-section';
        expDetailTitle.textContent = '細項';
        expensePanel.appendChild(expDetailTitle);
        [...expenseCats].sort().forEach(cat => {
            const checked = journalLinechartExpenseCategories[cat] || false;
            const div = document.createElement('div');
            div.className = 'dropdown-check-item';
            div.innerHTML = `<input type="checkbox" ${checked ? 'checked' : ''} data-cat="${(cat || '').replace(/"/g,'&quot;')}" onchange="updateLinechartCategory('expense', this.dataset.cat, this.checked, this)"><label>${cat}</label>`;
            expensePanel.appendChild(div);
        });
        
        incomePanel.innerHTML = '';
        const incOverviewTitle = document.createElement('div');
        incOverviewTitle.className = 'linechart-dropdown-section';
        incOverviewTitle.textContent = '總覽';
        incomePanel.appendChild(incOverviewTitle);
        ['總收入','原始收入','代墊'].forEach(key => {
            const checked = key === '總收入' ? journalLinechartIncomeTotal : (key === '原始收入' ? journalLinechartIncomeNormal : journalLinechartIncomeAdvance);
            const div = document.createElement('div');
            div.className = 'dropdown-check-item';
            div.innerHTML = `<input type="checkbox" ${checked ? 'checked' : ''} data-cat="${key}" onchange="updateLinechartCategory('income', this.dataset.cat, this.checked, this)"><label>${key}</label>`;
            incomePanel.appendChild(div);
        });
        const incDivider = document.createElement('div');
        incDivider.className = 'linechart-dropdown-divider';
        incomePanel.appendChild(incDivider);
        const incDetailTitle = document.createElement('div');
        incDetailTitle.className = 'linechart-dropdown-section';
        incDetailTitle.textContent = '細項';
        incomePanel.appendChild(incDetailTitle);
        [...incomeCats].sort().forEach(cat => {
            const checked = journalLinechartIncomeCategories[cat] || false;
            const div = document.createElement('div');
            div.className = 'dropdown-check-item';
            div.innerHTML = `<input type="checkbox" ${checked ? 'checked' : ''} data-cat="${(cat || '').replace(/"/g,'&quot;')}" onchange="updateLinechartCategory('income', this.dataset.cat, this.checked, this)"><label>${cat}</label>`;
            incomePanel.appendChild(div);
        });
        
        updateLinechartSelectionLabel('expense');
        updateLinechartSelectionLabel('income');
    }
    
    // 收支趨勢圖：更新勾選狀態（至少須勾選一項，否則不允許取消）
    function updateLinechartCategory(type, key, checked, checkboxEl) {
        if(!checked) {
            const hasExp = () => journalLinechartExpenseTotal || journalLinechartExpenseNormal || journalLinechartExpenseAdvance || Object.values(journalLinechartExpenseCategories).some(Boolean);
            const hasInc = () => journalLinechartIncomeTotal || journalLinechartIncomeNormal || journalLinechartIncomeAdvance || Object.values(journalLinechartIncomeCategories).some(Boolean);
            const wouldExp = () => {
                if(type !== 'expense') return hasExp();
                if(key === '總支出') return journalLinechartExpenseNormal || journalLinechartExpenseAdvance || Object.values(journalLinechartExpenseCategories).some(Boolean);
                if(key === '原始支出') return journalLinechartExpenseTotal || journalLinechartExpenseAdvance || Object.values(journalLinechartExpenseCategories).some(Boolean);
                if(key === '代墊') return journalLinechartExpenseTotal || journalLinechartExpenseNormal || Object.values(journalLinechartExpenseCategories).some(Boolean);
                return journalLinechartExpenseTotal || journalLinechartExpenseNormal || journalLinechartExpenseAdvance || Object.keys(journalLinechartExpenseCategories).some(k => k !== key && journalLinechartExpenseCategories[k]);
            };
            const wouldInc = () => {
                if(type !== 'income') return hasInc();
                if(key === '總收入') return journalLinechartIncomeNormal || journalLinechartIncomeAdvance || Object.values(journalLinechartIncomeCategories).some(Boolean);
                if(key === '原始收入') return journalLinechartIncomeTotal || journalLinechartIncomeAdvance || Object.values(journalLinechartIncomeCategories).some(Boolean);
                if(key === '代墊') return journalLinechartIncomeTotal || journalLinechartIncomeNormal || Object.values(journalLinechartIncomeCategories).some(Boolean);
                return journalLinechartIncomeTotal || journalLinechartIncomeNormal || journalLinechartIncomeAdvance || Object.keys(journalLinechartIncomeCategories).some(k => k !== key && journalLinechartIncomeCategories[k]);
            };
            if(!wouldExp() && !wouldInc()) {
                if(checkboxEl) checkboxEl.checked = true;
                if(typeof toast === 'function') toast('請至少勾選一項支出或收入');
                else alert('請至少勾選一項支出或收入');
                return;
            }
        }
        if(type === 'expense') {
            if(key === '總支出') journalLinechartExpenseTotal = checked;
            else if(key === '原始支出') journalLinechartExpenseNormal = checked;
            else if(key === '代墊') journalLinechartExpenseAdvance = checked;
            else journalLinechartExpenseCategories[key] = checked;
        } else {
            if(key === '總收入') journalLinechartIncomeTotal = checked;
            else if(key === '原始收入') journalLinechartIncomeNormal = checked;
            else if(key === '代墊') journalLinechartIncomeAdvance = checked;
            else journalLinechartIncomeCategories[key] = checked;
        }
        updateLinechartSelectionLabel(type);
        renderJournalMonthlyLineChart();
    }
    
    // 收支趨勢圖：按鈕固定顯示「支出」「收入」，不隨勾選變動
    function updateLinechartSelectionLabel(type) {
        const label = document.getElementById(type === 'expense' ? 'linechartExpenseLabel' : 'linechartIncomeLabel');
        if(label) label.textContent = type === 'expense' ? '支出' : '收入';
    }
    
    // 收支趨勢圖：切換年份（防連點）
    function changeLinechartYear(delta, e) {
        if(e) { e.preventDefault(); e.stopPropagation(); }
        const now = Date.now();
        if(changeLinechartYear._lastClick && now - changeLinechartYear._lastClick < 400) return;
        changeLinechartYear._lastClick = now;
        journalLinechartYear += delta;
        const el = document.getElementById('linechartYearDisplay');
        if(el) el.textContent = journalLinechartYear + '年';
        renderJournalMonthlyLineChart();
    }
    
    // 收支趨勢圖：恢復預設顯示（總支出 + 總收入）
    function resetLinechartSelections() {
        journalLinechartExpenseTotal = true;
        journalLinechartExpenseNormal = false;
        journalLinechartExpenseAdvance = false;
        journalLinechartExpenseCategories = {};
        journalLinechartIncomeTotal = true;
        journalLinechartIncomeNormal = false;
        journalLinechartIncomeAdvance = false;
        journalLinechartIncomeCategories = {};
        buildJournalLinechartCheckboxes();
        renderJournalMonthlyLineChart();
    }
    
    // 渲染記帳收支趨勢圖（選定年份 1–12 月）- 勾選選項疊加為多條折線
    function renderJournalMonthlyLineChart() {
        const chartContainer = document.getElementById('journalMonthlyLineChart');
        if(!chartContainer || typeof Highcharts === 'undefined') return;
        const yearEl = document.getElementById('linechartYearDisplay');
        if(yearEl) yearEl.textContent = journalLinechartYear + '年';
        
        const records = loadJournalRecords();
        const year = journalLinechartYear;
        const monthLabels = [];
        
        const colorDown = getComputedStyle(document.documentElement).getPropertyValue('--color-down').trim() || '#ff453a';
        const colorUp = getComputedStyle(document.documentElement).getPropertyValue('--color-up').trim() || '#30d158';
        const allColors = [colorDown, colorUp, '#ff9500', '#ffcc00', '#34c759', '#5ac8fa', '#007aff', '#5856d6', '#af52de', '#ff2d55', '#0a84ff', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#f97316', '#eab308'];
        
        const expenseSeries = [];
        if(journalLinechartExpenseTotal) expenseSeries.push({ name: '總支出', filter: r => r.type === 'expense' });
        if(journalLinechartExpenseNormal) expenseSeries.push({ name: '原始支出', filter: r => r.type === 'expense' && !r.isAdvance });
        if(journalLinechartExpenseAdvance) expenseSeries.push({ name: '代墊', filter: r => r.type === 'expense' && r.isAdvance });
        Object.keys(journalLinechartExpenseCategories).filter(k => journalLinechartExpenseCategories[k]).forEach(cat => {
            expenseSeries.push({ name: cat, filter: r => r.type === 'expense' && (r.category || '其他') === cat });
        });
        
        const incomeSeries = [];
        if(journalLinechartIncomeTotal) incomeSeries.push({ name: '總收入', filter: r => r.type === 'income' });
        if(journalLinechartIncomeNormal) incomeSeries.push({ name: '原始收入', filter: r => r.type === 'income' && !r.isAdvance });
        if(journalLinechartIncomeAdvance) incomeSeries.push({ name: '代墊', filter: r => r.type === 'income' && r.isAdvance });
        Object.keys(journalLinechartIncomeCategories).filter(k => journalLinechartIncomeCategories[k]).forEach(cat => {
            incomeSeries.push({ name: cat, filter: r => r.type === 'income' && (r.category || '其他') === cat });
        });
        
        const allSeries = [];
        expenseSeries.forEach((s, i) => {
            const data = [];
            for(let j = 0; j < 12; j++) {
                const d = new Date(year, j, 1);
                const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
                const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                monthStart.setHours(0, 0, 0, 0);
                monthEnd.setHours(23, 59, 59, 999);
                const monthRecords = records.filter(r => {
                    if(!r.date) return false;
                    const rd = new Date(r.date);
                    rd.setHours(0, 0, 0, 0);
                    return rd >= monthStart && rd <= monthEnd;
                });
                const sum = monthRecords.filter(s.filter).reduce((a, r) => a + (parseFloat(r.amount) || 0), 0);
                data.push(Math.round(sum));
            }
            allSeries.push({ name: s.name, data: data, color: allColors[allSeries.length % allColors.length] });
        });
        incomeSeries.forEach((s, i) => {
            const data = [];
            for(let j = 0; j < 12; j++) {
                const d = new Date(year, j, 1);
                const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
                const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                monthStart.setHours(0, 0, 0, 0);
                monthEnd.setHours(23, 59, 59, 999);
                const monthRecords = records.filter(r => {
                    if(!r.date) return false;
                    const rd = new Date(r.date);
                    rd.setHours(0, 0, 0, 0);
                    return rd >= monthStart && rd <= monthEnd;
                });
                const sum = monthRecords.filter(s.filter).reduce((a, r) => a + (parseFloat(r.amount) || 0), 0);
                data.push(Math.round(sum));
            }
            allSeries.push({ name: s.name, data: data, color: allColors[allSeries.length % allColors.length] });
        });
        
        for(let i = 0; i < 12; i++) {
            monthLabels.push(`${i + 1}月`);
        }
        
        const chartTextColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#fff';
        
        if(chartContainer.chartInstance) {
            chartContainer.chartInstance.destroy();
            chartContainer.chartInstance = null;
        }
        
        chartContainer.chartInstance = Highcharts.chart('journalMonthlyLineChart', {
            chart: { type: 'line', backgroundColor: 'transparent', height: 280 },
            title: { text: '' },
            credits: { enabled: false },
            legend: {
                enabled: true,
                align: 'center',
                verticalAlign: 'top',
                itemStyle: { color: chartTextColor, fontSize: '12px' }
            },
            xAxis: {
                categories: monthLabels,
                labels: { style: { color: chartTextColor, fontSize: '11px' } },
                lineColor: 'rgba(255,255,255,0.1)',
                tickColor: 'rgba(255,255,255,0.1)'
            },
            yAxis: {
                title: { text: '' },
                labels: {
                    style: { color: chartTextColor },
                    formatter: function() {
                        const v = this.value;
                        if(Math.abs(v) >= 10000) return (v/10000).toFixed(0) + '萬';
                        return v.toLocaleString();
                    }
                },
                gridLineColor: 'rgba(255,255,255,0.05)',
                lineColor: 'rgba(255,255,255,0.1)'
            },
            tooltip: {
                enabled: true,
                shared: false,
                useHTML: true,
                stickOnContact: true,
                backgroundColor: 'rgba(30,30,30,0.95)',
                borderColor: 'rgba(255,255,255,0.2)',
                borderRadius: 8,
                style: { color: '#fff', fontSize: '13px' },
                formatter: function() {
                    const p = this.point;
                    return `<b>分類：${p.series.name}</b><br/>月份：${year}年${p.category}<br/>金額：$${(p.y||0).toLocaleString()}`;
                }
            },
            plotOptions: {
                line: { marker: { radius: 4 }, lineWidth: 2 }
            },
            series: allSeries
        });
    }
    
    // 獲取響應式圓餅圖配置（根據螢幕寬度）
    // 新方案：圓餅圖更大，不顯示標籤（標籤信息在下方列表中顯示）
    function getResponsivePieChartConfig() {
        // 圓餅圖更大，中間空白區域也更大以容納文字
        return {
            pieSize: '90%',  // 更大的圓餅圖
            innerSize: '50%',  // 中間空白區域要夠大以容納文字（與 highlightPieChartSlice 中的 innerSizePercent 保持一致）
            labelDistance: 0,  // 不顯示標籤
            labelFontSize: '0px',  // 不顯示
            spacing: [20, 20, 20, 20],  // 標準間距
            margin: [10, 10, 10, 10]  // 標準邊距
        };
    }
    
    // 渲染單個月份圓餅圖
    function renderMonthlyPieChart(type, records, chartId) {
        const chartContainer = document.getElementById(chartId);
        if(!chartContainer || typeof Highcharts === 'undefined') {
            return;
        }
        
        // 如果沒有記錄，銷毀圖表並顯示提示文字
        if(!records || records.length === 0) {
            // 銷毀圖表實例（如果存在）
            if(chartContainer.chartInstance) {
                chartContainer.chartInstance.destroy();
                chartContainer.chartInstance = null;
            }
            
            // 清除動畫引擎引用
            if(chartId === 'monthlyExpenseChart') {
                monthlyExpenseChartAnimationEngine = null;
            } else if(chartId === 'monthlyExpenseAdvanceChart') {
                monthlyExpenseAdvanceChartAnimationEngine = null;
            } else if(chartId === 'monthlyIncomeChart') {
                monthlyIncomeChartAnimationEngine = null;
            } else if(chartId === 'monthlyIncomeAdvanceChart') {
                monthlyIncomeAdvanceChartAnimationEngine = null;
            }
            
            // 清除容器並顯示提示文字
            chartContainer.innerHTML = '';
            const emptyDiv = document.createElement('div');
            emptyDiv.style.cssText = 'text-align: center; padding: 50px; color: var(--text-secondary);';
            emptyDiv.textContent = '該月份沒有' + (type === 'expense' ? '支出' : '收入') + '記錄';
            chartContainer.appendChild(emptyDiv);
            // 清空對應的詳細列表
            renderMonthlyChartList(type, [], chartId);
            return;
        }
        
        // 按分類統計
        const categoryData = {};
        records.forEach(record => {
            const category = record.category || '其他';
            if(!categoryData[category]) {
                categoryData[category] = 0;
            }
            categoryData[category] += parseFloat(record.amount) || 0;
        });
        
        // 顏色配置
        const colors = type === 'expense' 
            ? ['#ff453a', '#ff9500', '#ffcc00', '#34c759', '#5ac8fa', '#007aff', '#5856d6', '#af52de', '#ff2d55']  // 支出：多色系
            : ['#34c759', '#5ac8fa', '#007aff', '#0a84ff', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#fbbf24', '#30d158', '#32d74b', '#4ade80', '#22c55e'];  // 收入：綠色+藍色+彩虹色
        
        // 轉換為Highcharts格式（不在此處指定顏色，使用plotOptions中的colors數組）
        const chartData = Object.keys(categoryData).map(category => ({
            name: category,
            y: categoryData[category]
        }));
        
        // 轉換為帶顏色的數據格式
        const chartDataWithColors = chartData.map((item, index) => ({
            name: item.name,
            y: item.y,
            color: colors[index % colors.length]
        }));
        
        const chartTextColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#ffffff';
        // 確保圖表容器設定
        if(chartContainer) {
            chartContainer.style.overflow = 'visible';
            chartContainer.style.position = 'relative';
        }
        
        // 先清除所有提示文字（無論圖表實例是否存在）
        const emptyMessageDiv = chartContainer.querySelector('div');
        if(emptyMessageDiv && emptyMessageDiv.textContent && emptyMessageDiv.textContent.includes('該月份沒有')) {
            emptyMessageDiv.remove();
        }
        // 如果容器中有提示文字但沒有圖表 SVG，清除所有內容
        if(chartContainer.innerHTML && !chartContainer.querySelector('svg')) {
            chartContainer.innerHTML = '';
        }
        
        // 如果圖表已存在且有系列，使用動畫引擎更新
        if(chartContainer.chartInstance && chartContainer.chartInstance.series && chartContainer.chartInstance.series.length > 0) {
            // 初始化動畫引擎（如果還沒有）
            let animationEngine = null;
            if(chartId === 'monthlyExpenseChart') {
                if(!monthlyExpenseChartAnimationEngine) {
                    monthlyExpenseChartAnimationEngine = new ChartAnimationEngine(chartContainer.chartInstance);
                }
                animationEngine = monthlyExpenseChartAnimationEngine;
            } else if(chartId === 'monthlyExpenseAdvanceChart') {
                if(!monthlyExpenseAdvanceChartAnimationEngine) {
                    monthlyExpenseAdvanceChartAnimationEngine = new ChartAnimationEngine(chartContainer.chartInstance);
                }
                animationEngine = monthlyExpenseAdvanceChartAnimationEngine;
            } else if(chartId === 'monthlyIncomeChart') {
                if(!monthlyIncomeChartAnimationEngine) {
                    monthlyIncomeChartAnimationEngine = new ChartAnimationEngine(chartContainer.chartInstance);
                }
                animationEngine = monthlyIncomeChartAnimationEngine;
            } else if(chartId === 'monthlyIncomeAdvanceChart') {
                if(!monthlyIncomeAdvanceChartAnimationEngine) {
                    monthlyIncomeAdvanceChartAnimationEngine = new ChartAnimationEngine(chartContainer.chartInstance);
                }
                animationEngine = monthlyIncomeAdvanceChartAnimationEngine;
            }
            
            // 使用動畫引擎更新圖表
            if(animationEngine) {
                // 在更新前先清除高亮狀態和中心文字
                resetPieChartHighlight(chartId);
                animationEngine.animate({
                    newData: chartDataWithColors,
                    animationType: 'switch',
                    duration: CHART_ANIMATION_CONFIG.duration,
                    easing: CHART_ANIMATION_CONFIG.easing
                });
                // 動畫完成後，如果沒有高亮狀態，清除中心文字
                // 注意：這裡不清除，因為用戶可能正在點擊細項，應該由 resetPieChartHighlight 來清除
                return; // 動畫引擎會處理更新，不需要重新創建圖表
            }
        }
        
        // 銷毀舊圖表（如果存在）
        if(chartContainer.chartInstance) {
            chartContainer.chartInstance.destroy();
            chartContainer.chartInstance = null;
        }
        
        // 清除動畫引擎引用（如果圖表被銷毀）
        if(chartId === 'monthlyExpenseChart') {
            monthlyExpenseChartAnimationEngine = null;
        } else if(chartId === 'monthlyExpenseAdvanceChart') {
            monthlyExpenseAdvanceChartAnimationEngine = null;
        } else if(chartId === 'monthlyIncomeChart') {
            monthlyIncomeChartAnimationEngine = null;
        } else if(chartId === 'monthlyIncomeAdvanceChart') {
            monthlyIncomeAdvanceChartAnimationEngine = null;
        }
        
        // 確保容器完全清空（包括任何提示文字和DOM元素）
        // 但保留自定義文字容器（如果存在），稍後會重新設置
        const existingTextContainer = chartContainer.querySelector('.pie-chart-center-text');
        while(chartContainer.firstChild) {
            chartContainer.removeChild(chartContainer.firstChild);
        }
        
        // 獲取響應式配置
        const responsiveConfig = getResponsivePieChartConfig();
        
        // 創建新圖表
        chartContainer.chartInstance = Highcharts.chart(chartId, {
            chart: {
                type: 'pie',
                backgroundColor: 'transparent',
                height: 250,  // 減少高度，為列表留出空間
                spacing: responsiveConfig.spacing,
                margin: responsiveConfig.margin,
                plotBackgroundColor: 'transparent',
                plotBorderWidth: 0,
                events: {
                    click: function() {
                        // 點擊圖表背景（非色塊）時重置高亮
                        resetPieChartHighlight(chartId);
                    }
                }
            },
            title: { text: '' },
            credits: { enabled: false },
            tooltip: {
                pointFormat: '<b>{point.percentage:.1f}%</b><br/>${point.y:,.0f}'
            },
            plotOptions: {
                    pie: {
                        size: responsiveConfig.pieSize,
                        innerSize: responsiveConfig.innerSize,
                    dataLabels: {
                        enabled: false  // 不顯示標籤，所有詳細信息在下方列表中顯示
                    },
                    colors: colors,  // 設置顏色數組
                    states: {
                        hover: {
                            enabled: false,
                            opacity: 1
                        },
                        inactive: {
                            enabled: false,
                            opacity: 1
                        }
                    },
                    point: {
                        events: {
                            click: function() {
                                // 點擊色塊時顯示該分類的資訊
                                highlightPieChartSlice(chartId, this.name);
                            }
                        },
                        states: {
                            hover: {
                                enabled: false,
                                opacity: 1,
                                brightness: 0
                            },
                            inactive: {
                                enabled: false,
                                opacity: 1
                            },
                            select: {
                                enabled: false,
                                opacity: 1
                            }
                        }
                    },
                    animation: {
                        duration: 800,
                        easing: 'easeOutQuart'
                    }
                }
            },
            series: [{
                name: type === 'expense' ? '支出' : '收入',
                data: chartDataWithColors,
                animation: {
                    duration: 0  // 禁用初始動畫，使用動畫引擎
                }
            }]
        });
        
        // 確保圖表容器有相對定位，以便文字容器可以絕對定位
        chartContainer.style.position = 'relative';
        
        // 在創建新圖表後，清除可能存在的舊文字容器並重置高亮狀態
        resetPieChartHighlight(chartId);
        
        // 初始化動畫引擎
        if(chartId === 'monthlyExpenseChart') {
            monthlyExpenseChartAnimationEngine = new ChartAnimationEngine(chartContainer.chartInstance);
        } else if(chartId === 'monthlyIncomeChart') {
            monthlyIncomeChartAnimationEngine = new ChartAnimationEngine(chartContainer.chartInstance);
        }
        
        // 渲染詳細列表
        renderMonthlyChartList(type, chartDataWithColors, chartId);
    }
    
    // 支出圖表下拉選單：切換開關
    function toggleExpenseChartDropdown(e) {
        e.stopPropagation();
        const dd = document.getElementById('expenseChartDropdown');
        const incomeDd = document.getElementById('incomeChartDropdown');
        if(incomeDd) incomeDd.classList.remove('open');
        if(dd) dd.classList.toggle('open');
    }
    
    // 收入圖表下拉選單：切換開關
    function toggleIncomeChartDropdown(e) {
        e.stopPropagation();
        const dd = document.getElementById('incomeChartDropdown');
        const expenseDd = document.getElementById('expenseChartDropdown');
        if(expenseDd) expenseDd.classList.remove('open');
        if(dd) dd.classList.toggle('open');
    }
    
    // 點擊頁面時關閉所有下拉選單
    document.addEventListener('click', function() {
        document.querySelectorAll('.chart-view-dropdown.open').forEach(el => el.classList.remove('open'));
    });
    
    // 選擇支出圖表視圖（總支出、原始支出、代墊）
    function selectExpenseChartView(view, e) {
        if(e) e.stopPropagation();
        const viewNames = { total: '總支出', normal: '原始支出', advance: '代墊' };
        currentExpenseChartView = view;
        
        document.getElementById('expenseTotalView').style.display = view === 'total' ? 'block' : 'none';
        document.getElementById('expenseNormalView').style.display = view === 'normal' ? 'block' : 'none';
        document.getElementById('expenseAdvanceView').style.display = view === 'advance' ? 'block' : 'none';
        
        const toggleText = document.getElementById('expenseChartToggleText');
        if(toggleText) toggleText.textContent = viewNames[view];
        
        const dd = document.getElementById('expenseChartDropdown');
        if(dd) {
            dd.querySelectorAll('.dropdown-item').forEach(el => el.classList.toggle('active', el.dataset.view === view));
            dd.classList.remove('open');
        }
        
        resetPieChartHighlight('monthlyExpenseTotalChart');
        resetPieChartHighlight('monthlyExpenseChart');
        resetPieChartHighlight('monthlyExpenseAdvanceChart');
    }
    
    // 選擇收入圖表視圖（總收入、原始收入、代墊）
    function selectIncomeChartView(view, e) {
        if(e) e.stopPropagation();
        const viewNames = { total: '總收入', normal: '原始收入', advance: '代墊' };
        currentIncomeChartView = view;
        
        document.getElementById('incomeTotalView').style.display = view === 'total' ? 'block' : 'none';
        document.getElementById('incomeNormalView').style.display = view === 'normal' ? 'block' : 'none';
        document.getElementById('incomeAdvanceView').style.display = view === 'advance' ? 'block' : 'none';
        
        const toggleText = document.getElementById('incomeChartToggleText');
        if(toggleText) toggleText.textContent = viewNames[view];
        
        const dd = document.getElementById('incomeChartDropdown');
        if(dd) {
            dd.querySelectorAll('.dropdown-item').forEach(el => el.classList.toggle('active', el.dataset.view === view));
            dd.classList.remove('open');
        }
        
        resetPieChartHighlight('monthlyIncomeTotalChart');
        resetPieChartHighlight('monthlyIncomeChart');
        resetPieChartHighlight('monthlyIncomeAdvanceChart');
    }
    
    // 渲染圓餅圖下方的詳細列表
    function renderMonthlyChartList(type, chartData, chartId) {
        // 根據 chartId 找到對應的列表容器
        let listContainerId = '';
        if(chartId === 'monthlyExpenseTotalChart') {
            listContainerId = 'monthlyExpenseTotalList';
        } else if(chartId === 'monthlyExpenseChart') {
            listContainerId = 'monthlyExpenseList';
        } else if(chartId === 'monthlyExpenseAdvanceChart') {
            listContainerId = 'monthlyExpenseAdvanceList';
        } else if(chartId === 'monthlyIncomeTotalChart') {
            listContainerId = 'monthlyIncomeTotalList';
        } else if(chartId === 'monthlyIncomeChart') {
            listContainerId = 'monthlyIncomeList';
        } else if(chartId === 'monthlyIncomeAdvanceChart') {
            listContainerId = 'monthlyIncomeAdvanceList';
        }
        
        if(!listContainerId) return;
        
        const listContainer = document.getElementById(listContainerId);
        if(!listContainer) return;
        
        // 清空列表
        listContainer.innerHTML = '';
        
        if(!chartData || chartData.length === 0) {
            return;
        }
        
        // 計算總額
        const total = chartData.reduce((sum, item) => sum + (item.y || 0), 0);
        
        // 按金額排序（從大到小）
        const sortedData = [...chartData].sort((a, b) => (b.y || 0) - (a.y || 0));
        
        // 創建列表項目
        sortedData.forEach((item, index) => {
            const percentage = total > 0 ? ((item.y || 0) / total * 100).toFixed(1) : '0.0';
            const amount = (item.y || 0).toLocaleString();
            const color = item.color || '#999';
            
            const listItem = document.createElement('div');
            listItem.style.cssText = 'display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border-color);';
            
            // 顏色標記
            const colorDot = document.createElement('div');
            colorDot.style.cssText = `width: 12px; height: 12px; border-radius: 50%; background: ${color}; margin-right: 12px; flex-shrink: 0;`;
            
            // 類別名稱
            const categoryName = document.createElement('div');
            categoryName.style.cssText = 'flex: 1; font-size: 14px; color: var(--text-primary); font-weight: 500;';
            categoryName.textContent = item.name || '其他';
            
            // 百分比和金額
            const details = document.createElement('div');
            details.style.cssText = 'display: flex; flex-direction: column; align-items: flex-end; margin-left: 12px;';
            
            const percentageSpan = document.createElement('span');
            percentageSpan.style.cssText = 'font-size: 13px; color: var(--text-secondary); margin-bottom: 2px;';
            percentageSpan.textContent = `${percentage}%`;
            
            const amountSpan = document.createElement('span');
            amountSpan.style.cssText = 'font-size: 15px; color: var(--text-primary); font-weight: 600;';
            amountSpan.textContent = `$${amount}`;
            
            details.appendChild(percentageSpan);
            details.appendChild(amountSpan);
            
            listItem.appendChild(colorDot);
            listItem.appendChild(categoryName);
            listItem.appendChild(details);
            
            // 添加點擊事件：高亮對應的圓餅圖區塊
            listItem.style.cursor = 'pointer';
            listItem.classList.add('pie-chart-list-item'); // 添加標記類
            listItem.setAttribute('data-chart-id', chartId); // 添加圖表ID標記
            listItem.addEventListener('click', function(e) {
                e.stopPropagation(); // 阻止事件冒泡
                highlightPieChartSlice(chartId, item.name || item.category);
            });
            
            listContainer.appendChild(listItem);
        });
        
        // 添加點擊監聽器：點擊列表容器（非列表項）時重置圓餅圖高亮
        const existingHandler = listContainer._resetHandler;
        if(existingHandler) {
            listContainer.removeEventListener('click', existingHandler);
        }
        const resetHandler = function(e) {
            // 檢查點擊的目標是否是列表項或其子元素
            const clickedListItem = e.target.closest('.pie-chart-list-item');
            // 如果不是列表項，重置高亮
            if(!clickedListItem) {
                resetPieChartHighlight(chartId);
            }
        };
        listContainer._resetHandler = resetHandler;
        listContainer.addEventListener('click', resetHandler);
        
        // 全局點擊監聯器：點擊列表項和圖表以外的任何地方才重置高亮
        if(!window.pieChartGlobalClickHandler) {
            window.pieChartGlobalClickHandler = function(e) {
                // 如果點在圓餅圖的 SVG 區域內（如色塊），不重置
                const clickedChart = e.target.closest('.highcharts-container');
                if(clickedChart) return;
                // 列表項的 click 有 stopPropagation()，不會觸發到這裡
                resetPieChartHighlight('monthlyExpenseTotalChart');
                resetPieChartHighlight('monthlyExpenseChart');
                resetPieChartHighlight('monthlyExpenseAdvanceChart');
                resetPieChartHighlight('monthlyIncomeTotalChart');
                resetPieChartHighlight('monthlyIncomeChart');
                resetPieChartHighlight('monthlyIncomeAdvanceChart');
            };
            document.addEventListener('click', window.pieChartGlobalClickHandler);
        }
        
        // 列表高度由 CSS .chart-detail-list 控制（固定最多5行，超過則清單內獨立滾動）
    }
    
    // 高亮圓餅圖的指定區塊，其他區塊變暗，並在中心顯示信息
    function highlightPieChartSlice(chartId, categoryName) {
        const chartContainer = document.getElementById(chartId);
        if(!chartContainer || !chartContainer.chartInstance) {
            return;
        }
        
        const chart = chartContainer.chartInstance;
        if(!chart.series || chart.series.length === 0) {
            return;
        }
        
        const series = chart.series[0];
        if(!series.points) {
            return;
        }
        
        // 找到選中的點
        let selectedPoint = null;
        let total = 0;
        
        // 找到對應的區塊並高亮，其他變暗
        series.points.forEach(point => {
            total += point.y || 0;
            if(point.name === categoryName) {
                selectedPoint = point;
                // 選中的區塊：正常狀態，不變暗
                point.setState('normal');
                const pointEl = point.graphic?.element;
                if(pointEl) {
                    pointEl.style.setProperty('opacity', '1', 'important');
                }
            } else {
                // 其他區塊：變暗
                point.setState('inactive');
                const pointEl = point.graphic?.element;
                if(pointEl) {
                    pointEl.style.setProperty('opacity', '0.3', 'important');
                }
            }
        });
        
        // 在圓餅圖中心顯示信息（使用自定義 DOM 元素）
        if(selectedPoint) {
            const percentage = total > 0 ? ((selectedPoint.y || 0) / total * 100).toFixed(1) : '0.0';
            const amount = (selectedPoint.y || 0).toLocaleString();
            const name = selectedPoint.name || '其他';
            
            // 計算中間空白區域的實際大小
            const chartTextColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#ffffff';
            const innerSizePercent = 50; // 與 getResponsivePieChartConfig 中的 innerSize 保持一致
            // 取得圓餅圖實際繪製區域的寬度
            const plotWidth = chart.plotWidth || chart.chartWidth || 250;
            const pieSize = plotWidth * 0.9; // pieSize 為 90%
            const innerDiameter = pieSize * (innerSizePercent / 100);
            const maxTextWidth = Math.floor(innerDiameter * 0.85); // 使用 85% 的內圈直徑
            
            // 查找或創建自定義文字容器
            let textContainer = chartContainer.querySelector('.pie-chart-center-text');
            if(!textContainer) {
                textContainer = document.createElement('div');
                textContainer.className = 'pie-chart-center-text';
                chartContainer.style.position = 'relative';
                chartContainer.appendChild(textContainer);
            }
            
            // 設定容器樣式和文字內容（不限制寬度，讓文字完整顯示）
            textContainer.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                pointer-events: none;
                z-index: 10;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                white-space: nowrap;
            `;
            textContainer.innerHTML = `
                <div style="font-size: 16px; font-weight: 600; color: ${chartTextColor}; margin-bottom: 2px; white-space: nowrap;">${name}</div>
                <div style="font-size: 20px; font-weight: 700; color: ${chartTextColor}; margin-bottom: 2px; white-space: nowrap;">$${amount}</div>
                <div style="font-size: 14px; font-weight: 500; color: var(--text-secondary); white-space: nowrap;">${percentage}%</div>
            `;
        } else {
            // 如果找不到對應的類別，隱藏文字
            const textContainer = chartContainer.querySelector('.pie-chart-center-text');
            if(textContainer) {
                textContainer.style.display = 'none';
            }
        }
    }
    
    // 恢復圓餅圖所有區塊為正常狀態
    function resetPieChartHighlight(chartId) {
        const chartContainer = document.getElementById(chartId);
        if(!chartContainer || !chartContainer.chartInstance) {
            return;
        }
        
        const chart = chartContainer.chartInstance;
        
        // 恢復所有區塊為正常狀態
        if(chart.series && chart.series.length > 0 && chart.series[0].points) {
            chart.series[0].points.forEach(point => {
                point.setState('normal');
                const pointEl = point.graphic?.element;
                if(pointEl) {
                    pointEl.style.setProperty('opacity', '1', 'important');
                }
            });
        }
        
        // 隱藏自定義文字容器
        const textContainer = chartContainer.querySelector('.pie-chart-center-text');
        if(textContainer) {
            textContainer.style.display = 'none';
        }
    }
    
    // 初始化月份圓餅圖滑動手勢
    let monthlyChartTouchStartX = null;
    let monthlyChartTouchStartY = null;
    let monthlyChartTouchTarget = null;
    let monthlyChartIsSwiping = false;
    let monthlyChartCurrentTransform = 0;
    
    function initMonthlyChartSwipe() {
        const swiper = document.getElementById('monthlyChartSwiper');
        if(!swiper) return;
        
        swiper.removeEventListener('touchstart', handleMonthlyChartTouchStart);
        swiper.removeEventListener('touchmove', handleMonthlyChartTouchMove);
        swiper.removeEventListener('touchend', handleMonthlyChartTouchEnd);
        
        swiper.addEventListener('touchstart', handleMonthlyChartTouchStart, { passive: true });
        swiper.addEventListener('touchmove', handleMonthlyChartTouchMove, { passive: false });
        swiper.addEventListener('touchend', handleMonthlyChartTouchEnd, { passive: true });
    }
    
    function handleMonthlyChartTouchStart(e) {
        monthlyChartTouchStartX = e.touches[0].clientX;
        monthlyChartTouchStartY = e.touches[0].clientY;
        monthlyChartTouchTarget = e.target;
        monthlyChartIsSwiping = false;
        const container = document.getElementById('monthlyChartPageContainer');
        if(container) {
            const transform = container.style.transform || 'translateX(0%)';
            const match = transform.match(/translateX\((-?\d+\.?\d*)%\)/);
            monthlyChartCurrentTransform = match ? parseFloat(match[1]) : 0;
        }
    }
    
    function handleMonthlyChartTouchMove(e) {
        if(!monthlyChartTouchStartX || monthlyChartTouchStartY === null) return;
        
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = monthlyChartTouchStartX - currentX;
        const diffY = monthlyChartTouchStartY - currentY;
        const absDiffX = Math.abs(diffX);
        const absDiffY = Math.abs(diffY);
        
        // 明確為垂直滑動時不攔截，讓內層 .page-item 可上下捲動
        if(absDiffY > absDiffX) return;
        // 門檻提高：僅在明顯為水平滑動時才 preventDefault，避免誤攔垂直捲動導致後續無法滑
        const isClearlyHorizontal = absDiffX > 14 && absDiffX > absDiffY * 1.2;
        if(isClearlyHorizontal) e.preventDefault();
        
        if(isClearlyHorizontal) {
            monthlyChartIsSwiping = true;
            const container = document.getElementById('monthlyChartPageContainer');
            const swiper = document.getElementById('monthlyChartSwiper');
            if(container && swiper) {
                container.classList.add('swiping');
                const swipePercent = -(diffX / swiper.offsetWidth) * 100;
                let newTransform = monthlyChartCurrentTransform + swipePercent;
                
                // 限制範圍（0% 到 -50%）
                const minTransform = -50;
                const maxTransform = 0;
                newTransform = Math.max(minTransform, Math.min(maxTransform, newTransform));
                
                container.style.transform = `translateX(${newTransform}%)`;
            }
        }
    }
    
    function handleMonthlyChartTouchEnd(e) {
        if(!monthlyChartTouchStartX || monthlyChartTouchStartY === null) {
            monthlyChartTouchStartX = null;
            monthlyChartTouchStartY = null;
            monthlyChartTouchTarget = null;
            monthlyChartIsSwiping = false;
            return;
        }
        if(!monthlyChartIsSwiping) {
            // 剛才是內層細項捲動：短暫放開內層觸控，讓下一次滑動可被外層接收
            const scrollable = monthlyChartTouchTarget && monthlyChartTouchTarget.closest && monthlyChartTouchTarget.closest('#monthlyChartSwiper .page-item, #monthlyChartSwiper .chart-detail-list');
            monthlyChartTouchStartX = null;
            monthlyChartTouchStartY = null;
            monthlyChartTouchTarget = null;
            if(scrollable && scrollable.scrollHeight > scrollable.clientHeight) {
                scrollable.style.pointerEvents = 'none';
                setTimeout(function() { scrollable.style.pointerEvents = ''; }, 80);
            }
            return;
        }
        
        const currentX = e.changedTouches[0].clientX;
        const currentY = e.changedTouches[0].clientY;
        const diffX = monthlyChartTouchStartX - currentX;
        const diffY = monthlyChartTouchStartY - currentY;
        monthlyChartTouchStartX = null;
        monthlyChartTouchStartY = null;
        monthlyChartTouchTarget = null;
        monthlyChartIsSwiping = false;
        
        if(Math.abs(diffY) > Math.abs(diffX)) return;
        const swiper = document.getElementById('monthlyChartSwiper');
        const container = document.getElementById('monthlyChartPageContainer');
        
        if(swiper && container) {
            const threshold = swiper.offsetWidth * 0.15;
            
            if(Math.abs(diffX) > threshold) {
                if(diffX > 0 && currentMonthlyChartIndex < 1) {
                    currentMonthlyChartIndex++;
                } else if(diffX < 0 && currentMonthlyChartIndex > 0) {
                    currentMonthlyChartIndex--;
                }
            }
            
            switchMonthlyChartPage(currentMonthlyChartIndex);
        }
    }
    
    function switchMonthlyChartPage(index) {
        const container = document.getElementById('monthlyChartPageContainer');
        if(container) {
            container.classList.remove('swiping');
            const transform = -index * 50;
            container.style.transform = `translateX(${transform}%)`;
            
            // 切換後解除內層捲動鎖定：強制重設可見 .page-item 的 overflow，避免換頁後上下滑動失效
            const pageItems = document.querySelectorAll('#monthlyChartSwiper .page-item');
            pageItems.forEach((el, i) => {
                const isVisible = (i === 0 && index === 0) || (i === 1 && index === 1);
                if(isVisible && el.scrollHeight > el.clientHeight) {
                    el.style.overflowY = 'hidden';
                    requestAnimationFrame(() => { el.style.overflowY = 'auto'; });
                }
            });
            
            // 切換頁面時恢復所有圓餅圖高亮
            resetPieChartHighlight('monthlyExpenseTotalChart');
            resetPieChartHighlight('monthlyExpenseChart');
            resetPieChartHighlight('monthlyExpenseAdvanceChart');
            resetPieChartHighlight('monthlyIncomeTotalChart');
            resetPieChartHighlight('monthlyIncomeChart');
            resetPieChartHighlight('monthlyIncomeAdvanceChart');
            
            // 重新渲染當前圖表以觸發動畫（動畫引擎會處理平滑過渡）
            setTimeout(() => {
                const year = currentCalendarDate.getFullYear();
                const month = currentCalendarDate.getMonth();
                const records = loadJournalRecords();
                const monthStart = new Date(year, month, 1);
                const monthEnd = new Date(year, month + 1, 0);
                monthStart.setHours(0, 0, 0, 0);
                monthEnd.setHours(23, 59, 59, 999);
                
                const monthRecords = records.filter(record => {
                    if(!record.date) return false;
                    const recordDate = new Date(record.date);
                    recordDate.setHours(0, 0, 0, 0);
                    return recordDate >= monthStart && recordDate <= monthEnd;
                });
                
                if(index === 0) {
                    // 重新渲染支出圖表
                    const expenseRecords = monthRecords.filter(r => r.type === 'expense');
                    const expenseRecordsNormal = expenseRecords.filter(r => !r.isAdvance);
                    const expenseRecordsAdvance = expenseRecords.filter(r => r.isAdvance);
                    renderMonthlyPieChart('expense', expenseRecordsNormal, 'monthlyExpenseChart');
                    renderMonthlyPieChart('expense', expenseRecordsAdvance, 'monthlyExpenseAdvanceChart');
                } else {
                    // 重新渲染收入圖表
                    const incomeRecords = monthRecords.filter(r => r.type === 'income');
                    const incomeRecordsNormal = incomeRecords.filter(r => !r.isAdvance);
                    const incomeRecordsAdvance = incomeRecords.filter(r => r.isAdvance);
                    renderMonthlyPieChart('income', incomeRecordsNormal, 'monthlyIncomeChart');
                    renderMonthlyPieChart('income', incomeRecordsAdvance, 'monthlyIncomeAdvanceChart');
                }
            }, 50);
        }
    }
    
    // 顯示指定日期的所有記錄（固定轉帳、收入、支出、轉帳）
    function showFixedTransferDetailsForDate(date) {
        const detailsContainer = document.getElementById('calendarTransferDetails');
        if(!detailsContainer) return;
        
        const dateStr = formatLocalDate(date);
        console.log('顯示日期詳情:', dateStr);
        
        // 獲取該日期的所有固定轉帳
        const transfers = getFixedTransfersForDate(date);
        
        // 獲取該日期的所有記帳記錄
        const journalRecords = getJournalRecordsForDate(dateStr);
        console.log('該日期的記帳記錄數:', journalRecords.length);
        
        // 分類記錄
        const expenseRecords = journalRecords.filter(r => r.type === 'expense');
        const incomeRecords = journalRecords.filter(r => r.type === 'income');
        const transferRecords = journalRecords.filter(r => r.type === 'transfer');
        
        // 始終顯示詳情區域（即使沒有記錄，也可以添加新記錄）
        detailsContainer.style.display = 'block';
        
        // 計算並設置詳情區域的最大高度
        updateJournalDetailsHeight();
        
        // 渲染支出分頁（傳入日期以便計算固定轉帳金額）
        renderJournalPage('expense', expenseRecords, transfers, date);
        
        // 渲染收入分頁
        renderJournalPage('income', incomeRecords, transfers, date);
        
        // 渲染轉帳分頁
        renderJournalPage('transfer', transferRecords, transfers, date);
        
        // 重置到第一個有內容的分頁
        if(expenseRecords.length > 0 || transfers.length > 0) {
            currentJournalPageIndex = 0;
        } else if(incomeRecords.length > 0 || transfers.length > 0) {
            currentJournalPageIndex = 1;
        } else if(transferRecords.length > 0 || transfers.length > 0) {
            currentJournalPageIndex = 2;
        } else {
            // 如果所有分頁都沒有內容，默認顯示支出分頁
            currentJournalPageIndex = 0;
        }
        
        // 切換到對應分頁
        switchJournalPage(currentJournalPageIndex);
        
        // 確保滑動手勢已初始化
        requestAnimationFrame(() => {
            initJournalSwipe();
            updateJournalDetailsHeight();
        });
    }
    
    // 更新記帳詳情區域的高度
    function updateJournalDetailsHeight() {
        const calendarPage = document.getElementById('calendarPage');
        const calendarContainer = document.querySelector('.calendar-container');
        const detailsContainer = document.getElementById('calendarTransferDetails');
        
        if(!calendarPage || !calendarContainer || !detailsContainer) return;
        
        // 獲取視窗高度
        const windowHeight = window.innerHeight;
        // 獲取日曆容器的實際高度（包括 padding）
        const calendarRect = calendarContainer.getBoundingClientRect();
        const calendarHeight = calendarRect.height;
        // 獲取 calendarPage 的 padding（上下各 20px）
        const pagePadding = 40;
        // 獲取詳情區域的 margin-top
        const detailsMarginTop = 20;
        // 計算可用高度
        const availableHeight = windowHeight - 60 - pagePadding - calendarHeight - detailsMarginTop;
        // 設置最小高度和最大高度（至少 200px，最多不超過可用空間）
        const minHeight = 200;
        const maxHeight = Math.max(minHeight, availableHeight - 20); // 減去一些緩衝
        
        // 為每個分頁設置最大高度
        const expensePage = document.getElementById('journalExpensePage');
        const incomePage = document.getElementById('journalIncomePage');
        const transferPage = document.getElementById('journalTransferPage');
        
        [expensePage, incomePage, transferPage].forEach(page => {
            if(page) {
                page.style.maxHeight = `${maxHeight}px`;
            }
        });
    }
    
    // 渲染記帳分頁
    function renderJournalPage(type, records, fixedTransfers, targetDate = null) {
        const listId = type === 'expense' ? 'journalExpenseList' : (type === 'income' ? 'journalIncomeList' : 'journalTransferList');
        const list = document.getElementById(listId);
        if(!list) return;
        
        // 計算總計
        let total = 0;
        records.forEach(record => {
            total += parseFloat(record.amount) || 0;
        });
        
        // 更新總計顯示
        const totalId = type === 'expense' ? 'journalExpenseTotal' : (type === 'income' ? 'journalIncomeTotal' : 'journalTransferTotal');
        const totalElement = document.getElementById(totalId);
        if(totalElement) {
            if(type === 'expense') {
                totalElement.textContent = `-$${total.toLocaleString()}`;
                totalElement.style.color = 'var(--color-down)';
            } else if(type === 'income') {
                totalElement.textContent = `+$${total.toLocaleString()}`;
                totalElement.style.color = 'var(--color-up)';
            } else {
                totalElement.textContent = `$${total.toLocaleString()}`;
                totalElement.style.color = 'var(--text-primary)';
            }
        }
        
        // 獲取圖表和列表容器
        const chartId = type === 'expense' ? 'journalExpenseChart' : (type === 'income' ? 'journalIncomeChart' : null);
        const chartContainer = chartId ? document.getElementById(chartId) : null;
        
        // 根據顯示模式決定顯示列表還是圖表
        if(type === 'transfer') {
            // 轉帳只顯示列表
            if(chartContainer) chartContainer.style.display = 'none';
            list.style.display = 'flex';
        } else if(type === 'income' || type === 'expense') {
            // 收入和支出可以切換列表/圖表
            if(journalViewMode === 'chart' && records.length > 0) {
                // 圖表模式：顯示圖表，隱藏列表
                if(chartContainer) chartContainer.style.display = 'block';
                list.style.display = 'none';
            } else {
                // 列表模式：顯示列表，隱藏圖表
                if(chartContainer) chartContainer.style.display = 'none';
                list.style.display = 'flex';
            }
        }
        
        // 渲染圓餅圖（僅收入和支出，且為圖表模式）
        if((type === 'income' || type === 'expense') && records.length > 0 && journalViewMode === 'chart' && chartContainer && typeof Highcharts !== 'undefined') {
            // 按分類統計
            const categoryData = {};
            records.forEach(record => {
                const category = record.category || '其他';
                if(!categoryData[category]) {
                    categoryData[category] = 0;
                }
                categoryData[category] += parseFloat(record.amount) || 0;
            });
            
            // 顏色配置
            const colors = type === 'expense' 
                ? ['#ff453a', '#ff9500', '#ffcc00', '#34c759', '#5ac8fa', '#007aff', '#5856d6', '#af52de', '#ff2d55']
                : ['#34c759', '#5ac8fa', '#007aff', '#0a84ff', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#fbbf24', '#30d158', '#32d74b', '#4ade80', '#22c55e'];  // 收入：綠色+藍色+彩虹色
            
            // 轉換為Highcharts格式（不在此處指定顏色，使用plotOptions中的colors數組）
            const chartData = Object.keys(categoryData).map(category => ({
                name: category,
                y: categoryData[category]
            }));
            
            // 銷毀舊圖表
            if(chartContainer.chartInstance) {
                chartContainer.chartInstance.destroy();
            }
            
            // 確保圖表容器限制內容在視窗內
            if(chartContainer) {
                chartContainer.style.overflow = 'hidden';
                chartContainer.style.position = 'relative';
            }
            
            // 獲取響應式配置
            const responsiveConfig = getResponsivePieChartConfig();
            
            // 創建新圖表
            const chartTextColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#ffffff';
            chartContainer.chartInstance = Highcharts.chart(chartId, {
            chart: {
                type: 'pie',
                backgroundColor: 'transparent',
                height: 200,
                spacing: responsiveConfig.spacing,
                margin: responsiveConfig.margin,
                plotBackgroundColor: 'transparent',
                plotBorderWidth: 0
            },
                title: { text: '' },
                credits: { enabled: false },
                tooltip: {
                    pointFormat: '<b>{point.percentage:.1f}%</b><br/>${point.y:,.0f}'
                },
                plotOptions: {
                    pie: {
                        size: responsiveConfig.pieSize,
                        innerSize: responsiveConfig.innerSize,
                    dataLabels: {
                        enabled: false  // 不顯示標籤，所有詳細信息在下方列表中顯示
                    },
                        colors: colors,  // 設置顏色數組
                        states: {
                            hover: {
                                enabled: false,
                                opacity: 1
                            },
                            inactive: {
                                enabled: false,
                                opacity: 1
                            }
                        },
                        point: {
                            events: {
                                click: function() {
                                    // 禁用點擊事件
                                    return false;
                                }
                            },
                            states: {
                                hover: {
                                    enabled: false,
                                    opacity: 1,
                                    brightness: 0
                                },
                                inactive: {
                                    enabled: false,
                                    opacity: 1
                                },
                                select: {
                                    enabled: false,
                                    opacity: 1
                                }
                            }
                        },
                        animation: {
                            duration: 600,
                            easing: 'easeOutQuart'
                        }
                    }
                },
                series: [{
                    name: type === 'expense' ? '支出' : '收入',
                    data: chartData,
                    animation: {
                        duration: 600,
                        easing: 'easeOutQuart'
                    }
                }]
            });
        } else if((type === 'income' || type === 'expense') && chartContainer) {
            // 如果沒有記錄，隱藏圖表
            if(chartContainer.chartInstance) {
                chartContainer.chartInstance.destroy();
                chartContainer.chartInstance = null;
            }
            chartContainer.style.display = 'none';
        }
        
        list.innerHTML = '';
        
        // 先顯示該類型的記帳記錄
        records.forEach(record => {
            const detailItem = document.createElement('div');
            let borderColor = '#0a84ff';
            let icon = '';
            let title = '';
            
            if(record.type === 'income') {
                borderColor = 'var(--color-up)';
                const displayTitle = record.title || '收入';
                const account = accounts.find(acc => acc.id === record.accountId);
                const accountName = account ? account.name : '未知帳戶';
                const accountTagClass = account ? getAccountTagClass(account) : 'account-tag-account';
                const accountTagHTML = `<span class="account-tag ${accountTagClass}">${accountName}</span>`;
                const categoryTagHTML = record.category ? `<span class="account-tag account-tag-account" style="background: #e3f2fd; color: #1565c0;">${record.category}</span>` : '';
                const isAdvanceIcon = record.isAdvance ? '<i class="fas fa-hand-holding-usd" style="color: var(--text-secondary); font-size: 14px;" title="代墊"></i>' : '';
                detailItem.style.cssText = 'padding: 12px; background: var(--bg-color); border-radius: 8px; border-left: 4px solid ' + borderColor + '; width: calc(100% - 0px); max-width: 100%; box-sizing: border-box; overflow: visible; cursor: pointer;';
                detailItem.onclick = () => editJournalRecord(record.id);
                detailItem.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; width: 100%; box-sizing: border-box; gap: 8px;">
                        <div style="font-size: 16px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${displayTitle}</div>
                        <div style="font-size: 18px; font-weight: 600; color: var(--color-up); flex-shrink: 0; white-space: nowrap;">+$${record.amount.toLocaleString()}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; width: 100%; flex-wrap: wrap;">
                        ${categoryTagHTML}
                        ${accountTagHTML}
                        ${isAdvanceIcon}
                    </div>
                    <div style="display: flex; justify-content: flex-end; width: 100%;">
                        <div style="display: flex; gap: 8px; flex-shrink: 0;">
                            <button onclick="event.stopPropagation(); editJournalRecord('${record.id}')" style="background: none; border: none; color: #0a84ff; font-size: 16px; padding: 4px 8px; cursor: pointer;" title="編輯"><i class="fas fa-edit"></i></button>
                            <button onclick="event.stopPropagation(); deleteJournalRecord('${record.id}')" style="background: none; border: none; color: #ff453a; font-size: 16px; padding: 4px 8px; cursor: pointer;" title="刪除"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `;
            } else if(record.type === 'expense') {
                borderColor = 'var(--color-down)';
                const displayTitle = record.title || '支出';
                const account = accounts.find(acc => acc.id === record.accountId);
                const accountName = account ? account.name : '未知帳戶';
                const accountTagClass = account ? getAccountTagClass(account) : 'account-tag-account';
                const accountTagHTML = `<span class="account-tag ${accountTagClass}">${accountName}</span>`;
                const categoryTagHTML = record.category ? `<span class="account-tag account-tag-account" style="background: #fce4ec; color: #c2185b;">${record.category}</span>` : '';
                const isAdvanceIcon = record.isAdvance ? '<i class="fas fa-hand-holding-usd" style="color: var(--text-secondary); font-size: 14px;" title="代墊"></i>' : '';
                detailItem.style.cssText = 'padding: 12px; background: var(--bg-color); border-radius: 8px; border-left: 4px solid ' + borderColor + '; width: calc(100% - 0px); max-width: 100%; box-sizing: border-box; overflow: visible; cursor: pointer;';
                detailItem.onclick = () => editJournalRecord(record.id);
                detailItem.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; width: 100%; box-sizing: border-box; gap: 8px;">
                        <div style="font-size: 16px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${displayTitle}</div>
                        <div style="font-size: 18px; font-weight: 600; color: var(--color-down); flex-shrink: 0; white-space: nowrap;">-$${record.amount.toLocaleString()}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; width: 100%; flex-wrap: wrap;">
                        ${categoryTagHTML}
                        ${accountTagHTML}
                        ${isAdvanceIcon}
                    </div>
                    <div style="display: flex; justify-content: flex-end; width: 100%;">
                        <div style="display: flex; gap: 8px; flex-shrink: 0;">
                            <button onclick="event.stopPropagation(); editJournalRecord('${record.id}')" style="background: none; border: none; color: #0a84ff; font-size: 16px; padding: 4px 8px; cursor: pointer;" title="編輯"><i class="fas fa-edit"></i></button>
                            <button onclick="event.stopPropagation(); deleteJournalRecord('${record.id}')" style="background: none; border: none; color: #ff453a; font-size: 16px; padding: 4px 8px; cursor: pointer;" title="刪除"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `;
            } else if(record.type === 'transfer') {
                borderColor = '#0a84ff';
                const displayTitle = record.title || '轉帳';
                const fromAccount = accounts.find(acc => acc.id === record.fromAccountId);
                const toAccount = accounts.find(acc => acc.id === record.toAccountId);
                const fromAccountName = fromAccount ? fromAccount.name : '未知帳戶';
                const toAccountName = toAccount ? toAccount.name : '未知帳戶';
                
                // 生成帳戶標籤 HTML（顯示帳戶名稱，使用帳戶類型決定顏色）
                const fromAccountTagClass = fromAccount ? getAccountTagClass(fromAccount) : 'account-tag-account';
                const toAccountTagClass = toAccount ? getAccountTagClass(toAccount) : 'account-tag-account';
                const fromAccountTagHTML = `<span class="account-tag ${fromAccountTagClass}">${fromAccountName}</span>`;
                const toAccountTagHTML = `<span class="account-tag ${toAccountTagClass}">${toAccountName}</span>`;
                
                detailItem.style.cssText = 'padding: 12px; background: var(--bg-color); border-radius: 8px; border-left: 4px solid ' + borderColor + '; width: calc(100% - 0px); max-width: 100%; box-sizing: border-box; overflow: visible; cursor: pointer;';
                detailItem.onclick = () => editJournalRecord(record.id);
                detailItem.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; width: 100%; box-sizing: border-box; gap: 8px;">
                        <div style="font-size: 16px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${displayTitle}</div>
                        <div style="font-size: 18px; font-weight: 600; color: var(--text-primary); flex-shrink: 0; white-space: nowrap;">$${record.amount.toLocaleString()}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; width: 100%; flex-wrap: wrap;">
                        ${fromAccountTagHTML}
                        <i class="fas fa-arrow-right" style="color: var(--text-secondary); font-size: 12px; margin: 0 2px;"></i>
                        ${toAccountTagHTML}
                    </div>
                    <div style="display: flex; justify-content: flex-end; width: 100%;">
                        <div style="display: flex; gap: 8px; flex-shrink: 0;">
                            <button onclick="event.stopPropagation(); editJournalRecord('${record.id}')" style="background: none; border: none; color: #0a84ff; font-size: 16px; padding: 4px 8px; cursor: pointer;" title="編輯"><i class="fas fa-edit"></i></button>
                            <button onclick="event.stopPropagation(); deleteJournalRecord('${record.id}')" style="background: none; border: none; color: #ff453a; font-size: 16px; padding: 4px 8px; cursor: pointer;" title="刪除"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `;
            }
            
            list.appendChild(detailItem);
        });
        
        // 在每個分頁下方顯示固定轉帳（如果有的話）
        if(fixedTransfers.length > 0) {
            // 如果有記錄，添加分隔線
            if(records.length > 0) {
                const separator = document.createElement('div');
                separator.style.cssText = 'margin: 12px 0; border-top: 1px solid var(--border-color);';
                list.appendChild(separator);
            }
            
            // 添加固定轉帳標題
            const fixedTransferTitle = document.createElement('div');
            fixedTransferTitle.style.cssText = 'font-size: 14px; font-weight: 600; color: var(--text-secondary); margin-bottom: 12px; margin-top: 8px;';
            fixedTransferTitle.textContent = '固定轉帳';
            list.appendChild(fixedTransferTitle);
            
            // 顯示固定轉帳
            fixedTransfers.forEach(transfer => {
                const fromAccount = accounts.find(acc => acc.id === transfer.fromAccountId);
                const toAccount = accounts.find(acc => acc.id === transfer.toAccountId);
                
                const fromAccountName = fromAccount ? fromAccount.name : '未知帳戶';
                const toAccountName = toAccount ? toAccount.name : '未知帳戶';
                
                // 生成帳戶標籤 HTML（顯示帳戶名稱，使用帳戶類型決定顏色）
                const fromAccountTagClass = fromAccount ? getAccountTagClass(fromAccount) : 'account-tag-account';
                const toAccountTagClass = toAccount ? getAccountTagClass(toAccount) : 'account-tag-account';
                const fromAccountTagHTML = `<span class="account-tag ${fromAccountTagClass}">${fromAccountName}</span>`;
                const toAccountTagHTML = `<span class="account-tag ${toAccountTagClass}">${toAccountName}</span>`;
                
                // 計算顯示金額（使用固定轉帳設定的金額）
                const calculateDate = targetDate || (transfer.startDate ? new Date(transfer.startDate) : new Date());
                const dateStr = formatLocalDate(calculateDate);
                
                // 檢查是否已執行
                const isExecuted = transfer.executedDates && transfer.executedDates.includes(dateStr);
                
                // 如果已執行且有執行記錄，使用執行記錄的金額；否則使用固定轉帳設定的金額
                let displayAmount = transfer.amount || 0;
                if(isExecuted && transfer.executionRecords && transfer.executionRecords[dateStr] !== undefined) {
                    displayAmount = transfer.executionRecords[dateStr];
                }
                
                const detailItem = document.createElement('div');
                detailItem.style.cssText = 'padding: 12px; background: var(--bg-color); border-radius: 8px; border-left: 4px solid ' + transfer.tagColor + '; width: calc(100% - 0px); max-width: 100%; box-sizing: border-box; overflow: visible;';
                
                // 如果未執行，讓金額可編輯
                if(!isExecuted) {
                    detailItem.innerHTML = `
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; width: 100%; box-sizing: border-box; gap: 8px;">
                            <div style="font-size: 16px; font-weight: 600; color: var(--text-primary); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${transfer.title}</div>
                            <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                                <span style="color: var(--text-secondary); font-size: 14px;">$</span>
                                <input type="number" id="fixedTransferAmount_${transfer.id}_${dateStr}" value="${displayAmount}" style="width: 100px; padding: 4px 8px; border: none; border-bottom: 2px solid var(--border-color); background: transparent; color: var(--text-primary); font-size: 18px; font-weight: 600; text-align: right; outline: none; transition: border-color 0.2s;" onchange="updateFixedTransferAmount('${transfer.id}', '${dateStr}')" onfocus="this.style.borderBottomColor='var(--color-up, #34c759)';" onblur="this.style.borderBottomColor='var(--border-color)';" onclick="event.stopPropagation();">
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px; width: 100%; flex-wrap: wrap;">
                            ${fromAccountTagHTML}
                            <i class="fas fa-arrow-right" style="color: var(--text-secondary); font-size: 12px; margin: 0 2px;"></i>
                            ${toAccountTagHTML}
                        </div>
                    `;
                    // 未執行的固定轉帳，點擊顯示詳細資料
                    detailItem.onclick = (e) => {
                        if(e.target.tagName !== 'INPUT' && e.target.tagName !== 'I') {
                            showFixedTransferDetail(transfer.id);
                        }
                    };
                } else {
                detailItem.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; width: 100%; box-sizing: border-box; gap: 8px;">
                        <div style="font-size: 16px; font-weight: 600; color: var(--text-primary); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${transfer.title}</div>
                        <div style="font-size: 18px; font-weight: 600; color: var(--text-primary); flex-shrink: 0; white-space: nowrap;">$${displayAmount.toLocaleString()}</div>
                    </div>
                        <div style="display: flex; align-items: center; gap: 6px; width: 100%; flex-wrap: wrap;">
                            ${fromAccountTagHTML}
                            <i class="fas fa-arrow-right" style="color: var(--text-secondary); font-size: 12px; margin: 0 2px;"></i>
                            ${toAccountTagHTML}
                        </div>
                    `;
                    // 已執行的固定轉帳，點擊顯示詳細資料
                    detailItem.style.cursor = 'pointer';
                    detailItem.onclick = () => showFixedTransferDetail(transfer.id);
                }
                
                list.appendChild(detailItem);
            });
        }
        
        // 如果沒有任何內容，顯示提示
        if(records.length === 0 && fixedTransfers.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.style.cssText = 'text-align: center; color: var(--text-secondary); padding: 20px; font-size: 14px;';
            emptyMsg.textContent = '尚無記錄';
            list.appendChild(emptyMsg);
        }
        
        // 添加底部間距，確保最後一項不會被遮住
        const bottomSpacer = document.createElement('div');
        bottomSpacer.style.cssText = 'height: 30px; flex-shrink: 0;';
        list.appendChild(bottomSpacer);
    }
    
    // 切換記帳分頁
    function switchJournalPage(index) {
        currentJournalPageIndex = Math.max(0, Math.min(2, index)); // 限制在 0-2 之間
        const container = document.getElementById('journalPageContainer');
        if(container) {
            const transformValue = -currentJournalPageIndex * 33.333;
            container.style.transform = `translateX(${transformValue}%)`;
            // 更新當前 transform 值
            journalCurrentTransform = transformValue;
        }
        
        // 切換記帳頁面時，重置所有圓餅圖高亮
        resetPieChartHighlight('monthlyExpenseTotalChart');
        resetPieChartHighlight('monthlyExpenseChart');
        resetPieChartHighlight('monthlyExpenseAdvanceChart');
        resetPieChartHighlight('monthlyIncomeTotalChart');
        resetPieChartHighlight('monthlyIncomeChart');
        resetPieChartHighlight('monthlyIncomeAdvanceChart');
        
        // 保存頁面位置狀態
        saveJournalPageState();
    }
    
    // 記帳詳情滑動相關變數
    let journalTouchStartX = 0;
    let journalTouchStartY = 0;
    let journalTouchEndX = 0;
    let journalTouchEndY = 0;
    let journalIsSwiping = false;
    let journalCurrentTransform = 0;
    let journalSwipeStartIndex = 0;
    
    // 初始化記帳詳情的滑動手勢
    function initJournalSwipe() {
        const swiper = document.getElementById('journalSwiper');
        if(!swiper) return;
        
        // 移除舊的事件監聽器
        swiper.removeEventListener('touchstart', handleJournalTouchStart);
        swiper.removeEventListener('touchmove', handleJournalTouchMove);
        swiper.removeEventListener('touchend', handleJournalTouchEnd);
        
        // 添加新的事件監聽器
        swiper.addEventListener('touchstart', handleJournalTouchStart, { passive: true });
        swiper.addEventListener('touchmove', handleJournalTouchMove, { passive: false });
        swiper.addEventListener('touchend', handleJournalTouchEnd, { passive: true });
    }
    
    function handleJournalTouchStart(e) {
        journalTouchStartX = e.touches[0].clientX;
        journalTouchStartY = e.touches[0].clientY;
        journalIsSwiping = false;
        journalSwipeStartIndex = currentJournalPageIndex;
        journalCurrentTransform = -currentJournalPageIndex * 33.333;
    }
    
    function handleJournalTouchMove(e) {
        if(!journalTouchStartX || !journalTouchStartY) return;
        
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = journalTouchStartX - currentX;
        const diffY = journalTouchStartY - currentY;
        const absDiffX = Math.abs(diffX);
        const absDiffY = Math.abs(diffY);
        
        if(absDiffY > absDiffX) return;
        if(absDiffX > 5) e.preventDefault();
        
        if(absDiffX > 5) {
            journalIsSwiping = true;
            const container = document.getElementById('journalPageContainer');
            if(container) {
                container.classList.add('swiping');
                
                const swiper = document.getElementById('journalSwiper');
                const swipePercent = -(diffX / swiper.offsetWidth) * 100;
                let newTransform = journalCurrentTransform + swipePercent;
                
                // 限制範圍（0% 到 -66.666%）
                const minTransform = -66.666;
                const maxTransform = 0;
                
                // 檢查是否在邊界
                const isAtLeftBoundary = journalSwipeStartIndex <= 0 && diffX < 0;
                const isAtRightBoundary = journalSwipeStartIndex >= 2 && diffX > 0;
                
                if(isAtLeftBoundary || isAtRightBoundary) {
                    // 添加阻力效果
                    if(newTransform > maxTransform) {
                        newTransform = maxTransform + (newTransform - maxTransform) * 0.3;
                    } else if(newTransform < minTransform) {
                        newTransform = minTransform + (newTransform - minTransform) * 0.3;
                    }
                } else {
                    // 限制在有效範圍內
                    newTransform = Math.max(minTransform, Math.min(maxTransform, newTransform));
                }
                
                container.style.transform = `translateX(${newTransform}%)`;
            }
        }
    }
    
    function handleJournalTouchEnd(e) {
        journalTouchEndX = e.changedTouches[0].clientX;
        journalTouchEndY = e.changedTouches[0].clientY;
        const container = document.getElementById('journalPageContainer');
        if(container && journalIsSwiping) {
            container.classList.remove('swiping');
        }
        
        if(journalIsSwiping) {
            handleJournalSwipe();
        }
        
        journalTouchStartX = 0;
        journalTouchStartY = 0;
        journalTouchEndX = 0;
        journalTouchEndY = 0;
        journalIsSwiping = false;
    }
    
    function handleJournalSwipe() {
        const swipeThreshold = 25;
        const diffX = journalTouchStartX - journalTouchEndX;
        const diffY = journalTouchStartY - journalTouchEndY;
        const absDiffX = Math.abs(diffX);
        const absDiffY = Math.abs(diffY);
        
        // 如果垂直滑動距離大於水平滑動距離，不觸發分頁切換
        if(absDiffY > absDiffX) {
            // 回彈到原位置
            switchJournalPage(currentJournalPageIndex);
            return;
        }
        
        if(absDiffX > swipeThreshold) {
            if(diffX > 0) {
                // 向左滑動，顯示下一個分頁
                if(currentJournalPageIndex < 2) {
                    switchJournalPage(currentJournalPageIndex + 1);
                } else {
                    // 回彈
                    switchJournalPage(currentJournalPageIndex);
                }
            } else {
                // 向右滑動，顯示上一個分頁
                if(currentJournalPageIndex > 0) {
                    switchJournalPage(currentJournalPageIndex - 1);
                } else {
                    // 回彈
                    switchJournalPage(currentJournalPageIndex);
                }
            }
        } else {
            // 滑動距離不夠，回彈
            switchJournalPage(currentJournalPageIndex);
        }
    }
    
            // 載入記帳記錄
    function loadJournalRecords() {
        try {
            const data = localStorage.getItem(`${STORAGE_KEY_JOURNAL}_${currentUserId}`);
            const records = data ? JSON.parse(data) : [];
            // 減少 debug 輸出，只在開發時需要
            return records;
        } catch(e) {
            console.error('載入記帳記錄失敗:', e);
            return [];
        }
    }
    
    // 保存記帳記錄
    function saveJournalRecords(records) {
        if (isUserSwitching) return; // 鎖定攔截
        clearJournalDatesCache();
        try {
            localStorage.setItem(`${STORAGE_KEY_JOURNAL}_${currentUserId}`, JSON.stringify(records));
            if (window.syncJournalToFirestore && window.firebaseUserLoggedIn) {
                window.syncJournalToFirestore(records);
            }
        } catch(e) { console.error(e); }
    }
    
    // 根據記帳記錄重新計算帳戶餘額
    // 這個函式會在記帳記錄從 Firestore 同步後被調用
    function recalculateAccountBalancesFromJournal(userId, journalRecords, accounts) {
        // 【防護機制】如果正在切換使用者，直接返回，避免資料寫入錯誤的使用者
        if (isUserSwitching) {
            console.warn(`[重新計算餘額] 正在切換使用者，跳過餘額重新計算 (使用者 ${userId})`);
            return;
        }
        
        if (!accounts || !Array.isArray(accounts)) {
            console.warn('[重新計算餘額] 沒有帳戶資料');
            return;
        }
        
        if (!journalRecords || !Array.isArray(journalRecords)) {
            console.warn('[重新計算餘額] 沒有記帳記錄');
            return;
        }
        
        // 確認當前 localStorage 中的使用者 ID 與傳入的 userId 一致，避免資料污染
        const STORAGE_KEY_CURRENT_USER = 'my_assets_current_user';
        const currentUserIdFromStorage = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
        if (currentUserIdFromStorage && String(currentUserIdFromStorage) !== String(userId)) {
            console.warn(`[重新計算餘額] 使用者 ID 不一致 (傳入: ${userId}, 當前: ${currentUserIdFromStorage})，跳過重新計算`);
            return;
        }
        
        // 【關鍵修正】策略改變：不反向計算，而是直接從記帳記錄計算最終餘額
        // 問題：如果帳戶餘額已經被記帳記錄影響過，反向計算會得到錯誤的初始餘額
        // 解決：使用 Firestore 同步的 accounts 作為基礎（如果有的話），或者從記帳記錄直接計算
        
        // 1. 先從 Firestore 獲取最新的 accounts 資料（如果有的話）
        // 如果沒有，則使用傳入的 accounts 作為基礎
        const STORAGE_KEY_DATA = 'my_assets_stable_data';
        const userDataKey = `${STORAGE_KEY_DATA}_${userId}`;
        const localAccounts = JSON.parse(localStorage.getItem(userDataKey) || '[]');
        
        // 建立帳戶 ID 到帳戶的映射
        const accountMap = {};
        accounts.forEach(acc => {
            accountMap[acc.id] = acc;
        });
        
        // 2. 初始化最終餘額（使用帳戶的當前餘額作為基礎）
        // 注意：這裡假設傳入的 accounts 是從 Firestore 同步的最新資料
        const accountFinalBalances = {};
        accounts.forEach(acc => {
            // 使用帳戶的當前餘額作為初始值
            accountFinalBalances[acc.id] = parseFloat(acc.balance) || 0;
        });
        
        // 3. 按照時間順序排序記帳記錄
        const sortedRecords = [...journalRecords].sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            if (dateA !== dateB) return dateA - dateB;
            // 如果日期相同，按照創建時間排序
            const createA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const createB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return createA - createB;
        });
        
        // 4. 重新計算：先反向計算得到初始餘額，再正向計算得到最終餘額
        // 反向計算：從當前餘額減去所有記帳記錄的影響，得到初始餘額
        const accountInitialBalances = {};
        accounts.forEach(acc => {
            let initialBalance = parseFloat(acc.balance) || 0;
            
            sortedRecords.forEach(record => {
                const amount = parseFloat(record.amount) || 0;
                
                if (record.type === 'income') {
                    // 收入：反向操作是減去
                    if (String(record.accountId) === String(acc.id)) {
                        initialBalance -= amount;
                    }
                } else if (record.type === 'expense') {
                    // 支出：反向操作是加上
                    if (String(record.accountId) === String(acc.id)) {
                        initialBalance += amount;
                    }
                } else if (record.type === 'transfer') {
                    // 轉帳：反向操作
                    if (String(record.fromAccountId) === String(acc.id)) {
                        initialBalance += amount; // 轉出帳戶反向是加上
                    }
                    if (String(record.toAccountId) === String(acc.id)) {
                        initialBalance -= amount; // 轉入帳戶反向是減去
                    }
                }
            });
            
            accountInitialBalances[acc.id] = initialBalance;
            accountFinalBalances[acc.id] = initialBalance; // 從初始餘額開始正向計算
        });
        
        // 5. 正向計算：從初始餘額加上所有記帳記錄的影響，得到最終餘額
        sortedRecords.forEach(record => {
            const amount = parseFloat(record.amount) || 0;
            
            if (record.type === 'income') {
                // 收入：增加帳戶餘額
                const accountId = String(record.accountId);
                if (accountFinalBalances[accountId] !== undefined) {
                    accountFinalBalances[accountId] += amount;
                }
            } else if (record.type === 'expense') {
                // 支出：減少帳戶餘額
                const accountId = String(record.accountId);
                if (accountFinalBalances[accountId] !== undefined) {
                    accountFinalBalances[accountId] -= amount;
                }
            } else if (record.type === 'transfer') {
                // 轉帳：轉出帳戶減少，轉入帳戶增加
                const fromAccountId = String(record.fromAccountId);
                const toAccountId = String(record.toAccountId);
                if (accountFinalBalances[fromAccountId] !== undefined) {
                    accountFinalBalances[fromAccountId] -= amount;
                }
                if (accountFinalBalances[toAccountId] !== undefined) {
                    accountFinalBalances[toAccountId] += amount;
                }
            }
        });
        
        // 6. 更新帳戶餘額（再次檢查是否正在切換使用者）
        if (isUserSwitching) {
            console.warn(`[重新計算餘額] 計算過程中偵測到使用者切換，取消寫入 (使用者 ${userId})`);
            return;
        }
        
        let hasBalanceChanges = false;
        accounts.forEach(acc => {
            const newBalance = accountFinalBalances[acc.id];
            const currentBalance = parseFloat(acc.balance) || 0;
            if (newBalance !== undefined && Math.abs(currentBalance - newBalance) > 0.01) {
                acc.balance = newBalance;
                hasBalanceChanges = true;
                // 減少 debug 輸出，只在有變化時輸出
            }
        });
        
        if (hasBalanceChanges) {
            // 最後一次檢查：確保在寫入前使用者沒有切換
            const finalCheckUserId = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
            if (finalCheckUserId && String(finalCheckUserId) !== String(userId)) {
                console.warn(`[重新計算餘額] 寫入前使用者 ID 已變更，取消寫入 (原本: ${userId}, 現在: ${finalCheckUserId})`);
                return;
            }
            
            if (isUserSwitching) {
                console.warn(`[重新計算餘額] 寫入前偵測到使用者切換，取消寫入 (使用者 ${userId})`);
                return;
            }
            
            // 保存更新後的帳戶資料
            localStorage.setItem(userDataKey, JSON.stringify(accounts));
            
            // 同步到 Firestore
            if (window.syncAccountsToFirestore && window.firebaseUserLoggedIn && !isUserSwitching) {
                window.syncAccountsToFirestore(accounts);
            }
        }
    }
    
    // 將函式暴露到 window，讓模組可以調用
    window.recalculateAccountBalancesFromJournal = recalculateAccountBalancesFromJournal;
    
    // 編輯記帳記錄
    let editingJournalRecordId = null;
    
    function editJournalRecord(recordId) {
        const records = loadJournalRecords();
        const record = records.find(r => r.id === recordId);
        if(!record) return;
        
        editingJournalRecordId = recordId;
        
        if(record.type === 'income') {
            // 打開收入編輯模態框
            openIncomeModal(record);
        } else if(record.type === 'expense') {
            // 打開支出編輯模態框
            openExpenseModal(record);
        } else if(record.type === 'transfer') {
            // 打開轉帳編輯模態框
            openTransferModal(record);
        }
    }
    
    // 刪除記帳記錄
    function deleteJournalRecord(recordId) {
        if(!confirm('確定要刪除這筆記錄嗎？')) return;
        
        const records = loadJournalRecords();
        const record = records.find(r => r.id === recordId);
        if(!record) {
            console.error('找不到要刪除的記錄:', recordId);
            return;
        }
        
        console.log('刪除記錄:', record);
        
        // 恢復帳戶餘額
        if(record.type === 'income') {
            // 收入：從帳戶餘額中減去金額（因為收入是增加餘額的）
            const account = accounts.find(acc => String(acc.id) === String(record.accountId));
            if(account) {
                const amount = parseFloat(record.amount) || 0;
                account.balance = parseFloat(account.balance) || 0;
                account.balance -= amount;
                console.log('刪除收入 - 帳戶:', account.name, '餘額:', account.balance, '金額:', amount);
            } else {
                console.error('找不到收入帳戶:', record.accountId, '所有帳戶ID:', accounts.map(a => a.id));
            }
        } else if(record.type === 'expense') {
            // 支出：向帳戶餘額中加上金額（因為支出是減少餘額的）
            const account = accounts.find(acc => String(acc.id) === String(record.accountId));
            if(account) {
                    // 正常恢復金額
                    const amount = parseFloat(record.amount) || 0;
                    account.balance = parseFloat(account.balance) || 0;
                    account.balance += amount;
                    console.log('刪除支出 - 帳戶:', account.name, '餘額:', account.balance, '金額:', amount);
            } else {
                console.error('找不到支出帳戶:', record.accountId, '所有帳戶ID:', accounts.map(a => a.id));
            }
        } else if(record.type === 'transfer') {
            // 轉帳：轉出帳戶餘額加上金額，轉入帳戶餘額減去金額
            const fromAccount = accounts.find(acc => String(acc.id) === String(record.fromAccountId));
            const toAccount = accounts.find(acc => String(acc.id) === String(record.toAccountId));
            if(fromAccount && toAccount) {
                const amount = parseFloat(record.amount) || 0;
                fromAccount.balance = parseFloat(fromAccount.balance) || 0;
                toAccount.balance = parseFloat(toAccount.balance) || 0;
                fromAccount.balance += amount;
                toAccount.balance -= amount;
                console.log('刪除轉帳 - 轉出帳戶:', fromAccount.name, '餘額:', fromAccount.balance, '轉入帳戶:', toAccount.name, '餘額:', toAccount.balance, '金額:', amount);
            } else {
                console.error('找不到轉帳帳戶 - 轉出:', record.fromAccountId, '轉入:', record.toAccountId, '所有帳戶ID:', accounts.map(a => a.id));
            }
        }
        
        // 刪除記錄
        const filtered = records.filter(r => r.id !== recordId);
        
        // 先保存到 localStorage
        clearJournalDatesCache();
        localStorage.setItem(`${STORAGE_KEY_JOURNAL}_${currentUserId}`, JSON.stringify(filtered));
        const userDataKey = `${STORAGE_KEY_DATA}_${currentUserId}`;
        localStorage.setItem(userDataKey, JSON.stringify(accounts));
        
        // 【關鍵修正】從 localStorage 重新讀取當前使用者的 accounts，確保資料正確
        const currentUserAccounts = JSON.parse(localStorage.getItem(userDataKey) || '[]');
        
        // 一起同步 journal 和 accounts 到 Firestore（只更新 currentUserId）
        if (window.syncJournalAndAccountsToFirestore && window.firebaseUserLoggedIn) {
            window.syncJournalAndAccountsToFirestore(filtered, currentUserAccounts).catch(err => {
                console.error('[刪除記帳同步] 同步失敗:', err);
            });
        }
        
        console.log('資料已保存並同步');
        
        // 重新渲染
        renderAssets();
        updateChartData();
        renderCalendar(); // 更新日期底下的顏色標記
        if(selectedDate) {
            showFixedTransferDetailsForDate(selectedDate);
        }
    }
    
    // 修改 openIncomeModal 以支持編輯模式
    function openIncomeModal(record = null, savedFormData = null) {
        currentJournalType = 'income';
        // 重新開啟時清除過時的 AI 批量匯入狀態文字
        const incomeStatus = document.getElementById('incomeAiStatus');
        const expenseStatus = document.getElementById('expenseAiStatus');
        if(incomeStatus) { incomeStatus.textContent = ''; }
        if(expenseStatus) { expenseStatus.textContent = ''; }
        
        if(record) {
            // 編輯模式
            currentJournalDate = new Date(record.date);
            currentJournalCategory = record.category || null;
            currentJournalAccountId = record.accountId || null;
        } else if(savedFormData && savedFormData.type === 'income') {
            // 恢復保存的表單數據
            currentJournalDate = savedFormData.date ? new Date(savedFormData.date) : (selectedDate ? new Date(selectedDate) : new Date());
            currentJournalDate.setHours(0, 0, 0, 0);
            currentJournalCategory = savedFormData.category || null;
            currentJournalAccountId = savedFormData.accountId || null;
            pendingJournalFormData = null; // 清除保存的數據
        } else {
            // 新增模式：如果 currentJournalDate 已經在 openNewIncome 中設置，則保留它；否則使用今天
            if(!currentJournalDate || currentJournalDate.getTime() === new Date().getTime()) {
                // 如果沒有設置或等於當前時間，使用選中的日期或今天
                if(selectedDate) {
                    currentJournalDate = new Date(selectedDate);
                    currentJournalDate.setHours(0, 0, 0, 0);
                } else {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    currentJournalDate = today;
                }
            }
            currentJournalCategory = null;
            currentJournalAccountId = null;
        }
        
        const modal = document.getElementById('incomeModal');
        const modalWrapper = modal.querySelector('.modal-content-wrapper');
        const title = modal.querySelector('.modal-title');
        
        if(title) {
            title.textContent = record ? '編輯收入' : '新增收入';
        }
        
        // 初始化日期顯示
        updateIncomeDateDisplay();
        
        // 填充或重置表單
        if(record) {
            document.getElementById('incomeAmount').value = record.amount || '';
            const titleInput = document.getElementById('incomeTitle');
            if(titleInput) {
                titleInput.value = record.title || '';
            }
            document.getElementById('incomeCategory').textContent = record.category || '選擇類別';
            document.getElementById('incomeCategory').style.color = record.category ? 'var(--text-primary)' : 'var(--text-secondary)';
            const account = accounts.find(acc => acc.id === record.accountId);
            document.getElementById('incomeAccount').textContent = account ? account.name : '選擇帳戶';
            document.getElementById('incomeAccount').style.color = account ? 'var(--text-primary)' : 'var(--text-secondary)';
            const isAdvanceCheckbox = document.getElementById('incomeIsAdvance');
            if(isAdvanceCheckbox) {
                isAdvanceCheckbox.checked = record.isAdvance || false;
            }
        } else if(savedFormData && savedFormData.type === 'income') {
            // 恢復保存的表單數據
            document.getElementById('incomeAmount').value = savedFormData.amount || '';
            if(savedFormData.category) {
                document.getElementById('incomeCategory').textContent = savedFormData.category;
                document.getElementById('incomeCategory').style.color = 'var(--text-primary)';
            } else {
                document.getElementById('incomeCategory').textContent = '選擇類別';
                document.getElementById('incomeCategory').style.color = 'var(--text-secondary)';
            }
            if(savedFormData.accountId) {
                const account = accounts.find(acc => acc.id === savedFormData.accountId);
                if(account) {
                    document.getElementById('incomeAccount').textContent = account.name;
                    document.getElementById('incomeAccount').style.color = 'var(--text-primary)';
                } else {
                    document.getElementById('incomeAccount').textContent = '選擇帳戶';
                    document.getElementById('incomeAccount').style.color = 'var(--text-secondary)';
                }
            } else {
                document.getElementById('incomeAccount').textContent = '選擇帳戶';
                document.getElementById('incomeAccount').style.color = 'var(--text-secondary)';
            }
        } else {
            document.getElementById('incomeAmount').value = '';
            const titleInput = document.getElementById('incomeTitle');
            if(titleInput) {
                titleInput.value = '';
            }
            document.getElementById('incomeCategory').textContent = '選擇類別';
            document.getElementById('incomeCategory').style.color = 'var(--text-secondary)';
            document.getElementById('incomeAccount').textContent = '選擇帳戶';
            document.getElementById('incomeAccount').style.color = 'var(--text-secondary)';
            const isAdvanceCheckbox = document.getElementById('incomeIsAdvance');
            if(isAdvanceCheckbox) {
                isAdvanceCheckbox.checked = false;
            }
        }
        
        // 更新分頁樣式
        const tabs = modal.querySelectorAll('.journal-form-tab');
        tabs.forEach(t => {
            t.classList.remove('active');
            t.style.background = 'var(--border-color)';
            t.style.color = 'var(--text-secondary)';
            t.style.border = 'none';
        });
        const incomeTab = document.getElementById('journalFormTabIncome');
        if(incomeTab) {
            incomeTab.classList.add('active');
            incomeTab.style.background = 'var(--card-bg)';
            incomeTab.style.color = 'var(--color-up)';
            incomeTab.style.border = '2px solid var(--color-up)';
        }
        
        if(modalWrapper) {
            modalWrapper.style.transform = 'translateX(100%)';
            modalWrapper.classList.remove('swiping');
        }
        modal.style.display = 'block';
        modal.style.background = 'transparent';
        // 先不隱藏其他 modal，等本 modal 滑入後再隱藏，避免露出底層日期/日曆頁造成閃爍
        requestAnimationFrame(() => {
            setTimeout(() => {
                if(modalWrapper) modalWrapper.style.transform = 'translateX(0)';
                setTimeout(() => {
                    ['expenseModal', 'transferModal', 'fixedTransferListModal'].forEach(id => {
                        const other = document.getElementById(id);
                        if(other) other.style.display = 'none';
                    });
                }, 50);
            }, 10);
        });
        const fabButton = modal.querySelector('button[onclick*="openFixedTransferListFromJournal"]');
        if(fabButton) fabButton.style.display = 'flex';
    }
    
    // 修改 openExpenseModal 以支持編輯模式
    function openExpenseModal(record = null, savedFormData = null) {
        currentJournalType = 'expense';
        // 重新開啟時清除過時的 AI 批量匯入狀態文字
        const incomeStatus = document.getElementById('incomeAiStatus');
        const expenseStatus = document.getElementById('expenseAiStatus');
        if(incomeStatus) { incomeStatus.textContent = ''; }
        if(expenseStatus) { expenseStatus.textContent = ''; }
        
        if(record) {
            // 編輯模式
            currentJournalDate = new Date(record.date);
            currentJournalCategory = record.category || null;
            currentJournalAccountId = record.accountId || null;
        } else if(savedFormData && savedFormData.type === 'expense') {
            // 恢復保存的表單數據
            currentJournalDate = savedFormData.date ? new Date(savedFormData.date) : (selectedDate ? new Date(selectedDate) : new Date());
            currentJournalDate.setHours(0, 0, 0, 0);
            currentJournalCategory = savedFormData.category || null;
            currentJournalAccountId = savedFormData.accountId || null;
            pendingJournalFormData = null; // 清除保存的數據
        } else {
            // 新增模式：如果 currentJournalDate 已經在 openNewExpense 中設置，則保留它；否則使用今天
            if(!currentJournalDate || currentJournalDate.getTime() === new Date().getTime()) {
                // 如果沒有設置或等於當前時間，使用選中的日期或今天
                if(selectedDate) {
                    currentJournalDate = new Date(selectedDate);
                    currentJournalDate.setHours(0, 0, 0, 0);
                } else {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    currentJournalDate = today;
                }
            }
            currentJournalCategory = null;
            currentJournalAccountId = null;
        }
        
        const modal = document.getElementById('expenseModal');
        const modalWrapper = modal.querySelector('.modal-content-wrapper');
        const title = modal.querySelector('.modal-title');
        
        if(title) {
            title.textContent = record ? '編輯支出' : '新增支出';
        }
        
        // 初始化日期顯示
        updateExpenseDateDisplay();
        
        // 填充或重置表單
        if(record) {
            document.getElementById('expenseAmount').value = record.amount || '';
            const titleInput = document.getElementById('expenseTitle');
            if(titleInput) {
                titleInput.value = record.title || '';
            }
            document.getElementById('expenseCategory').textContent = record.category || '選擇類別';
            document.getElementById('expenseCategory').style.color = record.category ? 'var(--text-primary)' : 'var(--text-secondary)';
            const account = accounts.find(acc => acc.id === record.accountId);
            document.getElementById('expenseAccount').textContent = account ? account.name : '選擇帳戶';
            document.getElementById('expenseAccount').style.color = account ? 'var(--text-primary)' : 'var(--text-secondary)';
            const isAdvanceCheckbox = document.getElementById('expenseIsAdvance');
            if(isAdvanceCheckbox) {
                isAdvanceCheckbox.checked = record.isAdvance || false;
            }
        } else if(savedFormData && savedFormData.type === 'expense') {
            // 恢復保存的表單數據
            document.getElementById('expenseAmount').value = savedFormData.amount || '';
            if(savedFormData.category) {
                document.getElementById('expenseCategory').textContent = savedFormData.category;
                document.getElementById('expenseCategory').style.color = 'var(--text-primary)';
            } else {
                document.getElementById('expenseCategory').textContent = '選擇類別';
                document.getElementById('expenseCategory').style.color = 'var(--text-secondary)';
            }
            if(savedFormData.accountId) {
                const account = accounts.find(acc => acc.id === savedFormData.accountId);
                if(account) {
                    document.getElementById('expenseAccount').textContent = account.name;
                    document.getElementById('expenseAccount').style.color = 'var(--text-primary)';
                } else {
                    document.getElementById('expenseAccount').textContent = '選擇帳戶';
                    document.getElementById('expenseAccount').style.color = 'var(--text-secondary)';
                }
            } else {
                document.getElementById('expenseAccount').textContent = '選擇帳戶';
                document.getElementById('expenseAccount').style.color = 'var(--text-secondary)';
            }
        } else {
            document.getElementById('expenseAmount').value = '';
            const titleInput = document.getElementById('expenseTitle');
            if(titleInput) {
                titleInput.value = '';
            }
            document.getElementById('expenseCategory').textContent = '選擇類別';
            document.getElementById('expenseCategory').style.color = 'var(--text-secondary)';
            document.getElementById('expenseAccount').textContent = '選擇帳戶';
            document.getElementById('expenseAccount').style.color = 'var(--text-secondary)';
            const isAdvanceCheckbox = document.getElementById('expenseIsAdvance');
            if(isAdvanceCheckbox) {
                isAdvanceCheckbox.checked = false;
            }
        }
        
        if(modalWrapper) {
            modalWrapper.style.transform = 'translateX(100%)';
            modalWrapper.classList.remove('swiping');
        }
        modal.style.display = 'block';
        modal.style.background = 'transparent';
        // 先不隱藏其他 modal，等本 modal 滑入後再隱藏，避免露出底層日期/日曆頁造成閃爍
        requestAnimationFrame(() => {
            setTimeout(() => {
                if(modalWrapper) modalWrapper.style.transform = 'translateX(0)';
                setTimeout(() => {
                    ['incomeModal', 'transferModal', 'fixedTransferListModal'].forEach(id => {
                        const other = document.getElementById(id);
                        if(other) other.style.display = 'none';
                    });
                }, 50);
            }, 10);
        });
        const fabButton = modal.querySelector('button[onclick*="openFixedTransferListFromJournal"]');
        if(fabButton) fabButton.style.display = 'flex';
    }
    
    // 獲取指定日期的記帳記錄
    // 格式化本地日期為 YYYY-MM-DD 格式（避免時區問題）
    function formatLocalDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // 緩存所有記帳記錄的日期集合，避免重複查找
    let journalDatesCache = null;
    function getJournalDatesSet() {
        if(journalDatesCache === null) {
            const records = loadJournalRecords();
            journalDatesCache = new Set();
            records.forEach(record => {
                if(record.date) {
                    const dateStr = record.date.split('T')[0];
                    journalDatesCache.add(dateStr);
                }
            });
        }
        return journalDatesCache;
    }
    
    function getJournalRecordsForDate(dateStr) {
        const records = loadJournalRecords();
        // 確保日期格式一致（YYYY-MM-DD）
        const normalizedDateStr = dateStr.split('T')[0];
        return records.filter(record => {
            const recordDate = record.date ? record.date.split('T')[0] : '';
            return recordDate === normalizedDateStr;
        });
    }
    
    // 清除緩存（當記帳記錄更新時調用）
    function clearJournalDatesCache() {
        journalDatesCache = null;
    }
    
    // 計算記帳的今日盈虧（今日收入 - 今日支出）
    function calculateJournalDailyPnL() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = formatLocalDate(today);
        const records = getJournalRecordsForDate(todayStr);
        
        let income = 0;
        let expense = 0;
        
        records.forEach(record => {
            const amount = parseFloat(record.amount) || 0;
            if(record.type === 'income') {
                income += amount;
            } else if(record.type === 'expense') {
                expense += amount;
            }
            // 轉帳不影響盈虧計算
        });
        
        return income - expense;
    }
    
    // 損益歸零：保存當前損益值並將顯示值設為0
    function resetPnL() {
        if(!confirm('確定要將當日損益和總損益歸零嗎？此操作可以恢復。')) return;
        
        const dailyPnL = calculateJournalDailyPnL();
        const totalPnL = calculateJournalTotalPnL();
        
        // 保存原始值到 localStorage
        const backup = {
            dailyPnL: dailyPnL,
            totalPnL: totalPnL,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem(`pnl_backup_${currentUserId}`, JSON.stringify(backup));
        
        // 保存偏移值（用於計算顯示值）
        localStorage.setItem(`pnl_daily_offset_${currentUserId}`, (-dailyPnL).toString());
        localStorage.setItem(`pnl_total_offset_${currentUserId}`, (-totalPnL).toString());
        
        // 重新渲染以更新顯示
        updateChartData();
        alert('損益已歸零');
        // 自動重新整理頁面
        setTimeout(() => {
            location.reload();
        }, 500);
    }
    
    // 恢復損益：恢復到歸零前的值
    function restorePnL() {
        const backup = localStorage.getItem(`pnl_backup_${currentUserId}`);
        if(!backup) {
            alert('沒有可恢復的損益記錄');
            return;
        }
        
        if(!confirm('確定要恢復損益嗎？')) return;
        
        // 清除偏移值
        localStorage.removeItem(`pnl_daily_offset_${currentUserId}`);
        localStorage.removeItem(`pnl_total_offset_${currentUserId}`);
        localStorage.removeItem(`pnl_backup_${currentUserId}`);
        
        // 重新渲染以更新顯示
        updateChartData();
        alert('損益已恢復');
        // 自動重新整理頁面
        setTimeout(() => {
            location.reload();
        }, 500);
    }
    
    // 獲取當日損益偏移值
    function getDailyPnLOffset() {
        const offset = localStorage.getItem(`pnl_daily_offset_${currentUserId}`);
        return offset ? parseFloat(offset) : 0;
    }
    
    // 獲取總損益偏移值
    function getTotalPnLOffset() {
        const offset = localStorage.getItem(`pnl_total_offset_${currentUserId}`);
        return offset ? parseFloat(offset) : 0;
    }
    
    // 計算記帳的總計盈虧（所有收入 - 所有支出）
    function calculateJournalTotalPnL() {
        const records = loadJournalRecords();
        
        let income = 0;
        let expense = 0;
        
        records.forEach(record => {
            const amount = parseFloat(record.amount) || 0;
            if(record.type === 'income') {
                income += amount;
            } else if(record.type === 'expense') {
                expense += amount;
            }
            // 轉帳不影響盈虧計算
        });
        
        return income - expense;
    }
    
    // 獲取指定日期的所有固定轉帳（使用與日曆渲染相同的邏輯）
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
    
    // Calendar Journal Functions (新增支出/收入)
    function openCalendarJournalModal() {
        // 如果沒有選中日期，使用今天
        if(!selectedDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            selectedDate = new Date(today);
            renderCalendar();
        }
        
        const modal = document.getElementById('calendarJournalModal');
        const modalWrapper = modal.querySelector('.modal-content-wrapper');
        
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
    
    // 從日曆頁面直接打開支出新增（使用當前日期或選中的日期）
    // 注意：這個函數已被 openJournalTypeSelector 取代，但保留以向後兼容
    function openNewExpenseFromCalendar() {
        // 如果沒有選中日期，使用今天
        if(!selectedDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            selectedDate = new Date(today);
            renderCalendar();
        }
        // 打開四個分頁的模態框
        openJournalTypeSelector();
    }
    
    function closeCalendarJournalModal() {
        const modal = document.getElementById('calendarJournalModal');
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
    
    // 收入和支出類別定義
    const incomeCategories = ['工資', '獎金', '投資收益', '其他收入'];
    const expenseCategories = ['飲食', '交通', '購物', '娛樂', '醫療', '教育', '房租', '水電', '其他支出'];
    
    // 當前記帳相關的變數
    let currentJournalType = null; // 'income', 'expense', 'transfer'
    let currentJournalDate = new Date();
    let currentJournalCategory = null;
    let currentJournalAccountId = null;
    let batchExpenseRecords = []; // AI 批量辨識的支出紀錄
    let batchExpenseAccountId = null;
    let batchIncomeRecords = []; // AI 批量辨識的收入紀錄
    let batchIncomeAccountId = null;
    let currentTransferFromAccountId = null;
    let currentTransferToAccountId = null;
    let pendingJournalFormData = null; // 保存跳轉到新增帳戶前的表單數據
    
    // 新增支出
    function openNewExpense() {
        // 不再關閉日曆模態框，因為現在直接從右上角+號打開
        editingJournalRecordId = null;
        currentJournalType = 'expense';
        // 使用選中的日期，如果沒有選中則使用今天
        if(selectedDate) {
            currentJournalDate = new Date(selectedDate);
            currentJournalDate.setHours(0, 0, 0, 0); // 確保時間部分為 00:00:00
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            currentJournalDate = new Date(today);
            selectedDate = new Date(today);
            renderCalendar();
        }
        currentJournalCategory = null;
        currentJournalAccountId = null;
        openExpenseModal();
    }
    
    function closeExpenseModal() {
        const modal = document.getElementById('expenseModal');
        const modalWrapper = modal.querySelector('.modal-content-wrapper');
        // 立即隱藏所有記帳 modal 的 FAB（固定支出、固定收入、固定轉帳）
        ['expenseModal', 'incomeModal', 'transferModal'].forEach(function(id) {
            var m = document.getElementById(id);
            if(m) {
                var fab = m.querySelector('button[onclick*="openFixedExpenseListFromJournal"], button[onclick*="openFixedIncomeListFromJournal"], button[onclick*="openFixedTransferListFromJournal"]');
                if(fab) fab.style.display = 'none';
            }
        });
        if(modalWrapper) {
            modalWrapper.style.transform = 'translateX(100%)';
            setTimeout(() => {
                modal.style.display = 'none';
                modalWrapper.style.transform = 'translateX(100%)';
            }, 400);
        } else {
            modal.style.display = 'none';
        }
    }
    
    function updateExpenseDateDisplay() {
        const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
        const dateStr = `${currentJournalDate.getFullYear()}年${currentJournalDate.getMonth() + 1}月${currentJournalDate.getDate()}日 ${weekdays[currentJournalDate.getDay()]}`;
        document.getElementById('expenseDate').textContent = dateStr;
        document.getElementById('expenseDateDisplay').textContent = dateStr;
        document.getElementById('expenseDateDisplay').style.color = 'var(--text-primary)';
    }
    
    // 支出 AI 匯入教學範例（發票怪獸 / 財政部發票存摺 / 國泰信用卡）
    // 支出 AI 匯入截圖
    function triggerExpenseImageUpload() {
        if(!settings.geminiKey) {
            alert('請先在設定中設定 Gemini API Key');
            return;
        }
        document.getElementById('expenseImgUpload').click();
    }
    
    async function handleExpenseImageUpload(input) {
        if(!input.files || input.files.length === 0) return;
        const statusEl = document.getElementById('expenseAiStatus');
        const files = Array.from(input.files);
        statusEl.textContent = `讀取 ${files.length} 張圖片中...`;
        statusEl.style.color = 'var(--text-secondary)';
        try {
            statusEl.textContent = `讀取圖片中...`;
            const imageParts = await Promise.all(files.map((file) => new Promise((res, rej) => {
                const r = new FileReader();
                r.onload = e => res({ inlineData: { mimeType: file.type, data: e.target.result.split(',')[1] } });
                r.onerror = rej;
                r.readAsDataURL(file);
            })));
            const prompt = `分析以下多張支出/消費紀錄截圖。每張圖片可能包含多筆交易，每筆通常有：日期(如 2026/02/10)、類別(如 消費店家、交通/運輸)、標題/店家名稱、金額(TWD)。請提取「所有圖片」中的每筆紀錄，合併成一個清單。類別請對應到以下其一：飲食、交通、購物、娛樂、醫療、教育、房租、水電、其他支出。（消費店家→購物，交通/運輸→交通）回傳 JSON 格式：{"records":[{"date":"YYYY-MM-DD","category":"類別","title":"標題或店家名","amount":數字}, ...]}。若只有一筆也請用 records 陣列。`;
            statusEl.textContent = `AI 分析中 (${files.length} 張)...`;
            statusEl.style.color = '#0a84ff';
            const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${settings.geminiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }, ...imageParts] }]
                })
            });
            const data = await resp.json();
            if(data.error) throw new Error(data.error.message);
            if(!data.candidates?.[0]?.content?.parts?.[0]?.text) throw new Error('AI 回應格式錯誤');
            const txt = data.candidates[0].content.parts[0].text;
            const match = txt.match(/\{[\s\S]*\}/);
            if(!match) throw new Error('AI 未辨識到有效資料');
            let parsed;
            try {
                parsed = JSON.parse(match[0]);
            } catch(e) {
                const cleaned = match[0].replace(/```json\s*/g, '').replace(/```/g, '').trim();
                parsed = JSON.parse(cleaned);
            }
            const allRecords = parsed.records || (parsed.record ? [parsed.record] : []);
            if(allRecords.length === 0) throw new Error('未辨識到支出紀錄');
            batchExpenseRecords = allRecords;
            batchExpenseAccountId = null;
            const label = document.getElementById('batchExpenseAccountLabel');
            if(label) { label.textContent = '選擇帳戶'; label.style.color = 'var(--text-secondary)'; }
            renderBatchExpenseList();
            const modal = document.getElementById('batchExpenseModal');
            if(modal) modal.style.display = 'block';
            statusEl.textContent = `已辨識 ${files.length} 張圖片、共 ${allRecords.length} 筆，請選擇帳戶後全部加入`;
            statusEl.style.color = '#30d158';
        } catch(e) {
            console.error(e);
            statusEl.textContent = '失敗：' + (e.message || '請重試');
            statusEl.style.color = '#ff453a';
        }
        input.value = '';
    }
    
    function openBatchAccountSelector() {
        openJournalAccountSelector('batchExpense');
    }
    
    /** @param {boolean} preserveRecords - 若為 true 僅隱藏 modal，不清空辨識結果（用於無帳戶時先跳轉新增，新增完再帶回） */
    function closeBatchExpenseModal(preserveRecords) {
        const modal = document.getElementById('batchExpenseModal');
        if(modal) modal.style.display = 'none';
        if(!preserveRecords) {
            batchExpenseRecords = [];
            batchExpenseAccountId = null;
        }
    }
    
    function renderBatchExpenseList() {
        const list = document.getElementById('batchExpenseList');
        const countEl = document.getElementById('batchExpenseCount');
        if(!list || !countEl) return;
        countEl.textContent = `共 ${batchExpenseRecords.length} 筆`;
        list.innerHTML = '';
        const catMap = { '消費店家':'購物', '交通/運輸':'交通', '飲食':'飲食', '交通':'交通', '購物':'購物', '娛樂':'娛樂', '醫療':'醫療', '教育':'教育', '房租':'房租', '水電':'水電', '其他':'其他支出' };
        batchExpenseRecords.forEach((rec, idx) => {
            const cat = catMap[rec.category] || rec.category || '其他支出';
            const validCat = expenseCategories.includes(cat) ? cat : '其他支出';
            const dateStr = rec.date || '';
            const amount = Math.round(parseFloat(rec.amount) || 0);
            const title = rec.title || '';
            const item = document.createElement('div');
            item.style.cssText = 'background: var(--active-bg); border-radius: 12px; padding: 14px 16px; margin-bottom: 10px;';
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <div style="color: var(--text-primary); font-size: 16px; font-weight: 500;">${title || '(無標題)'}</div>
                        <div style="color: var(--text-secondary); font-size: 14px; margin-top: 4px;">${dateStr} · ${validCat}</div>
                    </div>
                    <div style="color: var(--color-down); font-size: 17px; font-weight: 600;">-$${amount}</div>
                </div>
            `;
            list.appendChild(item);
        });
    }
    
    function saveBatchExpenses() {
        if(!batchExpenseAccountId) {
            alert('請選擇支出帳戶');
            return;
        }
        const account = accounts.find(acc => acc.id === batchExpenseAccountId);
        if(!account) {
            alert('找不到帳戶');
            return;
        }
        const catMap = { '消費店家':'購物', '交通/運輸':'交通', '飲食':'飲食', '交通':'交通', '購物':'購物', '娛樂':'娛樂', '醫療':'醫療', '教育':'教育', '房租':'房租', '水電':'水電', '其他':'其他支出' };
        const records = loadJournalRecords();
        let totalAmount = 0;
        batchExpenseRecords.forEach((rec, idx) => {
            const dateStr = rec.date || '';
            let y = new Date().getFullYear(), m = new Date().getMonth(), d = new Date().getDate();
            if(dateStr) {
                const parts = dateStr.split(/[-/]/);
                if(parts.length >= 3) {
                    y = parseInt(parts[0]) || y;
                    m = (parseInt(parts[1]) || 1) - 1;
                    d = parseInt(parts[2]) || 1;
                } else if(parts.length === 2) {
                    m = (parseInt(parts[0]) || 1) - 1;
                    d = parseInt(parts[1]) || 1;
                }
            }
            const year = y, month = String(m + 1).padStart(2, '0'), day = String(d).padStart(2, '0');
            const dateStrFormatted = `${year}-${month}-${day}`;
            const cat = catMap[rec.category] || rec.category || '其他支出';
            const validCat = expenseCategories.includes(cat) ? cat : '其他支出';
            const amount = Math.round(parseFloat(rec.amount) || 0);
            if(amount <= 0) return;
            totalAmount += amount;
            records.push({
                id: (Date.now() + idx).toString(),
                type: 'expense',
                date: dateStrFormatted,
                amount: amount,
                category: validCat,
                accountId: batchExpenseAccountId,
                isAdvance: false,
                title: (rec.title || '').trim(),
                createdAt: new Date().toISOString()
            });
        });
        account.balance -= totalAmount;
        clearJournalDatesCache();
        localStorage.setItem(`${STORAGE_KEY_JOURNAL}_${currentUserId}`, JSON.stringify(records));
        const userDataKey = `${STORAGE_KEY_DATA}_${currentUserId}`;
        localStorage.setItem(userDataKey, JSON.stringify(accounts));
        const currentUserAccounts = JSON.parse(localStorage.getItem(userDataKey) || '[]');
        if (window.syncJournalAndAccountsToFirestore && window.firebaseUserLoggedIn) {
            window.syncJournalAndAccountsToFirestore(records, currentUserAccounts).catch(err => {
                console.error('[記帳同步] 同步失敗:', err);
            });
        }
        renderAssets();
        updateChartData();
        renderCalendar(); // 重新渲染日曆以更新有支出天數的藍色標記
        if(selectedDate) {
            showFixedTransferDetailsForDate(selectedDate);
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            selectedDate = today;
            showFixedTransferDetailsForDate(today);
        }
        closeBatchExpenseModal();
        closeExpenseModal();
    }
    
    // 收入 AI 批量匯入
    function triggerIncomeImageUpload() {
        if(!settings.geminiKey) {
            alert('請先在設定中設定 Gemini API Key');
            return;
        }
        document.getElementById('incomeImgUpload').click();
    }
    
    async function handleIncomeImageUpload(input) {
        if(!input.files || input.files.length === 0) return;
        const statusEl = document.getElementById('incomeAiStatus');
        const files = Array.from(input.files);
        statusEl.textContent = `讀取 ${files.length} 張圖片中...`;
        statusEl.style.color = 'var(--text-secondary)';
        try {
            statusEl.textContent = `讀取圖片中...`;
            const imageParts = await Promise.all(files.map((file) => new Promise((res, rej) => {
                const r = new FileReader();
                r.onload = e => res({ inlineData: { mimeType: file.type, data: e.target.result.split(',')[1] } });
                r.onerror = rej;
                r.readAsDataURL(file);
            })));
            const prompt = `分析以下多張收入紀錄截圖。每張圖片可能包含多筆收入，每筆通常有：日期(如 2026/02/10)、類別(如 工資、獎金、投資收益)、標題/來源、金額(TWD)。請提取「所有圖片」中的每筆紀錄，合併成一個清單。類別請對應到以下其一：工資、獎金、投資收益、其他收入。回傳 JSON 格式：{"records":[{"date":"YYYY-MM-DD","category":"類別","title":"標題或來源","amount":數字}, ...]}。若只有一筆也請用 records 陣列。`;
            statusEl.textContent = `AI 分析中 (${files.length} 張)...`;
            statusEl.style.color = '#30d158';
            const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${settings.geminiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }, ...imageParts] }]
                })
            });
            const data = await resp.json();
            if(data.error) throw new Error(data.error.message);
            if(!data.candidates?.[0]?.content?.parts?.[0]?.text) throw new Error('AI 回應格式錯誤');
            const txt = data.candidates[0].content.parts[0].text;
            const match = txt.match(/\{[\s\S]*\}/);
            if(!match) throw new Error('AI 未辨識到有效資料');
            let parsed;
            try {
                parsed = JSON.parse(match[0]);
            } catch(e) {
                const cleaned = match[0].replace(/```json\s*/g, '').replace(/```/g, '').trim();
                parsed = JSON.parse(cleaned);
            }
            const allRecords = parsed.records || (parsed.record ? [parsed.record] : []);
            if(allRecords.length === 0) throw new Error('未辨識到收入紀錄');
            batchIncomeRecords = allRecords;
            batchIncomeAccountId = null;
            const label = document.getElementById('batchIncomeAccountLabel');
            if(label) { label.textContent = '選擇帳戶'; label.style.color = 'var(--text-secondary)'; }
            renderBatchIncomeList();
            const modal = document.getElementById('batchIncomeModal');
            if(modal) modal.style.display = 'block';
            statusEl.textContent = `已辨識 ${files.length} 張圖片、共 ${allRecords.length} 筆，請選擇帳戶後全部加入`;
            statusEl.style.color = '#30d158';
        } catch(e) {
            console.error(e);
            statusEl.textContent = '失敗：' + (e.message || '請重試');
            statusEl.style.color = '#ff453a';
        }
        input.value = '';
    }
    
    function openBatchIncomeAccountSelector() {
        openJournalAccountSelector('batchIncome');
    }
    
    /** @param {boolean} preserveRecords - 若為 true 僅隱藏 modal，不清空辨識結果（用於無帳戶時先跳轉新增，新增完再帶回） */
    function closeBatchIncomeModal(preserveRecords) {
        const modal = document.getElementById('batchIncomeModal');
        if(modal) modal.style.display = 'none';
        if(!preserveRecords) {
            batchIncomeRecords = [];
            batchIncomeAccountId = null;
        }
    }
    
    function renderBatchIncomeList() {
        const list = document.getElementById('batchIncomeList');
        const countEl = document.getElementById('batchIncomeCount');
        if(!list || !countEl) return;
        countEl.textContent = `共 ${batchIncomeRecords.length} 筆`;
        list.innerHTML = '';
        const catMap = { '薪資':'工資', '薪水':'工資', '工資':'工資', '獎金':'獎金', '投資':'投資收益', '投資收益':'投資收益', '其他':'其他收入' };
        batchIncomeRecords.forEach((rec) => {
            const cat = catMap[rec.category] || rec.category || '其他收入';
            const validCat = incomeCategories.includes(cat) ? cat : '其他收入';
            const dateStr = rec.date || '';
            const amount = Math.round(parseFloat(rec.amount) || 0);
            const title = rec.title || '';
            const item = document.createElement('div');
            item.style.cssText = 'background: var(--active-bg); border-radius: 12px; padding: 14px 16px; margin-bottom: 10px;';
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <div style="color: var(--text-primary); font-size: 16px; font-weight: 500;">${title || '(無標題)'}</div>
                        <div style="color: var(--text-secondary); font-size: 14px; margin-top: 4px;">${dateStr} · ${validCat}</div>
                    </div>
                    <div style="color: var(--color-up); font-size: 17px; font-weight: 600;">+$${amount}</div>
                </div>
            `;
            list.appendChild(item);
        });
    }
    
    function saveBatchIncomes() {
        if(!batchIncomeAccountId) {
            alert('請選擇收入帳戶');
            return;
        }
        const account = accounts.find(acc => acc.id === batchIncomeAccountId);
        if(!account) {
            alert('找不到帳戶');
            return;
        }
        const catMap = { '薪資':'工資', '薪水':'工資', '工資':'工資', '獎金':'獎金', '投資':'投資收益', '投資收益':'投資收益', '其他':'其他收入' };
        const records = loadJournalRecords();
        let totalAmount = 0;
        batchIncomeRecords.forEach((rec, idx) => {
            const dateStr = rec.date || '';
            let y = new Date().getFullYear(), m = new Date().getMonth(), d = new Date().getDate();
            if(dateStr) {
                const parts = dateStr.split(/[-/]/);
                if(parts.length >= 3) {
                    y = parseInt(parts[0]) || y;
                    m = (parseInt(parts[1]) || 1) - 1;
                    d = parseInt(parts[2]) || 1;
                } else if(parts.length === 2) {
                    m = (parseInt(parts[0]) || 1) - 1;
                    d = parseInt(parts[1]) || 1;
                }
            }
            const year = y, month = String(m + 1).padStart(2, '0'), day = String(d).padStart(2, '0');
            const dateStrFormatted = `${year}-${month}-${day}`;
            const cat = catMap[rec.category] || rec.category || '其他收入';
            const validCat = incomeCategories.includes(cat) ? cat : '其他收入';
            const amount = Math.round(parseFloat(rec.amount) || 0);
            if(amount <= 0) return;
            totalAmount += amount;
            records.push({
                id: (Date.now() + idx).toString(),
                type: 'income',
                date: dateStrFormatted,
                amount: amount,
                category: validCat,
                accountId: batchIncomeAccountId,
                isAdvance: false,
                title: (rec.title || '').trim(),
                createdAt: new Date().toISOString()
            });
        });
        account.balance += totalAmount;
        clearJournalDatesCache();
        localStorage.setItem(`${STORAGE_KEY_JOURNAL}_${currentUserId}`, JSON.stringify(records));
        const userDataKey = `${STORAGE_KEY_DATA}_${currentUserId}`;
        localStorage.setItem(userDataKey, JSON.stringify(accounts));
        const currentUserAccounts = JSON.parse(localStorage.getItem(userDataKey) || '[]');
        if (window.syncJournalAndAccountsToFirestore && window.firebaseUserLoggedIn) {
            window.syncJournalAndAccountsToFirestore(records, currentUserAccounts).catch(err => {
                console.error('[記帳同步] 同步失敗:', err);
            });
        }
        renderAssets();
        updateChartData();
        renderCalendar();
        if(selectedDate) {
            showFixedTransferDetailsForDate(selectedDate);
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            selectedDate = today;
            showFixedTransferDetailsForDate(today);
        }
        closeBatchIncomeModal();
        closeIncomeModal();
    }
    
    function openExpenseDateSelector() {
        currentDatePickerType = 'expense';
        openDateSelector('expense');
    }
    
    // 新增收入
    function openNewIncome() {
        // 不再關閉日曆模態框，因為現在直接從右上角+號打開
        editingJournalRecordId = null;
        currentJournalType = 'income';
        // 使用選中的日期，如果沒有選中則使用今天
        if(selectedDate) {
            currentJournalDate = new Date(selectedDate);
            currentJournalDate.setHours(0, 0, 0, 0); // 確保時間部分為 00:00:00
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            currentJournalDate = new Date(today);
            selectedDate = new Date(today);
            renderCalendar();
        }
        currentJournalCategory = null;
        currentJournalAccountId = null;
        openIncomeModal();
    }
    
    function closeIncomeModal() {
        const modal = document.getElementById('incomeModal');
        const modalWrapper = modal.querySelector('.modal-content-wrapper');
        // 立即隱藏所有記帳 modal 的 FAB（固定支出、固定收入、固定轉帳）
        ['expenseModal', 'incomeModal', 'transferModal'].forEach(function(id) {
            var m = document.getElementById(id);
            if(m) {
                var fab = m.querySelector('button[onclick*="openFixedExpenseListFromJournal"], button[onclick*="openFixedIncomeListFromJournal"], button[onclick*="openFixedTransferListFromJournal"]');
                if(fab) fab.style.display = 'none';
            }
        });
        if(modalWrapper) {
            modalWrapper.style.transform = 'translateX(100%)';
            setTimeout(() => {
                modal.style.display = 'none';
                modalWrapper.style.transform = 'translateX(100%)';
            }, 400);
        } else {
            modal.style.display = 'none';
        }
    }
    
    function updateIncomeDateDisplay() {
        const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
        const dateStr = `${currentJournalDate.getFullYear()}年${currentJournalDate.getMonth() + 1}月${currentJournalDate.getDate()}日 ${weekdays[currentJournalDate.getDay()]}`;
        document.getElementById('incomeDate').textContent = dateStr;
        document.getElementById('incomeDateDisplay').textContent = dateStr;
        document.getElementById('incomeDateDisplay').style.color = 'var(--text-primary)';
    }
    
    function openIncomeDateSelector() {
        currentDatePickerType = 'income';
        openDateSelector('income');
    }
    
    // 新增轉帳
    function openNewTransfer() {
        // 不再關閉日曆模態框，因為現在直接從右上角+號打開
        editingJournalRecordId = null;
        currentJournalType = 'transfer';
        // 使用選中的日期，如果沒有選中則使用今天
        if(selectedDate) {
            currentJournalDate = new Date(selectedDate);
            currentJournalDate.setHours(0, 0, 0, 0); // 確保時間部分為 00:00:00
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            currentJournalDate = new Date(today);
            selectedDate = new Date(today);
            renderCalendar();
        }
        currentTransferFromAccountId = null;
        currentTransferToAccountId = null;
        openTransferModal();
    }
    
    // 修改 openTransferModal 以支持編輯模式
    function openTransferModal(record = null, savedFormData = null) {
        const availableAccounts = accounts.filter(acc => acc.type === 'bank' || acc.type === 'debt');
        // 新增轉帳時需至少兩個帳戶；編輯已有記錄時不擋
        if(!record && availableAccounts.length < 2) {
            alert('使用轉帳功能需要至少兩個帳戶，請先至「新增」建立兩個以上的帳戶後再試，謝謝您。');
            return;
        }
        currentJournalType = 'transfer';
        
        if(record) {
            // 編輯模式
            currentJournalDate = new Date(record.date);
            currentTransferFromAccountId = record.fromAccountId || null;
            currentTransferToAccountId = record.toAccountId || null;
        } else if(savedFormData && savedFormData.type === 'transfer') {
            // 恢復保存的表單數據
            currentJournalDate = savedFormData.date ? new Date(savedFormData.date) : (selectedDate ? new Date(selectedDate) : new Date());
            currentJournalDate.setHours(0, 0, 0, 0);
            currentTransferFromAccountId = savedFormData.fromAccountId || null;
            currentTransferToAccountId = savedFormData.toAccountId || null;
            pendingJournalFormData = null; // 清除保存的數據
        } else {
            // 新增模式（日期已在調用時設置）
            // currentJournalDate 已在 openNewTransfer 中設置
        }
        
        const modal = document.getElementById('transferModal');
        const modalWrapper = modal.querySelector('.modal-content-wrapper');
        const title = modal.querySelector('.modal-title');
        
        if(title) {
            title.textContent = record ? '編輯轉帳' : '轉帳';
        }
        
        // 初始化日期顯示
        updateTransferDateDisplay();
        
        // 填充或重置表單
        if(record) {
            document.getElementById('transferAmount').value = record.amount || '';
            const titleInput = document.getElementById('transferTitle');
            if(titleInput) {
                titleInput.value = record.title || '';
            }
            const fromAccount = accounts.find(acc => acc.id === record.fromAccountId);
            document.getElementById('transferFromAccount').textContent = fromAccount ? fromAccount.name : '選擇轉出帳戶';
            document.getElementById('transferFromAccount').style.color = fromAccount ? 'var(--text-primary)' : 'var(--text-secondary)';
            const toAccount = accounts.find(acc => acc.id === record.toAccountId);
            document.getElementById('transferToAccount').textContent = toAccount ? toAccount.name : '選擇轉入帳戶';
            document.getElementById('transferToAccount').style.color = toAccount ? 'var(--text-primary)' : 'var(--text-secondary)';
        } else if(savedFormData && savedFormData.type === 'transfer') {
            // 恢復保存的表單數據
            document.getElementById('transferAmount').value = savedFormData.amount || '';
            if(savedFormData.fromAccountId) {
                const fromAccount = accounts.find(acc => acc.id === savedFormData.fromAccountId);
                if(fromAccount) {
                    document.getElementById('transferFromAccount').textContent = fromAccount.name;
                    document.getElementById('transferFromAccount').style.color = 'var(--text-primary)';
                } else {
                    document.getElementById('transferFromAccount').textContent = '選擇轉出帳戶';
                    document.getElementById('transferFromAccount').style.color = 'var(--text-secondary)';
                }
            } else {
                document.getElementById('transferFromAccount').textContent = '選擇轉出帳戶';
                document.getElementById('transferFromAccount').style.color = 'var(--text-secondary)';
            }
            if(savedFormData.toAccountId) {
                const toAccount = accounts.find(acc => acc.id === savedFormData.toAccountId);
                if(toAccount) {
                    document.getElementById('transferToAccount').textContent = toAccount.name;
                    document.getElementById('transferToAccount').style.color = 'var(--text-primary)';
                } else {
                    document.getElementById('transferToAccount').textContent = '選擇轉入帳戶';
                    document.getElementById('transferToAccount').style.color = 'var(--text-secondary)';
                }
            } else {
                document.getElementById('transferToAccount').textContent = '選擇轉入帳戶';
                document.getElementById('transferToAccount').style.color = 'var(--text-secondary)';
            }
        } else {
            document.getElementById('transferAmount').value = '';
            const titleInput = document.getElementById('transferTitle');
            if(titleInput) {
                titleInput.value = '';
            }
            document.getElementById('transferFromAccount').textContent = '選擇轉出帳戶';
            document.getElementById('transferFromAccount').style.color = 'var(--text-secondary)';
            document.getElementById('transferToAccount').textContent = '選擇轉入帳戶';
            document.getElementById('transferToAccount').style.color = 'var(--text-secondary)';
        }
        
        // 更新分頁樣式
        const tabs = modal.querySelectorAll('.journal-form-tab');
        tabs.forEach(t => {
            t.classList.remove('active');
            t.style.background = 'var(--border-color)';
            t.style.color = 'var(--text-secondary)';
            t.style.border = 'none';
        });
        const transferTab = document.getElementById('journalFormTabTransfer');
        if(transferTab) {
            transferTab.classList.add('active');
            transferTab.style.background = 'var(--card-bg)';
            transferTab.style.color = '#0a84ff';
            transferTab.style.border = '2px solid #0a84ff';
        }
        
        if(modalWrapper) {
            modalWrapper.style.transform = 'translateX(100%)';
            modalWrapper.classList.remove('swiping');
        }
        modal.style.display = 'block';
        modal.style.background = 'transparent';
        // 先不隱藏其他 modal，等本 modal 滑入後再隱藏，避免露出底層日期/日曆頁造成閃爍
        requestAnimationFrame(() => {
            setTimeout(() => {
                if(modalWrapper) modalWrapper.style.transform = 'translateX(0)';
                setTimeout(() => {
                    ['expenseModal', 'incomeModal', 'fixedTransferListModal'].forEach(id => {
                        const other = document.getElementById(id);
                        if(other) other.style.display = 'none';
                    });
                }, 50);
            }, 10);
        });
        const fabButton = modal.querySelector('button[onclick*="openFixedTransferListFromJournal"]');
        if(fabButton) fabButton.style.display = 'flex';
    }
    
    function closeTransferModal() {
        const modal = document.getElementById('transferModal');
        const modalWrapper = modal.querySelector('.modal-content-wrapper');
        // 立即隱藏所有記帳 modal 的 FAB（固定支出、固定收入、固定轉帳）
        ['expenseModal', 'incomeModal', 'transferModal'].forEach(function(id) {
            var m = document.getElementById(id);
            if(m) {
                var fab = m.querySelector('button[onclick*="openFixedExpenseListFromJournal"], button[onclick*="openFixedIncomeListFromJournal"], button[onclick*="openFixedTransferListFromJournal"]');
                if(fab) fab.style.display = 'none';
            }
        });
        if(modalWrapper) {
            modalWrapper.style.transform = 'translateX(100%)';
            setTimeout(() => {
                modal.style.display = 'none';
                modalWrapper.style.transform = 'translateX(100%)';
            }, 400);
        } else {
            modal.style.display = 'none';
        }
    }
    
    function updateTransferDateDisplay() {
        const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
        const dateStr = `${currentJournalDate.getFullYear()}年${currentJournalDate.getMonth() + 1}月${currentJournalDate.getDate()}日 ${weekdays[currentJournalDate.getDay()]}`;
        document.getElementById('transferDate').textContent = dateStr;
        document.getElementById('transferDateDisplay').textContent = dateStr;
        document.getElementById('transferDateDisplay').style.color = 'var(--text-primary)';
    }
    
    function openTransferDateSelector() {
        currentDatePickerType = 'transfer';
        openDateSelector('transfer');
    }
    
    // 從日記本模態框打開固定轉帳列表
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
    
    // 固定支出 / 固定收入（完整項目，同固定轉帳但僅一個帳戶）
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
    
    function loadDividendRecords() {
        const key = `${STORAGE_KEY_DIVIDEND_RECORDS}_${currentUserId}`;
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : {};
        } catch (e) { return {}; }
    }
    function saveDividendRecords(records) {
        const key = `${STORAGE_KEY_DIVIDEND_RECORDS}_${currentUserId}`;
        localStorage.setItem(key, JSON.stringify(records));
    }
    
    const FINMIND_API = 'https://api.finmindtrade.com/api/v4/data';
    const CORS_PROXY_DIV = 'https://api.allorigins.win/raw?url=';
    
    function saveDividendHistoryShares(input) {
        const accId = input.getAttribute('data-acc-id');
        const cashDiv = parseFloat(input.getAttribute('data-cash-div')) || 0;
        const shares = parseInt(input.value, 10) || 0;
        const records = loadDividendRecords();
        if (!records[accId]) records[accId] = { dividendShares: 0, manualAmount: null };
        records[accId].dividendShares = shares;
        saveDividendRecords(records);
        const amtEl = input.closest('div').querySelector('.dividend-amt');
        if (amtEl) amtEl.textContent = Math.round(shares * cashDiv).toLocaleString();
    }
    function saveDividendItemField(input) {
        const accId = input.getAttribute('data-acc-id');
        const field = input.getAttribute('data-field');
        const val = field === 'manualAmount' ? (input.value === '' ? null : parseFloat(input.value) || 0) : (parseFloat(input.value) || 0);
        const records = loadDividendRecords();
        if (!records[accId]) records[accId] = { dividendShares: 0, manualAmount: null };
        records[accId][field] = val;
        saveDividendRecords(records);
    }
    function fillDividendSharesWithCurrent(accId, currentBalance) {
        const records = loadDividendRecords();
        if (!records[accId]) records[accId] = { dividendShares: 0, manualAmount: null };
        records[accId].dividendShares = currentBalance;
        saveDividendRecords(records);
        const input = document.querySelector(`input[data-field="shares"][data-acc-id="${accId}"]`);
        if (input) { input.value = currentBalance; }
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
    
    // 類別選擇器
    function openCategorySelector(type) {
        const modal = document.getElementById('categorySelectorModal');
        const modalWrapper = modal.querySelector('.modal-content-wrapper');
        const title = document.getElementById('categorySelectorTitle');
        const list = document.getElementById('categorySelectorList');
        
        if(title) {
            title.textContent = '選擇類別';
        }
        
        const categories = type === 'income' ? incomeCategories : expenseCategories;
        
        if(list) {
            list.innerHTML = '';
            categories.forEach(category => {
                const categoryItem = document.createElement('div');
                categoryItem.style.cssText = 'cursor: pointer; padding: 15px; border-radius: 12px; background: var(--bg-color); margin-bottom: 10px;';
                categoryItem.onclick = () => selectCategory(category, type);
                categoryItem.innerHTML = `
                    <div style="color: var(--text-primary); font-size: 16px;">${category}</div>
                `;
                list.appendChild(categoryItem);
            });
        }
        
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
    
    function closeCategorySelector() {
        const modal = document.getElementById('categorySelectorModal');
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
    
    function selectCategory(category, type) {
        currentJournalCategory = category;
        if(type === 'income') {
            document.getElementById('incomeCategory').textContent = category;
            document.getElementById('incomeCategory').style.color = 'var(--text-primary)';
        } else if(type === 'expense') {
            document.getElementById('expenseCategory').textContent = category;
            document.getElementById('expenseCategory').style.color = 'var(--text-primary)';
        }
        closeCategorySelector();
    }
    
    // 記帳用的帳戶選擇器
    function openJournalAccountSelector(type) {
        closeCategorySelector();
        currentAccountSelectorType = type;
        const modal = document.getElementById('accountSelectorModal');
        if(!modal) return;
        
        const modalWrapper = modal.querySelector('.modal-content-wrapper');
        const title = document.getElementById('accountSelectorTitle');
        const list = document.getElementById('accountSelectorList');
        
        // 過濾出錢包和負債類型的帳戶
        const availableAccounts = accounts.filter(acc => acc.type === 'bank' || acc.type === 'debt');
        
        // 沒有帳戶時：不顯示選擇器，直接跳轉錢包新增（收入、固定收入、支出、批量支出同此邏輯）
        if(availableAccounts.length === 0) {
            const isExpenseOrIncome = ['income', 'expense', 'batchExpense', 'batchIncome'].indexOf(type) !== -1;
            if(isExpenseOrIncome) alert('目前未有帳戶資訊，將跳轉到新增帳戶');
            pendingJournalModalType = type;
            closeAccountSelector();
            closeIncomeModal();
            closeExpenseModal();
            closeTransferModal();
            closeFixedTransferModal();
            closeFixedExpenseModal();
            closeFixedIncomeModal();
            if(type === 'batchExpense') closeBatchExpenseModal(true);
            if(type === 'batchIncome') closeBatchIncomeModal(true);
            currentAccountSelectorType = null;
            editingId = null;
            editingFromDetail = false;
            openModal();
            const typeSelect = document.getElementById('inpType');
            if(typeSelect) { typeSelect.value = 'bank'; handleTypeChange(); }
            if(document.getElementById('inpBankTag')) document.getElementById('inpBankTag').value = '現金';
            if(document.getElementById('inpType').value === 'bank') handleBankTagChange();
            return;
        }
        
        // 設置標題
        if(title) {
            if(type === 'income' || type === 'expense' || type === 'batchExpense' || type === 'batchIncome') {
                title.textContent = '選擇帳戶';
            } else if(type === 'transferFrom') {
                title.textContent = '選擇轉出帳戶';
            } else if(type === 'transferTo') {
                title.textContent = '選擇轉入帳戶';
            }
        }
        
        // 生成帳戶列表
        if(list) {
            list.innerHTML = '';
            availableAccounts.forEach(acc => {
                    const accountItem = document.createElement('div');
                    accountItem.style.cssText = 'cursor: pointer; padding: 15px; border-radius: 12px; background: var(--bg-color); margin-bottom: 10px;';
                    accountItem.onclick = () => selectJournalAccount(acc, type);
                    
                    const iconClass = acc.type === 'bank' ? 'fa-university' : 'fa-credit-card';
                    const tagHTML = acc.type === 'bank' ? generateAccountTagHTML(acc) : '<span class="account-tag account-tag-debt">負債</span>';
                    
                    accountItem.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="fas ${iconClass}" style="color: var(--text-primary); font-size: 20px;"></i>
                            <div style="flex: 1;">
                                <div style="color: var(--text-primary); font-size: 16px; font-weight: 500;">${acc.name}</div>
                                <div style="margin-top: 4px;">${tagHTML}</div>
                            </div>
                        </div>
                    `;
                    list.appendChild(accountItem);
            });
        }
        
        // 確保模態框初始狀態正確
        if(modalWrapper) {
            modalWrapper.style.transform = 'translateY(100%)';
        }
        modal.style.display = 'block';
        modal.style.background = 'rgba(0,0,0,0.5)';
        
        // 立即顯示模態框
        requestAnimationFrame(() => {
            if(modalWrapper) {
                modalWrapper.style.transform = 'translateY(0)';
            }
        });
    }
    
    function selectJournalAccount(account, type) {
        if(type === 'income') {
            currentJournalAccountId = account.id;
            document.getElementById('incomeAccount').textContent = account.name;
            document.getElementById('incomeAccount').style.color = 'var(--text-primary)';
        } else if(type === 'expense') {
            currentJournalAccountId = account.id;
            document.getElementById('expenseAccount').textContent = account.name;
            document.getElementById('expenseAccount').style.color = 'var(--text-primary)';
        } else if(type === 'batchExpense') {
            batchExpenseAccountId = account.id;
            const label = document.getElementById('batchExpenseAccountLabel');
            if(label) { label.textContent = account.name; label.style.color = 'var(--text-primary)'; }
        } else if(type === 'batchIncome') {
            batchIncomeAccountId = account.id;
            const label = document.getElementById('batchIncomeAccountLabel');
            if(label) { label.textContent = account.name; label.style.color = 'var(--text-primary)'; }
        } else if(type === 'transferFrom') {
            currentTransferFromAccountId = account.id;
            document.getElementById('transferFromAccount').textContent = account.name;
            document.getElementById('transferFromAccount').style.color = 'var(--text-primary)';
        } else if(type === 'transferTo') {
            currentTransferToAccountId = account.id;
            document.getElementById('transferToAccount').textContent = account.name;
            document.getElementById('transferToAccount').style.color = 'var(--text-primary)';
        }
        closeAccountSelector();
    }
    
    // 保存收入
    function saveIncome() {
        const amount = parseFloat(document.getElementById('incomeAmount').value);
        
        if(!amount || amount <= 0) {
            alert('請輸入有效的金額');
            return;
        }
        
        if(!currentJournalCategory) {
            alert('請選擇類別');
            return;
        }
        
        if(!currentJournalAccountId) {
            alert('請選擇帳戶');
            return;
        }
        
        const account = accounts.find(acc => acc.id === currentJournalAccountId);
        if(!account) {
            alert('找不到帳戶');
            return;
        }
        
        // 使用本地時間格式化日期，避免時區問題
        const year = currentJournalDate.getFullYear();
        const month = String(currentJournalDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentJournalDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const records = loadJournalRecords();
        
        if(editingJournalRecordId) {
            // 編輯模式：更新現有記錄
            const oldRecord = records.find(r => r.id === editingJournalRecordId);
            if(oldRecord) {
                // 還原舊記錄對帳戶餘額的影響
                const oldAccount = accounts.find(acc => acc.id === oldRecord.accountId);
                if(oldAccount) {
                    oldAccount.balance -= oldRecord.amount;
                }
                
                // 更新記錄
                oldRecord.date = dateStr;
                oldRecord.amount = amount;
                oldRecord.category = currentJournalCategory;
                oldRecord.accountId = currentJournalAccountId;
                const titleInput = document.getElementById('incomeTitle');
                oldRecord.title = titleInput ? titleInput.value.trim() : '';
                const isAdvanceCheckbox = document.getElementById('incomeIsAdvance');
                oldRecord.isAdvance = isAdvanceCheckbox ? isAdvanceCheckbox.checked : false;
                oldRecord.updatedAt = new Date().toISOString();
            }
        } else {
            // 新增模式：創建新記錄
            const titleInput = document.getElementById('incomeTitle');
            const isAdvanceCheckbox = document.getElementById('incomeIsAdvance');
            const newRecord = {
                id: Date.now().toString(),
                type: 'income',
                date: dateStr,
                amount: amount,
                category: currentJournalCategory,
                accountId: currentJournalAccountId,
                title: titleInput ? titleInput.value.trim() : '',
                isAdvance: isAdvanceCheckbox ? isAdvanceCheckbox.checked : false,
                createdAt: new Date().toISOString()
            };
            records.push(newRecord);
        }
        
        // 應用新記錄對帳戶餘額的影響
        account.balance += amount;
        
        // 先保存到 localStorage
        clearJournalDatesCache();
        localStorage.setItem(`${STORAGE_KEY_JOURNAL}_${currentUserId}`, JSON.stringify(records));
        const userDataKey = `${STORAGE_KEY_DATA}_${currentUserId}`;
        localStorage.setItem(userDataKey, JSON.stringify(accounts));
        
        // 【關鍵修正】從 localStorage 重新讀取當前使用者的 accounts，確保資料正確
        const currentUserAccounts = JSON.parse(localStorage.getItem(userDataKey) || '[]');
        
        // 一起同步 journal 和 accounts 到 Firestore（只更新 currentUserId）
        if (window.syncJournalAndAccountsToFirestore && window.firebaseUserLoggedIn) {
            window.syncJournalAndAccountsToFirestore(records, currentUserAccounts).catch(err => {
                console.error('[記帳同步] 同步失敗:', err);
            });
        }
        
        // 重置編輯ID
        editingJournalRecordId = null;
        
        // 重新渲染
        renderAssets();
        updateChartData();
        renderCalendar(); // 更新日期底下的顏色標記
        if(selectedDate) {
            const selectedDateStr = formatLocalDate(selectedDate);
            if(selectedDateStr === dateStr) {
                showFixedTransferDetailsForDate(selectedDate);
            }
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            selectedDate = today;
            showFixedTransferDetailsForDate(today);
        }
        
        closeIncomeModal();
    }
    
    // 保存支出
    function saveExpense() {
        const amount = parseFloat(document.getElementById('expenseAmount').value);
        
        if(!amount || amount <= 0) {
            alert('請輸入有效的金額');
            return;
        }
        
        if(!currentJournalCategory) {
            alert('請選擇類別');
            return;
        }
        
        if(!currentJournalAccountId) {
            alert('請選擇帳戶');
            return;
        }
        
        const account = accounts.find(acc => acc.id === currentJournalAccountId);
        if(!account) {
            alert('找不到帳戶');
            return;
        }
        
        // 使用本地時間格式化日期，避免時區問題
        const year = currentJournalDate.getFullYear();
        const month = String(currentJournalDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentJournalDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const records = loadJournalRecords();
        
        if(editingJournalRecordId) {
            // 編輯模式：更新現有記錄
            const oldRecord = records.find(r => r.id === editingJournalRecordId);
            if(oldRecord) {
                // 還原舊記錄對帳戶餘額的影響
                const oldAccount = accounts.find(acc => acc.id === oldRecord.accountId);
                if(oldAccount) {
                    // 正常恢復舊記錄的金額
                    oldAccount.balance += oldRecord.amount;
                }
                
                // 更新記錄
                oldRecord.date = dateStr;
                oldRecord.amount = amount;
                oldRecord.category = currentJournalCategory;
                oldRecord.accountId = currentJournalAccountId;
                const isAdvanceCheckbox = document.getElementById('expenseIsAdvance');
                oldRecord.isAdvance = isAdvanceCheckbox ? isAdvanceCheckbox.checked : false;
                const titleInput = document.getElementById('expenseTitle');
                oldRecord.title = titleInput ? titleInput.value.trim() : '';
                oldRecord.updatedAt = new Date().toISOString();
            }
        } else {
            // 新增模式：創建新記錄（新增的記錄可以正常修改和刪除，因為創建時間在固定轉帳之後）
            const isAdvanceCheckbox = document.getElementById('expenseIsAdvance');
            const titleInput = document.getElementById('expenseTitle');
            const newRecord = {
                id: Date.now().toString(),
                type: 'expense',
                date: dateStr,
                amount: amount,
                category: currentJournalCategory,
                accountId: currentJournalAccountId,
                isAdvance: isAdvanceCheckbox ? isAdvanceCheckbox.checked : false,
                title: titleInput ? titleInput.value.trim() : '',
                createdAt: new Date().toISOString()
            };
            records.push(newRecord);
        }
        
        // 應用新記錄對帳戶餘額的影響
        // 正常更新餘額
        account.balance -= amount;
        
        // 先保存到 localStorage
        clearJournalDatesCache();
        localStorage.setItem(`${STORAGE_KEY_JOURNAL}_${currentUserId}`, JSON.stringify(records));
        const userDataKey = `${STORAGE_KEY_DATA}_${currentUserId}`;
        localStorage.setItem(userDataKey, JSON.stringify(accounts));
        
        // 【關鍵修正】從 localStorage 重新讀取當前使用者的 accounts，確保資料正確
        const currentUserAccounts = JSON.parse(localStorage.getItem(userDataKey) || '[]');
        
        // 一起同步 journal 和 accounts 到 Firestore（只更新 currentUserId）
        if (window.syncJournalAndAccountsToFirestore && window.firebaseUserLoggedIn) {
            window.syncJournalAndAccountsToFirestore(records, currentUserAccounts).catch(err => {
                console.error('[記帳同步] 同步失敗:', err);
            });
        }
        
        // 重置編輯ID
        editingJournalRecordId = null;
        
        // 重新渲染
        renderAssets();
        updateChartData();
        renderCalendar(); // 更新日期底下的顏色標記
        if(selectedDate) {
            const selectedDateStr = formatLocalDate(selectedDate);
            if(selectedDateStr === dateStr) {
                showFixedTransferDetailsForDate(selectedDate);
            }
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            selectedDate = today;
            showFixedTransferDetailsForDate(today);
        }
        
        closeExpenseModal();
    }
    
    // 保存轉帳
    function saveTransfer() {
        const amount = parseFloat(document.getElementById('transferAmount').value);
        
        if(!amount || amount <= 0) {
            alert('請輸入有效的金額');
            return;
        }
        
        if(!currentTransferFromAccountId) {
            alert('請選擇轉出帳戶');
            return;
        }
        
        if(!currentTransferToAccountId) {
            alert('請選擇轉入帳戶');
            return;
        }
        
        if(currentTransferFromAccountId === currentTransferToAccountId) {
            alert('轉出帳戶和轉入帳戶不能相同');
            return;
        }
        
        const fromAccount = accounts.find(acc => acc.id === currentTransferFromAccountId);
        const toAccount = accounts.find(acc => acc.id === currentTransferToAccountId);
        
        if(!fromAccount || !toAccount) {
            alert('找不到帳戶');
            return;
        }
        
        // 使用本地時間格式化日期，避免時區問題
        const year = currentJournalDate.getFullYear();
        const month = String(currentJournalDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentJournalDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const records = loadJournalRecords();
        
        if(editingJournalRecordId) {
            // 編輯模式：更新現有記錄
            const oldRecord = records.find(r => r.id === editingJournalRecordId);
            if(oldRecord) {
                // 還原舊記錄對帳戶餘額的影響
                const oldFromAccount = accounts.find(acc => acc.id === oldRecord.fromAccountId);
                const oldToAccount = accounts.find(acc => acc.id === oldRecord.toAccountId);
                if(oldFromAccount && oldToAccount) {
                    oldFromAccount.balance += oldRecord.amount;
                    oldToAccount.balance -= oldRecord.amount;
                }
                
                // 更新記錄
                oldRecord.date = dateStr;
                oldRecord.amount = amount;
                oldRecord.fromAccountId = currentTransferFromAccountId;
                oldRecord.toAccountId = currentTransferToAccountId;
                const titleInput = document.getElementById('transferTitle');
                oldRecord.title = titleInput ? titleInput.value.trim() : '';
                oldRecord.updatedAt = new Date().toISOString();
            }
        } else {
            // 新增模式：創建新記錄
            const titleInput = document.getElementById('transferTitle');
            const newRecord = {
                id: Date.now().toString(),
                type: 'transfer',
                date: dateStr,
                amount: amount,
                fromAccountId: currentTransferFromAccountId,
                toAccountId: currentTransferToAccountId,
                title: titleInput ? titleInput.value.trim() : '',
                createdAt: new Date().toISOString()
            };
            records.push(newRecord);
        }
        
        // 應用新記錄對帳戶餘額的影響
        fromAccount.balance -= amount;
        toAccount.balance += amount;
        
        // 先保存到 localStorage
        clearJournalDatesCache();
        localStorage.setItem(`${STORAGE_KEY_JOURNAL}_${currentUserId}`, JSON.stringify(records));
        const userDataKey = `${STORAGE_KEY_DATA}_${currentUserId}`;
        localStorage.setItem(userDataKey, JSON.stringify(accounts));
        
        // 【關鍵修正】從 localStorage 重新讀取當前使用者的 accounts，確保資料正確
        const currentUserAccounts = JSON.parse(localStorage.getItem(userDataKey) || '[]');
        
        // 一起同步 journal 和 accounts 到 Firestore（只更新 currentUserId）
        if (window.syncJournalAndAccountsToFirestore && window.firebaseUserLoggedIn) {
            window.syncJournalAndAccountsToFirestore(records, currentUserAccounts).catch(err => {
                console.error('[記帳同步] 同步失敗:', err);
            });
        }
        
        // 重置編輯ID
        editingJournalRecordId = null;
        
        // 重新渲染
        renderAssets();
        updateChartData();
        renderCalendar(); // 更新日期底下的顏色標記
        if(selectedDate) {
            const selectedDateStr = formatLocalDate(selectedDate);
            if(selectedDateStr === dateStr) {
                showFixedTransferDetailsForDate(selectedDate);
            }
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            selectedDate = today;
            showFixedTransferDetailsForDate(today);
        }
        
        closeTransferModal();
    }
    
    // Calendar Settings Functions (保留用於固定轉帳)
    // 計算固定轉帳的顯示金額（現在只使用固定金額，不再自動計算）
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
    
    let currentAccountSelectorType = null; // 'from' 或 'to'
    let pendingJournalModalType = null; // 記錄從哪個記帳頁面打開的帳戶選擇器：'income', 'expense', 'transferFrom', 'transferTo', 'from', 'to'
    
    function openAccountSelector(type) {
        currentAccountSelectorType = type;
        const modal = document.getElementById('accountSelectorModal');
        const modalWrapper = modal.querySelector('.modal-content-wrapper');
        const title = document.getElementById('accountSelectorTitle');
        const list = document.getElementById('accountSelectorList');
        
        // 過濾出錢包和負債類型的帳戶
        const availableAccounts = accounts.filter(acc => acc.type === 'bank' || acc.type === 'debt');
        
        // 沒有帳戶時：不顯示選擇器，直接跳轉到錢包新增畫面（收入、固定收入、支出、固定支出同此邏輯）
        if(availableAccounts.length === 0) {
            const isExpenseOrIncome = ['fixedExpenseAccount', 'fixedIncomeAccount'].indexOf(type) !== -1;
            if(isExpenseOrIncome) alert('目前未有帳戶資訊，將跳轉到新增帳戶');
            pendingJournalModalType = type;
            closeIncomeModal();
            closeExpenseModal();
            closeTransferModal();
            closeFixedTransferModal();
            closeFixedExpenseModal();
            closeFixedIncomeModal();
            closeAccountSelector();
            currentAccountSelectorType = null;
            editingId = null;
            editingFromDetail = false;
            // 僅批量支出：先隱藏 AI 辨識結果（保留紀錄），新增帳戶結束後會自動帶回並選中新帳戶
            if(type === 'batchExpense') closeBatchExpenseModal(true);
            if(type === 'batchIncome') closeBatchIncomeModal(true);
            openModal();
            // 強制為錢包類型（避免被 openModal 依 currentPage 覆寫）
            const typeSelect = document.getElementById('inpType');
            if(typeSelect) { typeSelect.value = 'bank'; handleTypeChange(); }
            if(document.getElementById('inpBankTag')) document.getElementById('inpBankTag').value = '現金';
            if(document.getElementById('inpType').value === 'bank') handleBankTagChange();
            return;
        }
        
        // 確保模態框顯示在最上層
        modal.style.zIndex = '2020';
        
        // 設置標題
        if(title) {
            if(type === 'fixedExpenseAccount') title.textContent = '選擇帳戶';
            else if(type === 'fixedIncomeAccount') title.textContent = '選擇帳戶';
            else title.textContent = type === 'from' ? '選擇從帳戶' : '選擇到帳戶';
        }
        
        // 生成帳戶列表（固定支出/收入用同一個列表）
        if(list) {
            list.innerHTML = '';
            availableAccounts.forEach(acc => {
                    const accountItem = document.createElement('div');
                    accountItem.style.cssText = 'cursor: pointer; padding: 15px; border-radius: 12px; background: var(--bg-color); margin-bottom: 10px;';
                    accountItem.onclick = () => selectAccountForTransfer(acc);
                    
                    const iconClass = acc.type === 'bank' ? 'fa-university' : 'fa-credit-card';
                    const tagHTML = acc.type === 'bank' ? generateAccountTagHTML(acc) : '<span class="account-tag account-tag-debt">負債</span>';
                    
                    accountItem.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="fas ${iconClass}" style="color: var(--text-primary); font-size: 20px;"></i>
                            <div style="flex: 1;">
                                <div style="color: var(--text-primary); font-size: 16px; font-weight: 500;">${acc.name}</div>
                                <div style="margin-top: 4px;">${tagHTML}</div>
                            </div>
                        </div>
                    `;
                    list.appendChild(accountItem);
                });
        }
        
        // 打開模態框 - 立即顯示
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
    
    function closeAccountSelector() {
        const modal = document.getElementById('accountSelectorModal');
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
        currentAccountSelectorType = null;
    }
    
    function selectAccountForTransfer(account) {
        if(!currentAccountSelectorType) return;
        
        if(currentAccountSelectorType === 'fixedExpenseAccount') {
            const el = document.getElementById('fixedExpenseAccount');
            if(el) { el.textContent = account.name; el.style.color = 'var(--text-primary)'; }
            window.fixedExpenseAccountId = account.id;
            closeAccountSelector();
            return;
        }
        if(currentAccountSelectorType === 'fixedIncomeAccount') {
            const el = document.getElementById('fixedIncomeAccount');
            if(el) { el.textContent = account.name; el.style.color = 'var(--text-primary)'; }
            window.fixedIncomeAccountId = account.id;
            closeAccountSelector();
            return;
        }
        
        const accountName = account.name;
        const accountElement = currentAccountSelectorType === 'from' 
            ? document.getElementById('fixedTransferFromAccount')
            : document.getElementById('fixedTransferToAccount');
        
        if(accountElement) {
            accountElement.textContent = accountName;
            accountElement.style.color = 'var(--text-primary)';
        }
        
        if(currentAccountSelectorType === 'from') {
            window.fixedTransferFromAccountId = account.id;
        } else {
            window.fixedTransferToAccountId = account.id;
        }
        
        closeAccountSelector();
    }
    
    // Fixed Transfer Data
    let fixedTransferData = {
        repeat: 'monthly', // 'daily', 'weekly', 'monthly', 'yearly'
        byPeriod: false,
        startDate: null,
        endDate: null,
        holidayAdjust: 'none', // 'none', 'advance', 'delay'
        tagColor: null, // 標籤顏色
        useAccountBalance: false, // 是否使用帳戶全部金額
        useFromAccount: true // true: 使用匯出方（從帳戶），false: 使用匯入方（到帳戶）
    };
    
    let currentFixedFormContext = 'transfer'; // 'transfer' | 'expense' | 'income'
    let fixedExpenseData = { repeat: 'monthly', byPeriod: false, startDate: null, endDate: null, holidayAdjust: 'none', tagColor: null, useAccountBalance: false };
    let fixedIncomeData = { repeat: 'monthly', byPeriod: false, startDate: null, endDate: null, holidayAdjust: 'none', tagColor: null, useAccountBalance: false };
    
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
    
    let currentDatePickerType = null; // 'start' 或 'end'
    let tempSelectedDate = null;
    
    function openDateSelector(type) {
        currentDatePickerType = type;
        const modal = document.getElementById('datePickerModal');
        const modalWrapper = modal.querySelector('.modal-content-wrapper');
        const title = document.getElementById('datePickerTitle');
        
        if(title) {
            if(type === 'start') {
                title.textContent = '選擇開始日期';
            } else if(type === 'end') {
                title.textContent = '選擇結束日期';
            } else if(type === 'income' || type === 'expense' || type === 'transfer') {
                title.textContent = '選擇日期';
            }
        }
        
        // 初始化日期（如果已有選擇則使用，否則使用今天）
        let initialDate = null;
        if(type === 'start' || type === 'end') {
            if(currentFixedFormContext === 'expense') {
                if(type === 'start' && fixedExpenseData.startDate) initialDate = new Date(fixedExpenseData.startDate);
                else if(type === 'end' && fixedExpenseData.endDate) initialDate = new Date(fixedExpenseData.endDate);
                else initialDate = new Date();
            } else if(currentFixedFormContext === 'income') {
                if(type === 'start' && fixedIncomeData.startDate) initialDate = new Date(fixedIncomeData.startDate);
                else if(type === 'end' && fixedIncomeData.endDate) initialDate = new Date(fixedIncomeData.endDate);
                else initialDate = new Date();
            } else if(type === 'start' && fixedTransferData.startDate) {
                initialDate = new Date(fixedTransferData.startDate);
            } else if(type === 'end' && fixedTransferData.endDate) {
                initialDate = new Date(fixedTransferData.endDate);
            } else {
                initialDate = new Date();
            }
        } else if((type === 'income' || type === 'expense' || type === 'transfer') && currentJournalDate) {
            initialDate = new Date(currentJournalDate);
        } else {
            initialDate = new Date();
        }
        tempSelectedDate = new Date(initialDate);
        
        // 生成年份、月份、日期選項
        renderDatePicker(initialDate);
        
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
                // 滾動到選中的日期
                scrollToSelectedDate(initialDate);
                // 添加滾動監聽器
                addDatePickerScrollListeners();
            });
        }
    }
    
    function addDatePickerScrollListeners() {
        const yearPicker = document.getElementById('yearPicker');
        const monthPicker = document.getElementById('monthPicker');
        const dayPicker = document.getElementById('dayPicker');
        
        if(yearPicker) {
            yearPicker.addEventListener('scroll', () => {
                updateDatePickerHighlight(yearPicker, 'year');
            });
        }
        
        if(monthPicker) {
            monthPicker.addEventListener('scroll', () => {
                updateDatePickerHighlight(monthPicker, 'month');
            });
        }
        
        if(dayPicker) {
            dayPicker.addEventListener('scroll', () => {
                updateDatePickerHighlight(dayPicker, 'day');
            });
        }
    }
    
    function updateDatePickerHighlight(picker, type) {
        const items = picker.querySelectorAll('div');
        const pickerRect = picker.getBoundingClientRect();
        const centerY = pickerRect.top + pickerRect.height / 2;
        
        items.forEach((item) => {
            const itemRect = item.getBoundingClientRect();
            const itemCenterY = itemRect.top + itemRect.height / 2;
            const distance = Math.abs(itemCenterY - centerY);
            
            if(distance < 25) {
                // 在中心區域
                item.style.color = '#0a84ff';
                item.style.fontWeight = '600';
                item.style.fontSize = '20px';
                
                // 更新臨時選擇的日期
                if(type === 'year') {
                    const year = parseInt(item.textContent);
                    tempSelectedDate.setFullYear(year);
                    updateDayPicker();
                } else if(type === 'month') {
                    const month = parseInt(item.textContent);
                    tempSelectedDate.setMonth(month - 1);
                    updateDayPicker();
                } else if(type === 'day') {
                    const day = parseInt(item.textContent);
                    tempSelectedDate.setDate(day);
                }
            } else {
                item.style.color = 'var(--text-secondary)';
                item.style.fontWeight = 'normal';
                item.style.fontSize = '18px';
            }
        });
    }
    
    function renderDatePicker(selectedDate) {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth() + 1;
        const day = selectedDate.getDate();
        
        // 生成年份（當前年份前後各10年）
        const yearPicker = document.getElementById('yearPicker');
        const monthPicker = document.getElementById('monthPicker');
        const dayPicker = document.getElementById('dayPicker');
        
        if(yearPicker) {
            yearPicker.innerHTML = '';
            for(let y = year - 10; y <= year + 10; y++) {
                const yearItem = document.createElement('div');
                yearItem.style.cssText = 'padding: 15px; text-align: center; font-size: 18px; color: var(--text-primary); scroll-snap-align: center;';
                yearItem.textContent = y + '年';
                yearItem.onclick = () => {
                    tempSelectedDate.setFullYear(y);
                    updateDayPicker();
                    scrollToSelectedDate(tempSelectedDate);
                };
                if(y === year) {
                    yearItem.style.color = '#0a84ff';
                    yearItem.style.fontWeight = '600';
                }
                yearPicker.appendChild(yearItem);
            }
        }
        
        if(monthPicker) {
            monthPicker.innerHTML = '';
            for(let m = 1; m <= 12; m++) {
                const monthItem = document.createElement('div');
                monthItem.style.cssText = 'padding: 15px; text-align: center; font-size: 18px; color: var(--text-secondary); scroll-snap-align: center; height: 40px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;';
                monthItem.textContent = m + '月';
                monthItem.onclick = () => {
                    tempSelectedDate.setMonth(m - 1);
                    updateDayPicker();
                    highlightSelectedItems();
                    scrollToSelectedDate(tempSelectedDate);
                };
                if(m === month) {
                    monthItem.style.color = '#0a84ff';
                    monthItem.style.fontWeight = '600';
                    monthItem.style.fontSize = '20px';
                }
                monthPicker.appendChild(monthItem);
            }
        }
        
        updateDayPicker();
    }
    
    function updateDayPicker() {
        const dayPicker = document.getElementById('dayPicker');
        if(!dayPicker) return;
        
        const year = tempSelectedDate.getFullYear();
        const month = tempSelectedDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const currentDay = tempSelectedDate.getDate();
        
        dayPicker.innerHTML = '';
        for(let d = 1; d <= daysInMonth; d++) {
            const dayItem = document.createElement('div');
            dayItem.style.cssText = 'padding: 15px; text-align: center; font-size: 18px; color: var(--text-secondary); scroll-snap-align: center; height: 40px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;';
            dayItem.textContent = d + '日';
            dayItem.onclick = () => {
                tempSelectedDate.setDate(d);
                highlightSelectedItems();
                scrollToSelectedDate(tempSelectedDate);
            };
            if(d === currentDay) {
                dayItem.style.color = '#0a84ff';
                dayItem.style.fontWeight = '600';
                dayItem.style.fontSize = '20px';
            }
            dayPicker.appendChild(dayItem);
        }
    }
    
    function scrollToSelectedDate(date) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        const yearPicker = document.getElementById('yearPicker');
        const monthPicker = document.getElementById('monthPicker');
        const dayPicker = document.getElementById('dayPicker');
        
        if(yearPicker) {
            const yearItems = yearPicker.querySelectorAll('div');
            yearItems.forEach((item, index) => {
                if(item.textContent.includes(year + '年')) {
                    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        }
        
        if(monthPicker) {
            const monthItems = monthPicker.querySelectorAll('div');
            monthItems.forEach((item, index) => {
                if(item.textContent.includes(month + '月')) {
                    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        }
        
        if(dayPicker) {
            const dayItems = dayPicker.querySelectorAll('div');
            dayItems.forEach((item, index) => {
                if(item.textContent.includes(day + '日')) {
                    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        }
    }
    
    /** @param {boolean} immediate - 若為 true 則立即隱藏（用於切換分頁時避免日期頁閃爍） */
    function closeDatePicker(immediate) {
        const modal = document.getElementById('datePickerModal');
        const modalWrapper = modal.querySelector('.modal-content-wrapper');
        if(immediate) {
            if(modal) modal.style.display = 'none';
            if(modalWrapper) modalWrapper.style.transform = 'translateY(100%)';
        } else if(modalWrapper) {
            modalWrapper.style.transform = 'translateY(100%)';
            setTimeout(() => {
                modal.style.display = 'none';
                modalWrapper.style.transform = 'translateY(100%)';
            }, 300);
        } else {
            if(modal) modal.style.display = 'none';
        }
        currentDatePickerType = null;
    }
    
    function confirmDatePicker() {
        if(!currentDatePickerType || !tempSelectedDate) return;
        
        const date = new Date(tempSelectedDate);
        const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
        const weekday = weekdays[date.getDay()];
        const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekday}`;
        
        if(currentDatePickerType === 'start') {
            if(currentFixedFormContext === 'expense') {
                fixedExpenseData.startDate = date;
                const el = document.getElementById('fixedExpenseStartDate');
                if(el) { el.textContent = dateStr; el.style.color = 'var(--text-primary)'; }
                updateNextDatesForFixed();
            } else if(currentFixedFormContext === 'income') {
                fixedIncomeData.startDate = date;
                const el = document.getElementById('fixedIncomeStartDate');
                if(el) { el.textContent = dateStr; el.style.color = 'var(--text-primary)'; }
                updateNextDatesForFixed();
            } else {
                fixedTransferData.startDate = date;
                const startDateElement = document.getElementById('fixedTransferStartDate');
                if(startDateElement) { startDateElement.textContent = dateStr; startDateElement.style.color = 'var(--text-primary)'; }
            }
        } else if(currentDatePickerType === 'end') {
            if(currentFixedFormContext === 'expense') {
                fixedExpenseData.endDate = date;
                const el = document.getElementById('fixedExpenseEndDate');
                if(el) { el.textContent = dateStr; el.style.color = 'var(--text-primary)'; }
                updateNextDatesForFixed();
            } else if(currentFixedFormContext === 'income') {
                fixedIncomeData.endDate = date;
                const el = document.getElementById('fixedIncomeEndDate');
                if(el) { el.textContent = dateStr; el.style.color = 'var(--text-primary)'; }
                updateNextDatesForFixed();
            } else {
                fixedTransferData.endDate = date;
                const endDateElement = document.getElementById('fixedTransferEndDate');
                if(endDateElement) { endDateElement.textContent = dateStr; endDateElement.style.color = 'var(--text-primary)'; }
            }
        } else if(currentDatePickerType === 'income') {
            currentJournalDate = date;
            updateIncomeDateDisplay();
        } else if(currentDatePickerType === 'expense') {
            currentJournalDate = date;
            updateExpenseDateDisplay();
        } else if(currentDatePickerType === 'transfer') {
            currentJournalDate = date;
            updateTransferDateDisplay();
        }
        
        closeDatePicker();
        if(currentDatePickerType === 'start' || currentDatePickerType === 'end') {
            if(currentFixedFormContext === 'expense' || currentFixedFormContext === 'income') {
                updateNextDatesForFixed();
            } else {
                updatePeriodCount();
                updateNextDates();
            }
        }
    }
    
    function openHolidayAdjustSelector() {
        const modal = document.getElementById('holidayAdjustSelectorModal');
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
    
    function closeHolidayAdjustSelector() {
        const modal = document.getElementById('holidayAdjustSelectorModal');
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
    
    function selectHolidayAdjust(adjust) {
        const adjustNames = { 'none': '不調整', 'advance': '提前', 'delay': '延後' };
        if(currentFixedFormContext === 'expense') {
            fixedExpenseData.holidayAdjust = adjust;
            const el = document.getElementById('fixedExpenseHolidayAdjust');
            if(el) el.textContent = adjustNames[adjust];
            closeHolidayAdjustSelector();
            updateNextDatesForFixed();
            return;
        }
        if(currentFixedFormContext === 'income') {
            fixedIncomeData.holidayAdjust = adjust;
            const el = document.getElementById('fixedIncomeHolidayAdjust');
            if(el) el.textContent = adjustNames[adjust];
            closeHolidayAdjustSelector();
            updateNextDatesForFixed();
            return;
        }
        fixedTransferData.holidayAdjust = adjust;
        const adjustElement = document.getElementById('fixedTransferHolidayAdjust');
        if(adjustElement) adjustElement.textContent = adjustNames[adjust];
        closeHolidayAdjustSelector();
    }
    
    function openTagColorSelector() {
        const modal = document.getElementById('tagColorSelectorModal');
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
    
    function closeTagColorSelector() {
        const modal = document.getElementById('tagColorSelectorModal');
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
    
    function selectTagColor(color) {
        if(currentFixedFormContext === 'expense') {
            fixedExpenseData.tagColor = color;
            const tagColorElement = document.getElementById('fixedExpenseTagColor');
            const tagIconElement = document.getElementById('fixedExpenseTagIcon');
            if(tagColorElement) { tagColorElement.textContent = '已選擇'; tagColorElement.style.color = color; }
            if(tagIconElement) tagIconElement.style.color = color;
            closeTagColorSelector();
            return;
        }
        if(currentFixedFormContext === 'income') {
            fixedIncomeData.tagColor = color;
            const tagColorElement = document.getElementById('fixedIncomeTagColor');
            const tagIconElement = document.getElementById('fixedIncomeTagIcon');
            if(tagColorElement) { tagColorElement.textContent = '已選擇'; tagColorElement.style.color = color; }
            if(tagIconElement) tagIconElement.style.color = color;
            closeTagColorSelector();
            return;
        }
        fixedTransferData.tagColor = color;
        const tagColorElement = document.getElementById('fixedTransferTagColor');
        const tagIconElement = document.getElementById('fixedTransferTagIcon');
        if(tagColorElement) { tagColorElement.textContent = '已選擇'; tagColorElement.style.color = color; }
        if(tagIconElement) tagIconElement.style.color = color;
        closeTagColorSelector();
    }
    
    // 檢查並執行固定轉帳
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
    
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            // 金額輸入欄位現在使用按鈕打開計算機
        }, 100);
    });

