// ====== constants.js ======
// 所有常數、儲存 key、顏色定義

    const STORAGE_KEY_DATA = 'my_assets_stable_data';
    const STORAGE_KEY_SETTINGS = 'my_assets_stable_settings';
    const STORAGE_KEY_USERS = 'my_assets_users';
    const STORAGE_KEY_CURRENT_USER = 'my_assets_current_user';
    const STORAGE_KEY_FIXED_TRANSFERS = 'my_assets_fixed_transfers';
    const STORAGE_KEY_FIXED_EXPENSE_ACCOUNTS = 'my_assets_fixed_expense_accounts';
    const STORAGE_KEY_FIXED_INCOME_ACCOUNTS = 'my_assets_fixed_income_accounts';
    const STORAGE_KEY_FIXED_EXPENSES = 'my_assets_fixed_expenses';
    const STORAGE_KEY_FIXED_INCOMES = 'my_assets_fixed_incomes';
    const STORAGE_KEY_JOURNAL = 'my_assets_journal'; // 收入、支出、轉帳記錄
    const STORAGE_KEY_DATE_NOTES = 'my_assets_date_notes'; // 日期記事
    const STORAGE_KEY_ASSET_HISTORY = 'my_assets_history'; // 資產每日歷史快照
    const STORAGE_KEY_DIVIDEND_RECORDS = 'my_assets_dividend_records'; // 除權息：持股股數、手動輸入金額
    const STORAGE_KEY_TWSTOCK_DAILY = 'my_assets_twstock_daily'; // 台股每日持股快照（用於除權息歷史自動帶入股數）
    
    // 銀行代碼資料（包含銀行名稱和代碼）
    const BANK_DATA = [
        { name: '台灣銀行', code: '004' },
        { name: '土地銀行', code: '005' },
        { name: '合作金庫銀行', code: '006' },
        { name: '第一銀行', code: '007' },
        { name: '華南銀行', code: '008' },
        { name: '彰化銀行', code: '009' },
        { name: '上海商業儲蓄銀行', code: '011' },
        { name: '台北富邦銀行', code: '012' },
        { name: '國泰世華銀行', code: '013' },
        { name: '高雄銀行', code: '016' },
        { name: '兆豐銀行', code: '017' },
        { name: '花旗銀行', code: '021' },
        { name: '王道銀行', code: '048' },
        { name: '台灣中小企業銀行', code: '050' },
        { name: '渣打銀行', code: '052' },
        { name: '台中銀行', code: '053' },
        { name: '京城銀行', code: '054' },
        { name: '匯豐銀行', code: '081' },
        { name: '瑞興銀行', code: '101' },
        { name: '華泰銀行', code: '102' },
        { name: '新光銀行', code: '103' },
        { name: '陽信銀行', code: '108' },
        { name: '板信商業銀行', code: '118' },
        { name: '三信商業銀行', code: '147' },
        { name: '中華郵政', code: '700' },
        { name: '聯邦銀行', code: '803' },
        { name: '遠東銀行', code: '805' },
        { name: '元大銀行', code: '806' },
        { name: '永豐銀行', code: '807' },
        { name: '玉山銀行', code: '808' },
        { name: '凱基銀行', code: '809' },
        { name: '星展銀行', code: '810' },
        { name: '台新銀行', code: '812' },
        { name: '安泰銀行', code: '816' },
        { name: '中國信託銀行', code: '822' },
        { name: '將來銀行', code: '823' },
        { name: 'LINE Bank', code: '824' },
        { name: '樂天銀行', code: '826' },
        { name: '其他', code: '' }
    ];
    
    const GOOGLE_DRIVE_FOLDER_NAME = 'Monee';
    
    // 預設頭像（使用 emoji 或圖示）
    const DEFAULT_AVATARS = [
        '👤', '👨', '👩', '🧑', '👨‍💼', '👩‍💼'
    ];
    
    // 總覽圓餅圖專用：四類彼此區分（錢包、台股不可同色）
    const OVERVIEW_COLORS = { 'bank': '#6bb5ff', 'stock': '#d9a8f8', 'twstock': '#7ee58f', 'crypto': '#ffcc80' };
    // 折線圖等使用（與 OVERVIEW_COLORS 一致）
    const TYPE_COLORS = { 'bank': '#6bb5ff', 'stock': '#d9a8f8', 'twstock': '#7ee58f', 'crypto': '#ffcc80', 'debt': '#ff453a' };
    const TYPE_NAMES = { 'bank': '錢包', 'stock': '美股', 'twstock': '台股', 'crypto': '加密貨幣', 'debt': '負債' };
    
    // 為每個分類定義專屬主題配色（20色，同色系只保留一個，彼此對比明顯）
    const CHART_ITEM_COLOR_PALETTES = {
        'bank': [
            '#6bb5ff',  '#ffeb80',  '#7ee58f',  '#ffa8a0',  '#d9a8f8',  '#ffcc80',
            '#00d4aa',  '#ff6b9d',  '#a8a0e8',  '#ffbf00',  '#c4a574',  '#22b8cf',
            '#f43f5e',  '#20c997',  '#8b5cf6',  '#ff7f50',  '#b8e986',  '#748ffc',
            '#ff922b',  '#868e96'
        ],
        'stock': [
            '#d9a8f8',  '#7ee58f',  '#6bb5ff',  '#ffa8a0',  '#ffeb80',  '#ffcc80',
            '#00d4aa',  '#ff6b9d',  '#a8a0e8',  '#ffbf00',  '#c4a574',  '#22b8cf',
            '#f43f5e',  '#20c997',  '#8b5cf6',  '#ff7f50',  '#b8e986',  '#748ffc',
            '#ff922b',  '#868e96'
        ],
        'twstock': [
            '#6bb5ff',  '#7ee58f',  '#ffa8a0',  '#80ffff',  '#ffeb80',  '#ffcc80',
            '#00d4aa',  '#ff6b9d',  '#a8a0e8',  '#ffbf00',  '#c4a574',  '#22b8cf',
            '#f43f5e',  '#20c997',  '#8b5cf6',  '#ff7f50',  '#b8e986',  '#748ffc',
            '#ff922b',  '#868e96'
        ],
        'crypto': [
            '#ffcc80',  '#80ffff',  '#ffeb80',  '#7ee58f',  '#ffa8a0',  '#d9a8f8',
            '#00d4aa',  '#ff6b9d',  '#a8a0e8',  '#ffbf00',  '#c4a574',  '#22b8cf',
            '#f43f5e',  '#20c997',  '#8b5cf6',  '#ff7f50',  '#b8e986',  '#748ffc',
            '#ff922b',  '#868e96'
        ]
    };
    
    // 統一的備用顏色（當分類未定義時使用）
    const CHART_ITEM_COLORS_FALLBACK = [
        '#6bb5ff',  '#d9a8f8',  '#ffcc80',  '#7ee58f',  '#ffa8a0',  '#ffeb80',
        '#00d4aa',  '#ff6b9d',  '#a8a0e8',  '#ffbf00',  '#c4a574',  '#22b8cf',
        '#f43f5e',  '#20c997',  '#8b5cf6',  '#ff7f50',  '#b8e986',  '#748ffc',
        '#ff922b',  '#868e96'
    ];

    const CHART_ANIMATION_CONFIG = {
        animationType: 'switch',
        duration: 400,
        easing: 'easeOutQuart'
    };

    // Page Swiper
    const PAGE_TYPES = ['overview', 'bank', 'stock', 'twstock', 'crypto'];

    const PAGE_NAMES = ['總覽', '錢包', '美股', '台股', '加密貨幣'];
