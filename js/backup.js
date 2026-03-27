// ====== backup.js ======
// 匯出、匯入、雲端備份功能
// Extracted from index.html lines 4026–4591

    // Global variable (line 4271)
    let cloudBackupTimer = null;

    // ---- Export (lines 4026–4080) ----
    function exportData() {
        // 匯出所有使用者資料
        const allUsersData = {};
        users.forEach(user => {
            const userDataKey = `${STORAGE_KEY_DATA}_${user.id}`;
            const userSettingsKey = `${STORAGE_KEY_SETTINGS}_${user.id}`;
            const userJournalKey = `${STORAGE_KEY_JOURNAL}_${user.id}`;
            const userFixedTransfersKey = `${STORAGE_KEY_FIXED_TRANSFERS}_${user.id}`;
            const userDateNotesKey = `${STORAGE_KEY_DATE_NOTES}_${user.id}`;
            const userAssetHistoryKey = `${STORAGE_KEY_ASSET_HISTORY}_${user.id}`;
            const userDividendRecordsKey = `${STORAGE_KEY_DIVIDEND_RECORDS}_${user.id}`;
            const userTwstockDailyKey = `${STORAGE_KEY_TWSTOCK_DAILY}_${user.id}`;
            const userAccounts = JSON.parse(localStorage.getItem(userDataKey)) || [];
            const userSettings = JSON.parse(localStorage.getItem(userSettingsKey)) || {};
            const userJournal = JSON.parse(localStorage.getItem(userJournalKey)) || [];
            const userFixedTransfers = JSON.parse(localStorage.getItem(userFixedTransfersKey)) || [];
            const userDateNotes = JSON.parse(localStorage.getItem(userDateNotesKey) || '{}');
            const userAssetHistory = JSON.parse(localStorage.getItem(userAssetHistoryKey) || '{}');
            const userDividendRecords = JSON.parse(localStorage.getItem(userDividendRecordsKey) || '{}');
            const userTwstockDaily = JSON.parse(localStorage.getItem(userTwstockDailyKey) || '{}');
            allUsersData[user.id] = {
                user: user,
                data: userAccounts,
                settings: userSettings,
                journal: userJournal,
                fixedTransfers: userFixedTransfers,
                dateNotes: userDateNotes,
                assetHistory: userAssetHistory,
                dividendRecords: userDividendRecords,
                twstockDaily: userTwstockDaily
            };
        });

        const exportData = {
            version: '2.0',
            users: users,
            usersData: allUsersData,
            exportDate: new Date().toISOString()
        };

        const jsonStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonStr], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // 生成包含日期和時間的檔名，格式：my_assets_backup_2025-12-04_12-20-34.json
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // 2025-12-04
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // 12:20:34 -> 12-20-34
        a.download = `my_assets_backup_${dateStr}_${timeStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ---- Import (lines 4477–4591) ----
    function importData() {
        // 直接觸發檔案選擇，不再提供貼上文字的選項
        document.getElementById('importFileInput').click();
    }
    function handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        const progressToast = document.getElementById('importProgressToast');
        const progressBar = document.getElementById('importProgressBar');
        const progressText = document.getElementById('importProgressText');
        const importOverlay = document.getElementById('importOverlay');

        // 顯示遮罩層和進度條
        if(importOverlay) importOverlay.style.display = 'block';
        progressToast.style.display = 'block';
        progressBar.style.width = '20%';
        progressText.innerText = '讀取檔案中...';

        const reader = new FileReader();
        reader.onload = function(e) {
            progressBar.style.width = '50%';
            progressText.innerText = '解析JSON中...';
            try {
                setTimeout(async () => {
                    progressBar.style.width = '70%';
                    progressText.innerText = '驗證資料中...';
                    const d = JSON.parse(e.target.result);

                    // 準備要切換的主要使用者 ID
                    let primaryUserId = null;

                    if (d.version === '2.0' && d.users && d.usersData) {
                        progressBar.style.width = '90%';
                        progressText.innerText = '寫入資料中...';

                        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(d.users));

                        if (d.users.length > 0) {
                            primaryUserId = d.users[0].id;
                            localStorage.setItem(STORAGE_KEY_CURRENT_USER, primaryUserId);
                            currentUserId = primaryUserId;
                        }

                        Object.keys(d.usersData).forEach(userId => {
                            const userData = d.usersData[userId];
                            localStorage.setItem(`${STORAGE_KEY_DATA}_${userId}`, JSON.stringify(userData.data || []));
                            localStorage.setItem(`${STORAGE_KEY_SETTINGS}_${userId}`, JSON.stringify(userData.settings || {}));
                            // 修正：確保即使是 undefined 也要存成空陣列，避免讀取錯誤
                            localStorage.setItem(`${STORAGE_KEY_JOURNAL}_${userId}`, JSON.stringify(userData.journal || []));
                            localStorage.setItem(`${STORAGE_KEY_FIXED_TRANSFERS}_${userId}`, JSON.stringify(userData.fixedTransfers || []));
                            // 匯入日期記事
                            if (userData.dateNotes !== undefined) {
                                localStorage.setItem(`${STORAGE_KEY_DATE_NOTES}_${userId}`, JSON.stringify(userData.dateNotes || {}));
                            }
                            // 匯入資產歷史快照
                            if (userData.assetHistory !== undefined) {
                                localStorage.setItem(`${STORAGE_KEY_ASSET_HISTORY}_${userId}`, JSON.stringify(userData.assetHistory || {}));
                            }
                            // 匯入除權息紀錄
                            if (userData.dividendRecords !== undefined) {
                                localStorage.setItem(`${STORAGE_KEY_DIVIDEND_RECORDS}_${userId}`, JSON.stringify(userData.dividendRecords || {}));
                            }
                            // 匯入台股每日持股快照
                            if (userData.twstockDaily !== undefined) {
                                localStorage.setItem(`${STORAGE_KEY_TWSTOCK_DAILY}_${userId}`, JSON.stringify(userData.twstockDaily || {}));
                            }
                        });

                    } else if (d.data && d.settings) {
                        progressBar.style.width = '90%';
                        progressText.innerText = '寫入資料中...';
                        primaryUserId = currentUserId;
                        localStorage.setItem(`${STORAGE_KEY_DATA}_${primaryUserId}`, JSON.stringify(d.data));
                        localStorage.setItem(`${STORAGE_KEY_SETTINGS}_${primaryUserId}`, JSON.stringify(d.settings));
                    } else {
                        throw new Error("檔案格式錯誤");
                    }

                    if (window.firebaseUserLoggedIn) {
                        progressText.innerText = '同步到雲端...';
                        try {
                            if (d.users && window.syncUsersToFirestore) {
                                await window.syncUsersToFirestore(d.users);
                            }
                            // 關鍵：更新雲端紀錄的「當前使用者」，防止重新整理後跳回舊帳號
                            if (primaryUserId && window.syncCurrentUserToFirestore) {
                                await window.syncCurrentUserToFirestore(primaryUserId);
                            }
                            if (window.syncAllDataToFirestore) {
                                await window.syncAllDataToFirestore();
                            }
                            progressText.innerText = '同步完成！';
                        } catch (err) {
                            console.error('同步到 Firestore 失敗:', err);
                        }
                    }

                    progressBar.style.width = '100%';
                    progressText.innerText = '完成！';

                    // 延遲重新整理，確保資料寫入完成
                    setTimeout(() => location.reload(), 500);

                }, 100);
            } catch(err) {
                if(importOverlay) importOverlay.style.display = 'none';
                progressToast.style.display = 'none';
                progressBar.style.width = '0%';
                alert("讀取檔案失敗: " + err.message);
                console.error(err);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    // ---- Cloud Backup Setup Modal (lines 4083–4142) ----
    async function setupCloudBackup() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.zIndex = '3000';
        modal.innerHTML = `
            <div class="modal-content-wrapper" style="max-width: 400px; max-height: 90vh; padding: 0; overflow: hidden; display: flex; flex-direction: column; background: var(--card-bg); border-radius: 12px;">
                <div style="font-size: 18px; font-weight: 600; color: var(--text-primary); padding: 20px 20px 15px 20px; flex-shrink: 0; border-bottom: 1px solid var(--border-color);">雲端備份設定</div>
                <div class="form-group" style="flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 15px 20px; -webkit-overflow-scrolling: touch;">
                    <div class="form-row" style="display: flex; align-items: center; justify-content: space-between;">
                        <span class="form-label">啟用自動備份</span>
                        <label class="switch">
                            <input type="checkbox" id="cloudBackupEnabled" ${settings.cloudBackupEnabled ? 'checked' : ''} onchange="updateCloudBackupSetting()">
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div class="form-row" style="${settings.cloudBackupEnabled ? '' : 'display: none;'}" id="cloudBackupStatusRow">
                        <span class="form-label">上次備份</span>
                        <span id="cloudBackupLastTime" style="color: var(--text-secondary);">${settings.cloudBackupLastTime ? new Date(settings.cloudBackupLastTime).toLocaleString('zh-TW') : '尚未備份'}</span>
                    </div>
                    <div class="form-row" style="margin-top: 20px;">
                        <span class="form-label">Google Client ID</span>
                        <input type="text" id="inpDriveClientId" class="form-input" placeholder="例：123456789-xxx.apps.googleusercontent.com" value="${(settings.driveClientId || '')}" style="font-size: 13px;" onchange="saveDriveClientId()">
                        <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">請至 Google Cloud Console 建立 OAuth 用戶端 ID 並啟用 Drive API</div>
                    </div>
                    <div class="form-row" style="margin-top: 15px;">
                        <div id="drive-login-status" style="margin-bottom: 10px; padding: 10px; background: var(--card-bg); border-radius: 8px;">
                            <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 8px;">Google Drive 備份狀態</div>
                            <div id="drive-user-info" style="font-size: 16px; color: var(--text-primary);">未登入</div>
                            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">登入後將在您的 Google Drive 建立「${GOOGLE_DRIVE_FOLDER_NAME}」資料夾，每次開啟 App 會自動備份</div>
                        </div>
                        <button id="btn-drive-login" onclick="handleDriveLogin()" style="width: 100%; padding: 12px; background: #4285f4; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
                            <i class="fab fa-google"></i> Google 登入（連結 Drive）
                        </button>
                        <button id="btn-drive-logout" onclick="handleDriveLogout()" style="width: 100%; padding: 12px; background: var(--color-down); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 10px; display: none;">
                            <i class="fas fa-sign-out-alt"></i> 登出
                        </button>
                    </div>
                    <div class="form-row" style="margin-top: 10px;">
                        <button onclick="testCloudBackup()" style="width: 100%; padding: 12px; background: var(--color-up); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
                            <i class="fas fa-cloud-upload-alt"></i> 立即備份
                        </button>
                    </div>
                </div>
                <div style="padding: 15px 20px; text-align: center; flex-shrink: 0; border-top: 1px solid var(--border-color);">
                    <button onclick="closeCloudBackupModal()" style="padding: 10px 20px; background: var(--border-color); color: var(--text-primary); border: none; border-radius: 8px; cursor: pointer;">關閉</button>
                </div>
            </div>
        `;
        modal.onclick = (e) => {
            if(e.target === modal) closeCloudBackupModal();
        };
        document.body.appendChild(modal);
        window.cloudBackupModal = modal;
        modal.style.display = 'block';

        // 初始化 Google Drive UI
        setTimeout(() => {
            updateDriveUI();
        }, 100);
    }

    // ---- Cloud Backup Modal Helpers (lines 4144–4207) ----
    function closeCloudBackupModal() {
        if(window.cloudBackupModal) {
            window.cloudBackupModal.style.display = 'none';
                            setTimeout(() => {
                if(window.cloudBackupModal && window.cloudBackupModal.parentNode) {
                    window.cloudBackupModal.parentNode.removeChild(window.cloudBackupModal);
                }
            }, 300);
        }
    }

    function saveDriveClientId() {
        const el = document.getElementById('inpDriveClientId');
        if (el) {
            settings.driveClientId = (el.value || '').trim();
            saveSettings();
        }
    }

    // ---- Google Drive Login/Logout (lines 4163–4247) ----
    async function handleDriveLogin() {
        saveDriveClientId();
        const clientId = settings.driveClientId;
        if (!clientId) {
            alert('請先在上方輸入 Google Client ID。\n\n取得方式：\n1. 前往 Google Cloud Console\n2. 建立專案或選擇現有專案\n3. 啟用「Google Drive API」\n4. 建立 OAuth 2.0 用戶端 ID（網頁應用程式）\n5. 將 Client ID 貼到上方欄位');
            return;
        }
        try {
            await requestDriveToken();
        } catch (error) {
            alert('登入失敗：' + (error.message || error));
        }
    }

    function handleDriveLogout() {
        settings.driveAccessToken = null;
        settings.driveUserEmail = null;
        settings.cloudBackupToken = null;
        saveSettings();
        updateDriveUI();
    }

    function updateDriveUI() {
        const userInfo = document.getElementById('drive-user-info');
        const loginBtn = document.getElementById('btn-drive-login');
        const logoutBtn = document.getElementById('btn-drive-logout');
        if (userInfo || loginBtn || logoutBtn) {
            if (settings.driveAccessToken && settings.driveUserEmail) {
                if (userInfo) userInfo.textContent = `已登入：${settings.driveUserEmail}`;
                if (loginBtn) loginBtn.style.display = 'none';
                if (logoutBtn) logoutBtn.style.display = 'block';
                settings.cloudBackupToken = 'google_drive';
                saveSettings();
            } else {
                if (userInfo) userInfo.textContent = '未登入';
                if (loginBtn) loginBtn.style.display = 'block';
                if (logoutBtn) logoutBtn.style.display = 'none';
                if (settings.cloudBackupToken === 'google_drive') {
                    settings.cloudBackupToken = null;
                    saveSettings();
                }
            }
        }
    }

    function requestDriveToken() {
        return new Promise((resolve, reject) => {
            if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
                reject(new Error('Google 登入服務尚未載入，請稍後再試'));
                return;
            }
            const clientId = (settings.driveClientId || '').trim();
            if (!clientId) {
                reject(new Error('請先輸入 Google Client ID'));
                return;
            }
            const tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: 'https://www.googleapis.com/auth/drive.file email',
                callback: (response) => {
                    if (response.error) {
                        reject(new Error(response.error));
                        return;
                    }
                    settings.driveAccessToken = response.access_token;
                    settings.cloudBackupToken = 'google_drive';
                    settings.cloudBackupEnabled = true;
                    fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                        headers: { Authorization: 'Bearer ' + response.access_token }
                    }).then(r => r.json()).then(profile => {
                        settings.driveUserEmail = profile.email || '';
                        saveSettings();
                        updateDriveUI();
                        resolve();
                    }).catch(() => {
                        settings.driveUserEmail = '已登入';
                        saveSettings();
                        updateDriveUI();
                        resolve();
                    });
                }
            });
            tokenClient.requestAccessToken();
        });
    }

    // ---- Cloud Backup Timer (lines 4250–4308) ----
    function updateCloudBackupSetting() {
        const enabledEl = document.getElementById('cloudBackupEnabled');
        const enabled = enabledEl ? enabledEl.checked : false;
        const intervalEl = document.getElementById('cloudBackupInterval');
        const interval = intervalEl ? (parseInt(intervalEl.value) || 24) : 24;
        settings.cloudBackupEnabled = enabled;
        settings.cloudBackupInterval = interval;
        saveSettings();

        const intervalRow = document.getElementById('cloudBackupIntervalRow');
        const statusRow = document.getElementById('cloudBackupStatusRow');
        if(intervalRow) intervalRow.style.display = enabled ? 'flex' : 'none';
        if(statusRow) statusRow.style.display = enabled ? 'flex' : 'none';

        if(enabled) {
            startCloudBackupTimer();
                        } else {
            stopCloudBackupTimer();
        }
    }

    function startCloudBackupTimer() {
        stopCloudBackupTimer();
        if(!settings.cloudBackupEnabled || !settings.cloudBackupToken) return;
        // Google Drive 使用開啟時備份，不需要定時器
        if(settings.cloudBackupToken === 'google_drive') return;

        const intervalMs = (settings.cloudBackupInterval || 24) * 60 * 60 * 1000;
        cloudBackupTimer = setInterval(() => {
            performCloudBackup();
        }, intervalMs);

        // 檢查是否需要立即備份
        if(!settings.cloudBackupLastTime ||
           (Date.now() - new Date(settings.cloudBackupLastTime).getTime()) >= intervalMs) {
            performCloudBackup();
        }

        // 註冊背景同步（如果支援）
        if('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            navigator.serviceWorker.ready.then((registration) => {
                // 定期註冊背景同步
                setInterval(() => {
                    registration.sync.register('cloud-backup').catch((err) => {
                        console.log('背景同步註冊失敗（可能不支援）:', err);
                    });
                }, intervalMs);
            });
        }
    }

    function stopCloudBackupTimer() {
        if(cloudBackupTimer) {
            clearInterval(cloudBackupTimer);
            cloudBackupTimer = null;
        }
    }

    // ---- Google Drive Upload (lines 4310–4373) ----
    async function uploadBackupToDrive(jsonStr, filename) {
        const token = settings.driveAccessToken;
        if (!token) throw new Error('請先登入 Google Drive');

        const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';
        const headers = {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        };

        // 1. 查詢或建立 Monee 資料夾
        let folderId = null;
        const listRes = await fetch(DRIVE_API + '?q=' + encodeURIComponent("name='" + GOOGLE_DRIVE_FOLDER_NAME + "' and mimeType='application/vnd.google-apps.folder' and trashed=false") + '&fields=files(id,name)', { headers });
        const listData = await listRes.json();
        if (listData.files && listData.files.length > 0) {
            folderId = listData.files[0].id;
        } else {
            const createRes = await fetch(DRIVE_API, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    name: GOOGLE_DRIVE_FOLDER_NAME,
                    mimeType: 'application/vnd.google-apps.folder'
                })
            });
            if (!createRes.ok) {
                const err = await createRes.json();
                throw new Error(err.error?.message || '建立資料夾失敗');
            }
            const createData = await createRes.json();
            folderId = createData.id;
        }

        // 2. 上傳 JSON 檔案
        const boundary = '-------314159265358979323846';
        const delimiter = '\r\n--' + boundary + '\r\n';
        const closeDelim = '\r\n--' + boundary + '--';
        const meta = JSON.stringify({
            name: filename,
            parents: [folderId]
        });
        const body = delimiter + 'Content-Type: application/json\r\n\r\n' + meta +
            delimiter + 'Content-Type: application/json\r\n\r\n' + jsonStr + closeDelim;

        const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'multipart/related; boundary=' + boundary
            },
            body
        });

        if (!uploadRes.ok) {
            const err = await uploadRes.json();
            if (err.error?.code === 401) {
                settings.driveAccessToken = null;
                saveSettings();
                throw new Error('登入已過期，請重新登入 Google Drive');
            }
            throw new Error(err.error?.message || '上傳失敗');
        }
    }

    // ---- Perform / Generate Backup (lines 4375–4475) ----
    async function performCloudBackup() {
        if(!settings.cloudBackupEnabled) return;

        try {
            // 生成備份資料
            const backupData = await generateBackupData();
            const jsonStr = JSON.stringify(backupData, null, 2);
            // 生成包含日期和時間的檔名，格式：my_assets_backup_2025-12-04_12-20-34.json
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0]; // 2025-12-04
            const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // 12:20:34 -> 12-20-34
            const filename = `my_assets_backup_${dateStr}_${timeStr}.json`;

            if(settings.cloudBackupToken === 'local_storage_backup') {
                // 簡化版本：備份到 localStorage
                // 使用完整的檔名（包含日期和時間）作為 key
                localStorage.setItem(`cloud_backup_${dateStr}_${timeStr}`, jsonStr);
                // 只保留最近 10 個備份
                const backupKeys = Object.keys(localStorage).filter(k => k.startsWith('cloud_backup_')).sort().reverse();
                if(backupKeys.length > 10) {
                    backupKeys.slice(10).forEach(k => localStorage.removeItem(k));
                }
                settings.cloudBackupLastTime = new Date().toISOString();
                saveSettings();
                console.log('雲端備份完成（本地）:', filename);
            } else if(settings.cloudBackupToken === 'google_drive') {
                // Google Drive 備份
                await uploadBackupToDrive(jsonStr, filename);
                settings.cloudBackupLastTime = new Date().toISOString();
                saveSettings();
                console.log('Google Drive 備份完成:', filename);
            }
        } catch(e) {
            console.error('雲端備份失敗:', e);
        }
    }

    async function generateBackupData() {
        const allUsersData = {};
        users.forEach(user => {
            const userDataKey = `${STORAGE_KEY_DATA}_${user.id}`;
            const userSettingsKey = `${STORAGE_KEY_SETTINGS}_${user.id}`;
            const userJournalKey = `${STORAGE_KEY_JOURNAL}_${user.id}`;
            const userFixedTransfersKey = `${STORAGE_KEY_FIXED_TRANSFERS}_${user.id}`;
            const userAccounts = JSON.parse(localStorage.getItem(userDataKey)) || [];
            const userSettings = JSON.parse(localStorage.getItem(userSettingsKey)) || {};
            const userJournal = JSON.parse(localStorage.getItem(userJournalKey)) || [];
            const userFixedTransfers = JSON.parse(localStorage.getItem(userFixedTransfersKey)) || [];
            const userDateNotesKey = `${STORAGE_KEY_DATE_NOTES}_${user.id}`;
            const userDateNotes = JSON.parse(localStorage.getItem(userDateNotesKey) || '{}');
            const userAssetHistoryKey = `${STORAGE_KEY_ASSET_HISTORY}_${user.id}`;
            const userDividendRecordsKey = `${STORAGE_KEY_DIVIDEND_RECORDS}_${user.id}`;
            const userTwstockDailyKey = `${STORAGE_KEY_TWSTOCK_DAILY}_${user.id}`;
            const userAssetHistory = JSON.parse(localStorage.getItem(userAssetHistoryKey) || '{}');
            const userDividendRecords = JSON.parse(localStorage.getItem(userDividendRecordsKey) || '{}');
            const userTwstockDaily = JSON.parse(localStorage.getItem(userTwstockDailyKey) || '{}');
            allUsersData[user.id] = {
                user: user,
                data: userAccounts,
                settings: userSettings,
                journal: userJournal,
                fixedTransfers: userFixedTransfers,
                dateNotes: userDateNotes,
                assetHistory: userAssetHistory,
                dividendRecords: userDividendRecords,
                twstockDaily: userTwstockDaily
            };
        });

        return {
            version: '2.0',
            users: users,
            usersData: allUsersData,
            exportDate: new Date().toISOString()
        };
    }

    // Google Drive 相關函數已完全移除，改用 Firebase

    async function testCloudBackup() {
        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 備份中...';
        btn.disabled = true;

        try {
            await performCloudBackup();
            alert('備份完成！');
            if(window.cloudBackupModal) {
                const lastTimeEl = document.getElementById('cloudBackupLastTime');
                if(lastTimeEl) {
                    lastTimeEl.textContent = settings.cloudBackupLastTime ? new Date(settings.cloudBackupLastTime).toLocaleString('zh-TW') : '尚未備份';
                }
            }
        } catch(e) {
            alert('備份失敗：' + e.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
