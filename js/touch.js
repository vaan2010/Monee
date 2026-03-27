// ====== touch.js ======
// Touch gesture functions extracted from index.html

// ── Global touch state variables (page swipe) ──────────────────────────────
let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
let touchEndY = 0;

// ── Detail View Swipe Gesture ───────────────────────────────────────────────
let detailTouchStartX = 0;
let detailTouchEndX = 0;
let detailTouchStartY = 0;
let detailTouchEndY = 0;

let isDetailSwiping = false;
let detailStartTransform = 0;

function initDetailViewSwipe() {
    const detailView = document.getElementById('detailView');
    if(!detailView) return;

    // 移除舊的事件監聽器（如果有的話）
    detailView.removeEventListener('touchstart', handleDetailTouchStart);
    detailView.removeEventListener('touchmove', handleDetailTouchMove);
    detailView.removeEventListener('touchend', handleDetailTouchEnd);

    // 添加新的事件監聽器
    detailView.addEventListener('touchstart', handleDetailTouchStart, { passive: true });
    detailView.addEventListener('touchmove', handleDetailTouchMove, { passive: true });
    detailView.addEventListener('touchend', handleDetailTouchEnd, { passive: true });
}

function handleDetailTouchStart(e) {
    detailTouchStartX = e.touches[0].clientX;
    detailTouchStartY = e.touches[0].clientY;
    isDetailSwiping = false;
    detailStartTransform = 0; // 詳情頁面從 0 開始（已顯示）
}

function handleDetailTouchMove(e) {
    if(!detailTouchStartX || !detailTouchStartY) return;

    const detailView = document.getElementById('detailView');
    if(!detailView || !detailView.classList.contains('active')) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = detailTouchStartX - currentX;
    const diffY = detailTouchStartY - currentY;
    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffY);

    // 如果垂直滑動距離大於水平滑動距離，不處理
    if(absDiffY > absDiffX) return;

    // 如果水平滑動距離足夠大，標記為滑動中
    if(absDiffX > 10) {
        isDetailSwiping = true;
        detailView.classList.add('swiping');

        // 計算滑動百分比
        // diffX = touchStartX - currentX
        // 向右滑動（關閉）：diffX < 0，transform 應該變正（向右移動）
        // 向左滑動（不允許）：diffX > 0，應該回彈
        const swipePercent = -(diffX / detailView.offsetWidth) * 100;

        // 限制範圍：0 到 100%（0 是完全顯示，100% 是完全隱藏）
        // 只允許向右滑動（關閉），向左滑動時回彈
        let newTransform = 0;
        if(swipePercent > 0) {
            // 向右滑動，允許顯示動畫
            newTransform = Math.min(100, swipePercent);
        } else {
            // 向左滑動，添加阻力效果
            newTransform = swipePercent * 0.3;
        }

        detailView.style.transform = `translateX(${newTransform}%)`;
    }
}

function handleDetailTouchEnd(e) {
    detailTouchEndX = e.changedTouches[0].clientX;
    detailTouchEndY = e.changedTouches[0].clientY;

    const detailView = document.getElementById('detailView');
    if(detailView && isDetailSwiping) {
        detailView.classList.remove('swiping');
    }

    if(isDetailSwiping) {
        handleDetailSwipe();
    } else {
        handleDetailSwipe();
    }

    isDetailSwiping = false;
}

function handleDetailSwipe() {
    const swipeThreshold = 50;
    const diffX = detailTouchStartX - detailTouchEndX;
    const diffY = detailTouchStartY - detailTouchEndY;

    // 計算水平和垂直滑動的絕對值
    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffY);

    // 如果垂直滑動距離大於水平滑動距離，則不觸發（避免與滾動衝突）
    if(absDiffY > absDiffX) {
        return;
    }

    // 向右滑動（touchEndX > touchStartX，即 diffX < 0）
    if(diffX < -swipeThreshold && absDiffX > swipeThreshold) {
        closeDetailView();
    } else if(isDetailSwiping) {
        // 如果滑動距離不夠，回彈到原位置
        const detailView = document.getElementById('detailView');
        if(detailView) {
            detailView.style.transform = 'translateX(0)';
        }
    }
}

// ── Edit Modal Swipe Gesture ────────────────────────────────────────────────
let editModalTouchStartX = 0;
let editModalTouchEndX = 0;
let editModalTouchStartY = 0;
let editModalTouchEndY = 0;

let isEditModalSwiping = false;
let editModalStartTransform = 0;

function initEditModalSwipe() {
    const accountModal = document.getElementById('accountModal');
    if(!accountModal) return;
    const modalWrapper = accountModal.querySelector('.modal-content-wrapper');
    if(!modalWrapper) return;

    // 移除舊的事件監聽器（如果有的話）
    accountModal.removeEventListener('touchstart', handleEditModalTouchStart);
    accountModal.removeEventListener('touchmove', handleEditModalTouchMove);
    accountModal.removeEventListener('touchend', handleEditModalTouchEnd);

    // 添加新的事件監聽器
    accountModal.addEventListener('touchstart', handleEditModalTouchStart, { passive: true });
    accountModal.addEventListener('touchmove', handleEditModalTouchMove, { passive: true });
    accountModal.addEventListener('touchend', handleEditModalTouchEnd, { passive: true });
}

function handleEditModalTouchStart(e) {
    editModalTouchStartX = e.touches[0].clientX;
    editModalTouchStartY = e.touches[0].clientY;
    isEditModalSwiping = false;
    editModalStartTransform = 0; // 編輯模態框從 0 開始（已顯示）
}

function handleEditModalTouchMove(e) {
    if(!editModalTouchStartX || !editModalTouchStartY) return;

    const accountModal = document.getElementById('accountModal');
    if(!accountModal || accountModal.style.display === 'none') return;

    const modalWrapper = accountModal.querySelector('.modal-content-wrapper');
    if(!modalWrapper) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = editModalTouchStartX - currentX;
    const diffY = editModalTouchStartY - currentY;
    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffY);

    // 如果垂直滑動距離大於水平滑動距離，不處理
    if(absDiffY > absDiffX) return;

    // 如果水平滑動距離足夠大，標記為滑動中
    if(absDiffX > 10) {
        isEditModalSwiping = true;
        modalWrapper.classList.add('swiping');

        // 在滑動開始時立即讓背景變透明，避免主畫面變暗
        accountModal.style.background = 'transparent';
        accountModal.classList.add('closing');

        // 如果從詳情頁面進入，確保詳情頁面在編輯模態框之下，這樣才能看到編輯模態框的滑出動畫
        if(editingFromDetail && currentDetailAcc) {
            const detailView = document.getElementById('detailView');
            if(detailView) {
                // 確保詳情頁面已經打開
                if(!detailView.classList.contains('active')) {
                    detailView.classList.add('active');
                }
                // 確保詳情頁面在編輯模態框之下（z-index 較低），這樣才能看到編輯模態框的滑出動畫
                detailView.style.zIndex = '2000';
                // 確保詳情頁面在正確位置（完全顯示）
                detailView.style.transform = 'translateX(0)';
            }
        }

        // 計算滑動百分比
        // diffX = touchStartX - currentX
        // 向右滑動（關閉）：diffX < 0，transform 應該變正（向右移動）
        // 向左滑動（不允許）：diffX > 0，應該回彈
        const swipePercent = -(diffX / accountModal.offsetWidth) * 100;

        // 限制範圍：0 到 100%（0 是完全顯示，100% 是完全隱藏）
        // 只允許向右滑動（關閉），向左滑動時回彈
        let newTransform = 0;
        if(swipePercent > 0) {
            // 向右滑動，允許顯示動畫
            newTransform = Math.min(100, swipePercent);
        } else {
            // 向左滑動，添加阻力效果
            newTransform = swipePercent * 0.3;
        }

        modalWrapper.style.transform = `translateX(${newTransform}%)`;
    }
}

function handleEditModalTouchEnd(e) {
    editModalTouchEndX = e.changedTouches[0].clientX;
    editModalTouchEndY = e.changedTouches[0].clientY;

    const accountModal = document.getElementById('accountModal');
    const modalWrapper = accountModal ? accountModal.querySelector('.modal-content-wrapper') : null;
    if(modalWrapper && isEditModalSwiping) {
        modalWrapper.classList.remove('swiping');
    }

    // 如果沒有滑動，恢復背景和 z-index
    if(!isEditModalSwiping) {
        accountModal.style.background = '';
        accountModal.classList.remove('closing');
        // 如果從詳情頁面進入，恢復詳情頁面的 z-index
        if(editingFromDetail && currentDetailAcc) {
            const detailView = document.getElementById('detailView');
            if(detailView) {
                detailView.style.zIndex = '2000';
            }
        }
    }

    if(isEditModalSwiping) {
        handleEditModalSwipe();
    } else {
        handleEditModalSwipe();
    }

    isEditModalSwiping = false;
}

function handleEditModalSwipe() {
    const swipeThreshold = 50;
    const diffX = editModalTouchStartX - editModalTouchEndX;
    const diffY = editModalTouchStartY - editModalTouchEndY;

    // 計算水平和垂直滑動的絕對值
    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffY);

    // 如果垂直滑動距離大於水平滑動距離，則不觸發（避免與滾動衝突）
    if(absDiffY > absDiffX) {
        // 恢復背景和 z-index
        const accountModal = document.getElementById('accountModal');
        if(accountModal) {
            accountModal.style.background = '';
            accountModal.classList.remove('closing');
        }
        // 如果從詳情頁面進入，恢復詳情頁面的 z-index
        if(editingFromDetail && currentDetailAcc) {
            const detailView = document.getElementById('detailView');
            if(detailView) {
                detailView.style.zIndex = '2000';
            }
        }
        return;
    }

    // 向右滑動（touchEndX > touchStartX，即 diffX < 0）
    if(diffX < -swipeThreshold && absDiffX > swipeThreshold) {
        closeModal();
    } else if(isEditModalSwiping) {
        // 如果滑動距離不夠，回彈到原位置
        const accountModal = document.getElementById('accountModal');
        const modalWrapper = accountModal ? accountModal.querySelector('.modal-content-wrapper') : null;
        if(modalWrapper) {
            modalWrapper.style.transform = 'translateX(0)';
        }
        // 恢復背景和 z-index
        if(accountModal) {
            accountModal.style.background = '';
            accountModal.classList.remove('closing');
        }
        // 如果從詳情頁面進入，恢復詳情頁面的 z-index
        if(editingFromDetail && currentDetailAcc) {
            const detailView = document.getElementById('detailView');
            if(detailView) {
                detailView.style.zIndex = '2000';
            }
        }
    }
}

// ── General Swipe Handler (_onSwipe*) ───────────────────────────────────────
let _swipeTargetPage = null;  // 滑動目標頁面 index
let _swipeDirection = 0;      // 1=下一頁(向左滑), -1=上一頁(向右滑)

// 共用的滑動邏輯：touchstart
function _onSwipeTouchStart(e) {
    if(isSorting || _isSwipeAnimating) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isSwiping = false;
    _swipeTargetPage = null;
    _swipeDirection = 0;
}

// 共用的滑動邏輯：touchmove
function _onSwipeTouchMove(e, swiperWidth) {
    if(isSorting || _isSwipeAnimating) return;
    if(!touchStartX || !touchStartY) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = touchStartX - currentX; // positive = 向左滑(下一頁)
    const diffY = touchStartY - currentY;

    if(Math.abs(diffY) > Math.abs(diffX)) return; // 垂直滑動，忽略

    if(Math.abs(diffX) > 10) {
        const container = document.getElementById('pageContainer');
        if(!container) return;

        // 第一次進入滑動：決定方向並準備目標頁面
        if(!isSwiping) {
            isSwiping = true;
            const orderedPages = getOrderedPages();
            const curIdx = orderedPages.indexOf(currentPage);

            if(diffX > 0 && curIdx < orderedPages.length - 1) {
                _swipeDirection = 1; // 下一頁
                _swipeTargetPage = orderedPages[curIdx + 1];
            } else if(diffX < 0 && curIdx > 0) {
                _swipeDirection = -1; // 上一頁
                _swipeTargetPage = orderedPages[curIdx - 1];
            }

            if(_swipeTargetPage !== null) {
                const targetItem = container.querySelector(`.page-item[data-page="${_swipeTargetPage}"]`);
                const currentItem = container.querySelector(`.page-item[data-page="${currentPage}"]`);
                if(targetItem) {
                    targetItem.classList.add('page-swipe-visible');
                    targetItem.style.transition = 'none';
                    targetItem.style.transform = _swipeDirection > 0 ? 'translateX(100%)' : 'translateX(-100%)';
                }
                if(currentItem) {
                    currentItem.style.transition = 'none';
                }
                // 保持容器最小高度（防止動畫期間高度跳動）
                container.style.minHeight = container.offsetHeight + 'px';
            }
        }

        // 移動兩個頁面跟隨手指
        if(_swipeTargetPage !== null) {
            const swipePercent = (diffX / swiperWidth) * 100;
            const currentItem = container.querySelector(`.page-item[data-page="${currentPage}"]`);
            const targetItem = container.querySelector(`.page-item[data-page="${_swipeTargetPage}"]`);

            if(currentItem) {
                currentItem.style.transform = `translateX(${-swipePercent}%)`;
            }
            if(targetItem) {
                const base = _swipeDirection > 0 ? 100 : -100;
                targetItem.style.transform = `translateX(${base - swipePercent}%)`;
            }
        }
    }
}

// 共用的滑動邏輯：touchend
function _onSwipeTouchEnd(e) {
    if(isSorting) { touchStartX = 0; touchStartY = 0; return; }

    const endX = e.changedTouches[0].clientX;
    const diffX = touchStartX - endX;
    const swipeThreshold = 50;
    const container = document.getElementById('pageContainer');

    if(isSwiping && _swipeTargetPage !== null && container) {
        const currentItem = container.querySelector(`.page-item[data-page="${currentPage}"]`);
        const targetItem = container.querySelector(`.page-item[data-page="${_swipeTargetPage}"]`);
        const transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

        const isSuccessful = Math.abs(diffX) > swipeThreshold &&
            ((_swipeDirection > 0 && diffX > 0) || (_swipeDirection < 0 && diffX < 0));

        if(isSuccessful) {
            // 成功滑動：完成動畫 → 切換頁面
            _isSwipeAnimating = true;
            if(currentItem) { currentItem.style.transition = transition; currentItem.style.transform = _swipeDirection > 0 ? 'translateX(-100%)' : 'translateX(100%)'; }
            if(targetItem) { targetItem.style.transition = transition; targetItem.style.transform = 'translateX(0)'; }

            const targetPage = _swipeTargetPage;
            setTimeout(() => {
                // 清除動畫 inline style
                if(currentItem) { currentItem.style.transition = ''; currentItem.style.transform = ''; }
                if(targetItem) { targetItem.style.transition = ''; targetItem.style.transform = ''; targetItem.classList.remove('page-swipe-visible'); }
                container.style.minHeight = '';
                _isSwipeAnimating = false;
                // 正式切換頁面（更新 state + 重新渲染）
                switchToPage(targetPage);
            }, 310);
        } else {
            // 滑動不夠：回彈
            if(currentItem) { currentItem.style.transition = transition; currentItem.style.transform = 'translateX(0)'; }
            if(targetItem) { targetItem.style.transition = transition; targetItem.style.transform = _swipeDirection > 0 ? 'translateX(100%)' : 'translateX(-100%)'; }

            setTimeout(() => {
                if(currentItem) { currentItem.style.transition = ''; currentItem.style.transform = ''; }
                if(targetItem) { targetItem.style.transition = ''; targetItem.style.transform = ''; targetItem.classList.remove('page-swipe-visible'); }
                container.style.minHeight = '';
            }, 310);
        }
    }

    isSwiping = false;
    _swipeTargetPage = null;
    _swipeDirection = 0;
    touchStartX = 0;
    touchStartY = 0;
}
