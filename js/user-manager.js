// ====== user-manager.js ======

// --- Global Variables (lines 1724-1746 in index.html) ---
let users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS)) || [];
let currentUserId = localStorage.getItem(STORAGE_KEY_CURRENT_USER) || null;
let editingUserId = null; // 用於頭像選擇器
let isUserSwitching = false; // 防止使用者切換時的資料競爭

// Avatar Crop Variables
let cropImage = null;
let cropScale = 1;
let cropX = 0;
let cropY = 0;
let cropSize = 200; // 裁切圓形直徑
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

// Touch events for mobile (avatar crop)
let cropTouchStartDistance = 0;
let cropTouchStartScale = 1;
let cropTouchStartX = 0;
let cropTouchStartY = 0;
let isPinching = false;

// Track if avatar selector was opened from edit modal
let avatarSelectorFromEdit = false;

// --- User Selector (lines 4819-4826) ---
function openUserSelector() {
    renderUserList();
    document.getElementById('userSelectorModal').style.display = 'flex';
}

function closeUserSelector() {
    document.getElementById('userSelectorModal').style.display = 'none';
}

// --- Render User List (lines 4828-4890) ---
function renderUserList() {
    const container = document.getElementById('userListContainer');
    container.innerHTML = '';

    users.forEach(user => {
        const isCurrent = user.id === currentUserId;
        const userItem = document.createElement('div');
        userItem.style.cssText = 'display: flex; align-items: center; padding: 15px; margin-bottom: 10px; background: var(--card-bg); border-radius: 12px; cursor: pointer; border: 2px solid ' + (isCurrent ? '#0a84ff' : 'transparent') + ';';
        userItem.onclick = () => switchUser(user.id);

        const avatar = document.createElement('div');
        avatar.style.cssText = 'width: 50px; height: 50px; border-radius: 50%; background: var(--border-color); display: flex; align-items: center; justify-content: center; font-size: 24px; margin-right: 15px; border: 2px solid ' + (isCurrent ? '#0a84ff' : 'var(--border-color)') + ';';
        if (user.avatar.startsWith('data:image')) {
            const img = document.createElement('img');
            img.src = user.avatar;
            img.style.cssText = 'width: 100%; height: 100%; border-radius: 50%; object-fit: cover;';
            avatar.appendChild(img);
        } else {
            avatar.textContent = user.avatar;
        }

        const info = document.createElement('div');
        info.style.cssText = 'flex: 1; display: flex; flex-direction: column; justify-content: center; min-width: 0; padding: 0;';
        const name = document.createElement('div');
        name.style.cssText = 'color: var(--text-primary); font-size: 16px; font-weight: 600; margin: 0 0 4px 0; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left;';
        name.textContent = user.name;
        const date = document.createElement('div');
        date.style.cssText = 'color: var(--text-secondary); font-size: 12px; line-height: 1.2; white-space: nowrap; margin: 0; text-align: left;';
        date.textContent = new Date(user.createdAt).toLocaleDateString('zh-TW');
        info.appendChild(name);
        info.appendChild(date);

        const btnGroup = document.createElement('div');
        btnGroup.style.cssText = 'display: flex; gap: 10px; align-items: center;';

        const editBtn = document.createElement('button');
        editBtn.style.cssText = 'background: none; border: none; color: #0a84ff; font-size: 18px; padding: 5px 10px; cursor: pointer;';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.onclick = (e) => { e.stopPropagation(); openUserEditModal(user.id); };
        editBtn.title = '編輯使用者';

        const deleteBtn = document.createElement('button');
        // 如果是當前使用者，禁用刪除按鈕
        if (isCurrent) {
            deleteBtn.style.cssText = 'background: none; border: none; color: #666; font-size: 18px; padding: 5px 10px; cursor: not-allowed; opacity: 0.5;';
            deleteBtn.disabled = true;
            deleteBtn.title = '無法刪除當前使用者';
        } else {
            deleteBtn.style.cssText = 'background: none; border: none; color: #ff453a; font-size: 18px; padding: 5px 10px; cursor: pointer;';
            deleteBtn.onclick = (e) => { e.stopPropagation(); deleteUser(user.id); };
            deleteBtn.title = '刪除使用者';
        }
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';

        btnGroup.appendChild(editBtn);
        btnGroup.appendChild(deleteBtn);

        userItem.appendChild(avatar);
        userItem.appendChild(info);
        userItem.appendChild(btnGroup);
        container.appendChild(userItem);
    });
}

// --- Create New User (lines 4892-4913) ---
function createNewUser() {
    const userName = prompt('輸入使用者名稱:', `使用者 ${users.length + 1}`);
    if (!userName) return;

    const newUser = {
        id: Date.now().toString(),
        name: userName.trim() || `使用者 ${users.length + 1}`,
        avatar: DEFAULT_AVATARS[users.length % DEFAULT_AVATARS.length],
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    // 同步到 Firestore
    if (window.syncUsersToFirestore && window.firebaseUserLoggedIn) {
        window.syncUsersToFirestore(users);
    }

    // 切換到新使用者
    switchUser(newUser.id);
    closeUserSelector();
}

// --- Switch User (lines 4915-4999) ---
async function switchUser(userId) {
    console.log(`[切換使用者] 開始切換至: ${userId}`);

    // 1. 最後一次安全存檔
    saveData();
    saveSettings();

    // 2. 【開啟鎖定】禁止任何寫入操作
    isUserSwitching = true;

    // 3. 停止監聽（必須先停止，確保 firestoreSyncEnabled 被重置）
    if (window.firebaseUserLoggedIn && typeof stopFirestoreSync === 'function') {
        stopFirestoreSync();
    }

    // 4. 清空記憶體與快取
    accounts = [];
    settings = {};
    if (typeof clearJournalDatesCache === 'function') clearJournalDatesCache();
    // 重置選中日期，避免殘留
    selectedDate = new Date();
    selectedDate.setHours(0,0,0,0);

    // 5. 切換 ID（必須先更新 localStorage，這樣 startFirestoreSync 才能讀取到正確的值）
    currentUserId = userId;
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, currentUserId);

    // 6. 載入新資料
    const localData = loadUserData(currentUserId);
    accounts = localData.accounts;
    settings = localData.settings;

    // 7. 更新所有畫面 (包含記帳與日曆)
    updateUserAvatar();
    renderAssets();
    updateChartData();
    if (typeof renderCalendar === 'function') renderCalendar();
    // 重新顯示今天(或預設日期)的記帳詳情，確保列表也是新的
    if (typeof showFixedTransferDetailsForDate === 'function') {
        showFixedTransferDetailsForDate(selectedDate);
    }

    // 8. 處理雲端同步
    if (window.firebaseUserLoggedIn) {
        if (window.syncCurrentUserToFirestore) {
            window.syncCurrentUserToFirestore(currentUserId).catch(e => console.error(e));
        }

        // 延遲啟動監聽，確保 stopFirestoreSync 已完成，且 localStorage 已更新
        if (typeof startFirestoreSync === 'function') {
            setTimeout(() => {
                console.log(`[切換使用者] 準備啟動新使用者的監聽器，當前 localStorage 中的 currentUserId: ${localStorage.getItem(STORAGE_KEY_CURRENT_USER)}`);
                startFirestoreSync();
            }, 200); // 增加延遲時間，確保舊監聽器完全停止
        }

        // 下載雲端資料
        if (typeof loadDataFromFirestore === 'function') {
            try {
                await loadDataFromFirestore();
                // 下載後再次刷新
                const finalData = loadUserData(currentUserId);
                accounts = finalData.accounts;
                settings = finalData.settings;
                if (typeof clearJournalDatesCache === 'function') clearJournalDatesCache();
                renderAssets();
                updateChartData();
                if (typeof renderCalendar === 'function') renderCalendar();
                if (typeof showFixedTransferDetailsForDate === 'function') {
                    showFixedTransferDetailsForDate(selectedDate);
                }
            } catch (e) {
                console.error("雲端載入失敗", e);
            }
        }
    }

    closeUserSelector();

    // 9. 【解除鎖定】
    setTimeout(() => {
        isUserSwitching = false;
        console.log('[切換使用者] 鎖定解除');
    }, 500);
}

// --- Delete User (lines 5001-5066) ---
function deleteUser(userId) {
    if (users.length <= 1) {
        alert('至少需要保留一個使用者');
        return;
    }

    // 檢查是否嘗試刪除當前使用者
    if (userId === currentUserId) {
        alert('無法刪除當前正在使用的使用者，請先切換到其他使用者');
        return;
    }

    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (!confirm(`確定要刪除使用者「${user.name}」嗎？\n此操作無法復原，該使用者的所有資料將被永久刪除。`)) {
        return;
    }

    // 刪除使用者的資料
    const userDataKey = `${STORAGE_KEY_DATA}_${userId}`;
    const userSettingsKey = `${STORAGE_KEY_SETTINGS}_${userId}`;
    const userJournalKey = `${STORAGE_KEY_JOURNAL}_${userId}`;
    const userFixedTransfersKey = `${STORAGE_KEY_FIXED_TRANSFERS}_${userId}`;

    // 刪除 localStorage 資料
    localStorage.removeItem(userDataKey);
    localStorage.removeItem(userSettingsKey);
    localStorage.removeItem(userJournalKey);
    localStorage.removeItem(userFixedTransfersKey);

    // 刪除 Firestore 資料
    if (window.firebaseUserLoggedIn && window.firebaseDb && window.getCurrentFirebaseUser && window.firebaseDeleteDoc && window.firebaseDoc) {
        const firebaseUser = window.getCurrentFirebaseUser();
        if (firebaseUser) {
            try {
                const userDataRef = window.firebaseDoc(window.firebaseDb, "users", firebaseUser.uid, "appUsers", userId);
                window.firebaseDeleteDoc(userDataRef).then(() => {
                    console.log(`已刪除使用者 ${userId} 的 Firestore 資料`);
                }).catch((err) => {
                    console.error('刪除 Firestore 資料失敗:', err);
                });
            } catch (err) {
                console.error('刪除 Firestore 資料失敗:', err);
            }
        }
    }

    // 從使用者列表中移除
    users = users.filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    // 同步到 Firestore
    if (window.syncUsersToFirestore && window.firebaseUserLoggedIn) {
        window.syncUsersToFirestore(users);
    }

    // 如果刪除的是當前使用者，切換到第一個使用者
    if (currentUserId === userId) {
        if (users.length > 0) {
            switchUser(users[0].id);
        }
    }

    // 更新使用者列表顯示
    renderUserList();
}

// --- User Edit Modal (lines 5068-5119) ---
function openUserEditModal(userId) {
    editingUserId = userId;
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const nameInput = document.getElementById('userEditNameInput');
    if (nameInput) {
        nameInput.value = user.name;
    }

    document.getElementById('userEditModal').style.display = 'flex';
    closeUserSelector();
}

function closeUserEditModal() {
    document.getElementById('userEditModal').style.display = 'none';
    // 注意：不要在這裡清空 editingUserId，因為可能還需要重新打開
    // editingUserId 會在真正關閉時由調用者清空
}

function saveUserEdit() {
    if (!editingUserId) return;

    const user = users.find(u => u.id === editingUserId);
    if (!user) return;

    const nameInput = document.getElementById('userEditNameInput');
    if (nameInput) {
        const newName = nameInput.value.trim();
        if (!newName) {
            alert('名稱不能為空');
            return;
        }
        user.name = newName;
    }

    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    // 同步到 Firestore
    if (window.syncUsersToFirestore && window.firebaseUserLoggedIn) {
        window.syncUsersToFirestore(users);
    }

    // 更新顯示
    renderUserList();
    if (editingUserId === currentUserId) {
        updateUserAvatar();
    }

    editingUserId = null; // 清空 editingUserId
    closeUserEditModal();
}

// --- Avatar Selector (lines 5121-5179) ---
function openAvatarSelectorFromEdit() {
    if (!editingUserId) return;
    avatarSelectorFromEdit = true;
    document.getElementById('avatarSelectorModal').style.display = 'flex';
    closeUserEditModal();
    // 確保模態框顯示後再渲染
    setTimeout(() => {
        renderAvatarSelector();
    }, 50);
}

function closeAvatarSelector() {
    const modal = document.getElementById('avatarSelectorModal');
    if (modal) modal.style.display = 'none';

    // 注意：不再在這裡處理重新打開編輯模態框的邏輯
    // 這個邏輯已經移到 selectAvatar 和 confirmAvatarCrop 中

    avatarSelectorFromEdit = false;
    const preview = document.getElementById('uploadedAvatarPreview');
    if (preview) preview.style.display = 'none';
    const container = document.getElementById('avatarCropContainer');
    if (container) container.style.display = 'none';
    const input = document.getElementById('avatarUploadInput');
    if (input) input.value = '';
    cropImage = null;
}

// --- Handle Avatar Upload (lines 5244-5268) ---
function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('請選擇圖片檔案');
        return;
    }

    // 確保模態框已打開
    const modal = document.getElementById('avatarSelectorModal');
    if (modal) {
        modal.style.display = 'flex';
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const imageData = e.target.result;
        // 確保 DOM 元素已存在後再初始化
        setTimeout(() => {
            initAvatarCrop(imageData);
        }, 100);
    };
    reader.readAsDataURL(file);
}

// --- Confirm / Cancel Avatar Crop (lines 5578-5658) ---
function confirmAvatarCrop() {
    if (!cropImage || !editingUserId) return;

    const canvas = document.getElementById('avatarCropCanvas');

    // 創建一個新的畫布用於裁切
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropSize;
    cropCanvas.height = cropSize;
    const cropCtx = cropCanvas.getContext('2d');

    // 創建圓形裁切路徑
    cropCtx.beginPath();
    cropCtx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2);
    cropCtx.clip();

    // 計算裁切圓形在畫布中的位置（居中）
    const circleX = (canvas.width - cropSize) / 2;
    const circleY = (canvas.height - cropSize) / 2;

    // 計算在原始圖片中的裁切區域
    // 裁切圓形相對於畫布的座標
    const relativeX = circleX - cropX;
    const relativeY = circleY - cropY;

    // 轉換為原始圖片的座標
    const sourceX = (relativeX / cropScale);
    const sourceY = (relativeY / cropScale);
    const sourceSize = cropSize / cropScale;

    // 繪製裁切後的圖片
    cropCtx.drawImage(
        cropImage,
        sourceX, sourceY, sourceSize, sourceSize,
        0, 0, cropSize, cropSize
    );

    // 轉換為 base64
    const croppedImageData = cropCanvas.toDataURL('image/png');

    // 保存頭像
    const user = users.find(u => u.id === editingUserId);
    if (user) {
        user.avatar = croppedImageData;
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
        // 同步到 Firestore
        if (window.syncUsersToFirestore && window.firebaseUserLoggedIn) {
            window.syncUsersToFirestore(users);
        }

        // 更新顯示
        if (editingUserId === currentUserId) {
            updateUserAvatar();
        }

        // 更新使用者列表（如果使用者選擇器是打開的）
        if (document.getElementById('userSelectorModal').style.display === 'flex') {
            renderUserList();
        }

        // 如果從編輯模態框打開的，保存 editingUserId 以便重新打開
        const wasFromEdit = avatarSelectorFromEdit;
        const userId = editingUserId;

        closeAvatarSelector();

        // 如果從編輯模態框打開的，重新打開編輯模態框
        if (wasFromEdit && userId) {
            setTimeout(() => {
                editingUserId = userId; // 確保 editingUserId 沒有被清空
                openUserEditModal(userId);
            }, 150);
        }
    }
}

function cancelAvatarCrop() {
    document.getElementById('avatarCropContainer').style.display = 'none';
    document.getElementById('avatarUploadInput').value = '';
    cropImage = null;
}

// --- Update User Avatar in UI (lines 4791-4817) ---
function updateUserAvatar() {
    const currentUser = users.find(u => u.id === currentUserId);
    const avatarContainer = document.querySelector('.user-avatar-container');
    if (currentUser && avatarContainer) {
        let avatarEl = document.getElementById('currentUserAvatar');
        if (!avatarEl) {
            avatarEl = document.createElement('div');
            avatarEl.id = 'currentUserAvatar';
            avatarEl.className = 'user-avatar';
            avatarContainer.innerHTML = '';
            avatarContainer.appendChild(avatarEl);
        }

        // 清除舊內容
        avatarEl.innerHTML = '';

        if (currentUser.avatar.startsWith('data:image')) {
            const img = document.createElement('img');
            img.src = currentUser.avatar;
            img.style.cssText = 'width: 100%; height: 100%; border-radius: 50%; object-fit: cover;';
            avatarEl.appendChild(img);
        } else {
            // 使用 emoji
            avatarEl.textContent = currentUser.avatar;
        }
    }
}


    function editUserAvatar(userId) {
        editingUserId = userId;
        document.getElementById('avatarSelectorModal').style.display = 'flex';
        closeUserSelector();
        // 確保模態框顯示後再渲染
        setTimeout(() => {
            renderAvatarSelector();
        }, 50);
    }

    function editUserName(userId) {
        const user = users.find(u => u.id === userId);
        if (!user) return;
        
        const newName = prompt('輸入新的使用者名稱:', user.name);
        if (newName === null) return; // 用戶取消
        
        const trimmedName = newName.trim();
        if (!trimmedName) {
            alert('名稱不能為空');
            return;
        }
        
        if (trimmedName === user.name) return; // 沒有變更
        
        user.name = trimmedName;
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
        
        // 更新使用者列表顯示
        renderUserList();
    }


    function renderAvatarSelector() {
        const container = document.getElementById('defaultAvatarsContainer');
        if (!container) {
            console.error('defaultAvatarsContainer not found');
            return;
        }
        
        container.innerHTML = '';
        
        if (!DEFAULT_AVATARS || DEFAULT_AVATARS.length === 0) {
            console.error('DEFAULT_AVATARS is not defined or empty');
            return;
        }
        
        DEFAULT_AVATARS.forEach((avatar, index) => {
            const avatarBtn = document.createElement('button');
            avatarBtn.style.cssText = 'width: 80px; height: 80px; border-radius: 50%; background: #2c2c2e; border: 2px solid #3a3a3c; font-size: 40px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;';
            avatarBtn.textContent = avatar;
            avatarBtn.onmouseover = () => { avatarBtn.style.borderColor = '#0a84ff'; avatarBtn.style.transform = 'scale(1.1)'; };
            avatarBtn.onmouseout = () => { avatarBtn.style.borderColor = '#3a3a3c'; avatarBtn.style.transform = 'scale(1)'; };
            avatarBtn.onclick = () => selectAvatar(avatar);
            container.appendChild(avatarBtn);
        });
    }

    function selectAvatar(avatar) {
        if (!editingUserId) return;
        
        const user = users.find(u => u.id === editingUserId);
        if (user) {
            user.avatar = avatar;
            localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
            // 同步到 Firestore
            if (window.syncUsersToFirestore && window.firebaseUserLoggedIn) {
                window.syncUsersToFirestore(users);
            }
            
            // 更新顯示
            if (editingUserId === currentUserId) {
                updateUserAvatar();
            }
            
            // 更新使用者列表（如果使用者選擇器是打開的）
            if (document.getElementById('userSelectorModal').style.display === 'flex') {
                renderUserList();
            }
            
            // 如果從編輯模態框打開的，保存 editingUserId 以便重新打開
            const wasFromEdit = avatarSelectorFromEdit;
            const userId = editingUserId;
            
            closeAvatarSelector();
            
            // 如果從編輯模態框打開的，重新打開編輯模態框
            if (wasFromEdit && userId) {
                setTimeout(() => {
                    editingUserId = userId; // 確保 editingUserId 沒有被清空
                    openUserEditModal(userId);
                }, 150);
            }
        }
    }


    function initAvatarCrop(imageSrc) {
        cropImage = new Image();
        cropImage.onload = function() {
            // 使用函數確保元素存在
            function tryInitCrop() {
                const canvas = document.getElementById('avatarCropCanvas');
                const wrapper = document.getElementById('avatarCropWrapper');
                const container = document.getElementById('avatarCropContainer');
                
                // 檢查元素是否存在
                if (!canvas || !wrapper || !container) {
                    // 如果元素還不存在，稍後再試
                    setTimeout(tryInitCrop, 50);
                    return;
                }
                
                // 設置畫布大小（固定大小）
                const maxWidth = 300;
                canvas.width = maxWidth;
                canvas.height = maxWidth;
                canvas.style.width = maxWidth + 'px';
                canvas.style.height = maxWidth + 'px';
                
                // 初始化裁切參數
                // 計算初始縮放比例，使圖片能填滿畫布
                const scaleToFit = Math.max(canvas.width / cropImage.width, canvas.height / cropImage.height);
                cropScale = scaleToFit * 1.2; // 稍微放大一點
                
                // 裁切圓形大小（固定）
                cropSize = maxWidth * 0.8;
                
                // 初始化圖片位置（居中）
                const imgWidth = cropImage.width * cropScale;
                const imgHeight = cropImage.height * cropScale;
                cropX = (canvas.width - imgWidth) / 2;
                cropY = (canvas.height - imgHeight) / 2;
                
                // 設置裁切圓形位置
                updateCropCircle();
                
                // 繪製圖片
                drawCropImage();
                
                // 顯示裁切界面
                container.style.display = 'block';
                const preview = document.getElementById('uploadedAvatarPreview');
                if (preview) {
                    preview.style.display = 'none';
                }
                
                // 添加事件監聽
                setupCropEvents();
                
                // 更新縮放提示文字（手機版顯示雙指縮放）
                const zoomHint = document.getElementById('zoomHint');
                if (zoomHint) {
                    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
                    zoomHint.textContent = isMobile ? '雙指縮放' : '滾輪縮放';
                }
            }
            
            // 開始嘗試初始化
            tryInitCrop();
        };
        cropImage.onerror = function() {
            alert('圖片載入失敗，請重新選擇');
        };
        cropImage.src = imageSrc;
    }

    function drawCropImage() {
        const canvas = document.getElementById('avatarCropCanvas');
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 計算縮放後的圖片尺寸
        const imgWidth = cropImage.width * cropScale;
        const imgHeight = cropImage.height * cropScale;
        
        // 計算圖片位置（相對於畫布）
        const imgX = cropX;
        const imgY = cropY;
        
        // 繪製圖片
        ctx.drawImage(cropImage, imgX, imgY, imgWidth, imgHeight);
        
        // 更新裁切圓形位置（圓形居中固定）
        updateCropCircle();
    }

    function updateCropCircle() {
        const circle = document.getElementById('avatarCropCircle');
        const wrapper = document.getElementById('avatarCropWrapper');
        
        if (!circle || !wrapper) return;
        
        // 圓形居中顯示
        const wrapperWidth = wrapper.offsetWidth || 300;
        const wrapperHeight = wrapper.offsetHeight || 300;
        
        circle.style.left = (wrapperWidth - cropSize) / 2 + 'px';
        circle.style.top = (wrapperHeight - cropSize) / 2 + 'px';
        circle.style.width = cropSize + 'px';
        circle.style.height = cropSize + 'px';
    }

    // 縮放處理函數（共用）
    function handleZoom(centerX, centerY, scaleChange) {
        const canvas = document.getElementById('avatarCropCanvas');
        if (!canvas) return;
        
        // centerX 和 centerY 已經是相對於畫布的座標
        const mouseX = centerX;
        const mouseY = centerY;
        
        const oldScale = cropScale;
        const newScale = Math.max(0.5, Math.min(5, cropScale * scaleChange));
        const scaleRatio = newScale / oldScale;
        
        // 調整圖片位置，使縮放中心點保持不變
        const relativeX = mouseX - cropX;
        const relativeY = mouseY - cropY;
        
        cropX = mouseX - relativeX * scaleRatio;
        cropY = mouseY - relativeY * scaleRatio;
        
        cropScale = newScale;
        
        // 限制圖片位置
        const imgWidth = cropImage.width * cropScale;
        const imgHeight = cropImage.height * cropScale;
        const minX = canvas.width - imgWidth;
        const maxX = 0;
        const minY = canvas.height - imgHeight;
        const maxY = 0;
        
        cropX = Math.max(minX, Math.min(cropX, maxX));
        cropY = Math.max(minY, Math.min(cropY, maxY));
        
        drawCropImage();
    }

    function setupCropEvents() {
        const canvas = document.getElementById('avatarCropCanvas');
        const wrapper = document.getElementById('avatarCropWrapper');
        
        if (!canvas || !wrapper) return;
        
        // 移除舊的事件監聽（如果有的話）
        canvas.onmousedown = null;
        canvas.onmousemove = null;
        canvas.onmouseup = null;
        canvas.onwheel = null;
        wrapper.onmousedown = null;
        wrapper.onmousemove = null;
        wrapper.onmouseup = null;
        wrapper.onwheel = null;
        wrapper.ontouchstart = null;
        wrapper.ontouchmove = null;
        wrapper.ontouchend = null;
        wrapper.ontouchcancel = null;
        
        // 拖動事件（拖動圖片）
        wrapper.onmousedown = function(e) {
            isDragging = true;
            const rect = canvas.getBoundingClientRect();
            dragStartX = e.clientX - rect.left - cropX;
            dragStartY = e.clientY - rect.top - cropY;
        };
        
        wrapper.onmousemove = function(e) {
            if (!isDragging) return;
            
            const rect = canvas.getBoundingClientRect();
            const newX = e.clientX - rect.left - dragStartX;
            const newY = e.clientY - rect.top - dragStartY;
            
            // 計算圖片尺寸
            const imgWidth = cropImage.width * cropScale;
            const imgHeight = cropImage.height * cropScale;
            
            // 限制圖片位置，確保裁切圓形區域內有圖片內容
            const minX = canvas.width - imgWidth;
            const maxX = 0;
            const minY = canvas.height - imgHeight;
            const maxY = 0;
            
            cropX = Math.max(minX, Math.min(newX, maxX));
            cropY = Math.max(minY, Math.min(newY, maxY));
            
            drawCropImage();
        };
        
        wrapper.onmouseup = function() {
            isDragging = false;
        };
        
        wrapper.onmouseleave = function() {
            isDragging = false;
        };
        
        // 滾輪縮放圖片（桌面版）
        wrapper.onwheel = function(e) {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            handleZoom(mouseX, mouseY, e.deltaY > 0 ? 0.95 : 1.05);
        };
        
        // 觸控事件（手機版）
        wrapper.ontouchstart = function(e) {
            e.preventDefault();
            if (e.touches.length === 1) {
                // 單指拖動
                isDragging = true;
                const rect = canvas.getBoundingClientRect();
                const touch = e.touches[0];
                dragStartX = touch.clientX - rect.left - cropX;
                dragStartY = touch.clientY - rect.top - cropY;
            } else if (e.touches.length === 2) {
                // 雙指縮放
                isPinching = true;
                isDragging = false;
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                cropTouchStartDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
                cropTouchStartScale = cropScale;
                
                // 計算雙指中心點
                const rect = canvas.getBoundingClientRect();
                cropTouchStartX = ((touch1.clientX + touch2.clientX) / 2) - rect.left;
                cropTouchStartY = ((touch1.clientY + touch2.clientY) / 2) - rect.top;
            }
        };
        
        wrapper.ontouchmove = function(e) {
            e.preventDefault();
            if (e.touches.length === 1 && isDragging && !isPinching) {
                // 單指拖動
                const rect = canvas.getBoundingClientRect();
                const touch = e.touches[0];
                const newX = touch.clientX - rect.left - dragStartX;
                const newY = touch.clientY - rect.top - dragStartY;
                
                // 計算圖片尺寸
                const imgWidth = cropImage.width * cropScale;
                const imgHeight = cropImage.height * cropScale;
                
                // 限制圖片位置
                const minX = canvas.width - imgWidth;
                const maxX = 0;
                const minY = canvas.height - imgHeight;
                const maxY = 0;
                
                cropX = Math.max(minX, Math.min(newX, maxX));
                cropY = Math.max(minY, Math.min(newY, maxY));
                
                drawCropImage();
            } else if (e.touches.length === 2 && isPinching) {
                // 雙指縮放
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const currentDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
                
                if (cropTouchStartDistance > 0) {
                    const scaleChange = currentDistance / cropTouchStartDistance;
                    const newScale = Math.max(0.5, Math.min(5, cropTouchStartScale * scaleChange));
                    
                    // 計算當前雙指中心點（相對於畫布）
                    const rect = canvas.getBoundingClientRect();
                    const currentCenterX = ((touch1.clientX + touch2.clientX) / 2) - rect.left;
                    const currentCenterY = ((touch1.clientY + touch2.clientY) / 2) - rect.top;
                    
                    // 使用當前雙指中心點作為縮放中心
                    handleZoom(currentCenterX, currentCenterY, newScale / cropScale);
                }
            }
        };
        
        wrapper.ontouchend = function(e) {
            if (e.touches.length === 0) {
                isDragging = false;
                isPinching = false;
            } else if (e.touches.length === 1) {
                // 從雙指變單指，切換到拖動模式
                isPinching = false;
                isDragging = true;
                const rect = canvas.getBoundingClientRect();
                const touch = e.touches[0];
                dragStartX = touch.clientX - rect.left - cropX;
                dragStartY = touch.clientY - rect.top - cropY;
            }
        };
        
        wrapper.ontouchcancel = function() {
            isDragging = false;
            isPinching = false;
        };
    }

