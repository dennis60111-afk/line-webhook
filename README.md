# LINE 上課自動通知系統

## 專案說明
- 上課前 3 天自動發 LINE 通知給學員
- 學員傳影片給 Bot，自動上傳 Google Drive 並回傳連結

## 架構
- `index.js` - Render.com Webhook 伺服器
- `apps-script/Code.gs` - Google Apps Script（課表掃描 + 自動通知）

## 環境變數（Render）
| 變數名稱 | 說明 |
|---------|------|
| `LINE_TOKEN` | LINE Channel Access Token |
| `GOOGLE_SERVICE_ACCOUNT` | Google Service Account JSON |
| `DRIVE_FOLDER_ID` | Google Drive 資料夾 ID |

## 部署
- Webhook：部署於 Render.com
- 自動通知：Google Apps Script 每日 09:00 觸發
