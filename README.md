# 📚 LINE 上課自動通知系統

自動在上課前 3 天發送 LINE 通知給學員，並支援影片自動上傳 Google Drive 後回傳連結。

## ✨ 功能

- 📅 上課前 3 天自動發 LINE 通知給學員
- 📹 學員傳影片給 Bot，自動上傳 Google Drive 並回傳分享連結
- 📝 學員傳訊息給 Bot 時自動登記 LINE User ID

---

## 🏗️ 系統架構

```
Google Sheets（課表）
        ↓
Apps Script（每天 09:00 自動掃描）
        ↓
LINE Messaging API（發送通知給學員）

學員傳影片給 Bot
        ↓
Render.com Webhook（接收並處理）
        ↓
Google Drive（自動上傳）
        ↓
LINE Bot（回傳分享連結給學員）
```

---

## 📋 前置需求

開始之前請先準備好以下帳號：

| 服務 | 用途 | 費用 |
|------|------|------|
| [Google 帳號](https://google.com) | Sheets、Drive、Apps Script | 免費 |
| [LINE Developers](https://developers.line.biz) | Messaging API | 免費 |
| [GitHub](https://github.com) | 存放程式碼 | 免費 |
| [Render.com](https://render.com) | Webhook 伺服器 | 免費 |
| [Google Cloud Console](https://console.cloud.google.com) | Drive API | 免費 |

---

## 🚀 安裝步驟

### STEP 1：建立 LINE Official Account 並開啟 Messaging API

**1-1 建立官方帳號**
1. 前往 [LINE Official Account Manager](https://manager.line.biz/)
2. 用個人 LINE 帳號登入
3. 點「建立」→ 填寫帳號名稱（例如：○○ 教室）→ 選「個人」類型 → 完成建立

**1-2 開啟 Messaging API**
1. 進入帳號後台 → 左側「設定」→「Messaging API」
2. 點「啟用 Messaging API」→ 選擇或建立 Provider → 確認啟用

**1-3 取得 Channel Access Token**
1. 前往 [LINE Developers Console](https://developers.line.biz/console/)
2. 點你的 Provider → 選 Messaging API Channel
3. 點「Messaging API」頁籤 → 滑到最下方「Channel access token」
4. 點「Issue」→ 複製這串 Token（稍後會用到）

---

### STEP 2：建立 Google Sheets 課表

1. 建立新的 Google 試算表，命名為「上課通知系統」
2. 將預設分頁重新命名為 `Sheet1`（對分頁標籤按右鍵 → 重新命名）
3. 第一行填入以下標題：

| A 欄 | B 欄 | C 欄 | D 欄 | E 欄 |
|------|------|------|------|------|
| 學員姓名 | 上課日期 | 上課時間 | LINE User ID | 已通知 |

4. 選取 B 欄 → 上方選單「格式」→「數字」→「日期」（確保日期格式正確）

---

### STEP 3：設定 Apps Script

**3-1 開啟 Apps Script**
1. Google Sheets 上方選單：「擴充功能」→「Apps Script」
2. 刪除預設的空白程式碼

**3-2 貼入程式碼**

將 `apps-script/Code.gs` 的完整內容複製貼入，然後儲存。

**3-3 設定指令碼屬性（存放 Token，避免外洩）**
1. Apps Script 左側齒輪圖示「專案設定」
2. 滑到最下方「指令碼屬性」→「新增指令碼屬性」
3. 填入以下屬性：

| 屬性名稱 | 值 |
|---------|-----|
| `LINE_CHANNEL_TOKEN` | 你在 STEP 1 取得的 Channel Access Token |

4. 點「儲存指令碼屬性」

**3-4 手動執行一次完成 Google 授權**
1. 上方函式選單選「`manualCheck`」→ 點「▶️ 執行」
2. 出現授權視窗 → 點「審查權限」→ 選你的 Google 帳號
3. 出現「Google 尚未驗證這個應用程式」→ 點左下「進階」→「前往（專案名稱）」
4. 點「允許」

**3-5 部署為網路應用程式**
1. 右上角「部署」→「新增部署」
2. 選擇類型：網路應用程式
3. 設定：
   - 執行身分：**我**
   - 誰可以存取：**所有人**
4. 點「部署」→ 複製「網路應用程式網址」（結尾為 `/exec`）

---

### STEP 4：設定 Google Drive API

**4-1 建立 Google Cloud 專案**
1. 前往 [Google Cloud Console](https://console.cloud.google.com)
2. 上方「選取專案」→「新增專案」→ 名稱填 `line-drive` → 「建立」

**4-2 啟用 Drive API**
1. 左側「API 和服務」→「程式庫」
2. 搜尋 `Google Drive API` → 點進去 → 「啟用」

**4-3 建立 Service Account**
1. 左側「API 和服務」→「憑證」→「建立憑證」→「服務帳戶」
2. 名稱填 `line-drive-bot` → 「建立並繼續」→ 一路點「完成」
3. 點剛建立的服務帳戶 → 上方「金鑰」頁籤
4. 「新增金鑰」→「建立新的金鑰」→ 選 **JSON** → 下載檔案

**4-4 建立 Google Drive 共用資料夾**
1. 打開 [Google Drive](https://drive.google.com) → 新增資料夾，命名「學員影片」
2. 對資料夾按右鍵 →「共用」
3. 打開剛下載的 JSON 檔，找到 `client_email` 欄位，複製該 email 地址
4. 貼到共用對象欄位，權限選「編輯者」→「傳送」
5. 對資料夾按右鍵 →「取得連結」，複製網址中的資料夾 ID：
   ```
   https://drive.google.com/drive/folders/【複製這串ID】
   ```

---

### STEP 5：部署 Render Webhook 伺服器

**5-1 Fork 或建立 GitHub Repository**
1. 前往 [GitHub](https://github.com) → 新增 Repository，命名 `line-webhook`
2. 勾選「Add a README file」→「Create repository」
3. 依序新增以下檔案（點「Add file」→「Create new file」）：
   - `package.json`（內容見本 repo）
   - `index.js`（內容見本 repo，並填入你的 Apps Script 網址）

**5-2 部署到 Render**
1. 前往 [Render.com](https://render.com) → 用 GitHub 登入
2. 點「New」→「Web Service」→ 連結你的 GitHub repo
3. 設定：
   - Build Command：`npm install`
   - Start Command：`npm start`
4. 新增以下環境變數：

| Key | Value |
|-----|-------|
| `LINE_TOKEN` | LINE Channel Access Token |
| `GOOGLE_SERVICE_ACCOUNT` | JSON 金鑰檔的**完整內容**（複製整個 JSON 貼上） |
| `DRIVE_FOLDER_ID` | STEP 4-4 複製的資料夾 ID |

5. 點「Deploy」→ 等待出現「Your service is live 🎉」
6. 複製 Render 給你的網址（例如：`https://line-webhook-xxxx.onrender.com`）

---

### STEP 6：設定 LINE Webhook

1. 回到 [LINE Developers Console](https://developers.line.biz/console/)
2. 進入你的 Messaging API Channel → 點「Messaging API」頁籤
3. 找到「Webhook URL」→ 填入：
   ```
   https://line-webhook-xxxx.onrender.com/webhook
   ```
   （換成你自己的 Render 網址，結尾要加 `/webhook`）
4. 點「Update」→ 點「Verify」→ 應顯示 **Success**
5. 開啟「**Use webhook**」開關（確認為藍色）

---

### STEP 7：設定每日自動觸發

1. Apps Script 左側鬧鐘圖示「觸發條件」
2. 右下角「新增觸發條件」
3. 設定：
   - 執行的函式：`checkAndNotify`
   - 事件來源：以時間為準的計時器
   - 類型：日計時器
   - 時間：上午 9 時至 10 時
4. 儲存

---

## ✅ 測試系統

### 測試學員登記
1. 用你的個人 LINE 掃描官方帳號 QR Code 加好友
2. 傳送任意訊息（例如「你好」）
3. 打開 Google Sheets，確認「學員登記表」分頁出現你的名字和 User ID

### 測試上課通知
1. 把你的 User ID 填入課表 D 欄
2. B 欄日期填「今天 + 3 天」的日期
3. 回 Apps Script 執行 `manualCheck`
4. 確認 LINE 收到通知，E 欄出現「已通知」

---

## 📁 檔案說明

```
line-webhook/
├── README.md              # 本說明文件
├── index.js               # Render Webhook 伺服器主程式
├── package.json           # Node.js 套件設定
└── apps-script/
    └── Code.gs            # Google Apps Script 主程式
```

---

## ⚙️ 自訂設定

開啟 `apps-script/Code.gs`，頂部可調整以下參數：

```javascript
const NOTIFY_DAYS_BEFORE = 3;        // 上課前幾天通知（改成 1 就是前一天）
const SHEET_NAME = 'Sheet1';         // 課表分頁名稱
const LOG_SHEET_NAME = '學員登記表';  // 學員登記分頁名稱
```

---

## ❓ 常見問題

**Q：Webhook Verify 出現 302 錯誤？**
確認 Apps Script 已手動執行過（完成 Google 授權），且重新部署後使用新的 `/exec` 網址。

**Q：Webhook Verify 出現 timeout 錯誤？**
確認 `doPost` 函式在最開頭就回傳 `ContentService.createTextOutput('OK')`，避免執行過久。

**Q：LINE 通知沒有發出去？**
檢查 Apps Script「執行記錄」，確認 `LINE_CHANNEL_TOKEN` 指令碼屬性已正確設定，且 Token 沒有過期。

**Q：E 欄已標記「已通知」但想重新發送？**
把 E 欄的「已通知」清空，下次 `checkAndNotify` 執行時會重新發送。

**Q：想同時發「3 天前」和「1 天前」兩次通知？**
複製 `checkAndNotify` 函式並改名為 `checkAndNotifyOneDayBefore`，將 `NOTIFY_DAYS_BEFORE` 改為 1，再新增一個觸發條件執行該函式。

**Q：LINE Notify 可以用嗎？**
不行，LINE Notify 已於 2025 年 3 月 31 日正式終止服務，本系統改用 LINE Messaging API。

---

## 📄 授權

MIT License — 歡迎自由使用與修改，分享時請保留出處。
