// ============================
// LINE 上課自動通知系統
// ============================

// ▼▼▼ 請修改以下設定 ▼▼▼
const LINE_CHANNEL_TOKEN = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_TOKEN');
const NOTIFY_DAYS_BEFORE = 3;   // 上課前幾天通知（預設 3 天）
const SHEET_NAME = '工作表1';     // 課表分頁名稱（若有改過請更新）
const LOG_SHEET_NAME = '學員登記表'; // 學員自動登記分頁名稱
// ▲▲▲ 設定到這裡結束 ▲▲▲


// ─────────────────────────────────────────
// 核心功能 1：每天自動掃描課表並發送通知
// ─────────────────────────────────────────
function checkAndNotify() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    Logger.log('找不到課表分頁：' + SHEET_NAME);
    return;
  }
  
  const data = sheet.getDataRange().getValues();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + NOTIFY_DAYS_BEFORE);
  
  let notifyCount = 0;
  
  // 從第 2 行開始（跳過標題列）
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const name = row[0];       // A 欄：學員姓名
    const classDate = row[1];  // B 欄：上課日期
    const classTime = row[2];  // C 欄：上課時間
    const userId = row[3];     // D 欄：LINE User ID
    const notified = row[4];   // E 欄：已通知
    
    // 略過空白行或已通知
    if (!name || !classDate || !userId) continue;
    if (notified === 'Y' || notified === '已通知') continue;
    
    // 比較日期
    const classDt = new Date(classDate);
    classDt.setHours(0, 0, 0, 0);
    
    if (classDt.getTime() === targetDate.getTime()) {
      // 發送 LINE 通知
      const message = buildMessage(name, classDate, classTime);
      const success = sendLineMessage(userId, message);
      
      if (success) {
        // 標記已通知
        sheet.getRange(i + 1, 5).setValue('已通知');
        notifyCount++;
        Logger.log(`✅ 已通知：${name}（${classDate} ${classTime}）`);
      } else {
        Logger.log(`❌ 通知失敗：${name}（User ID: ${userId}）`);
      }
    }
  }
  
  Logger.log(`本次執行完畢，共發送 ${notifyCount} 則通知。`);
}


// ─────────────────────────────────────────
// 核心功能 2：接收 LINE Webhook（自動登記學員 User ID）
// ─────────────────────────────────────────
function doPost(e) {
  const output = ContentService.createTextOutput('OK');
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.userId) {
      logUser(data.userId, data.displayName || '未知');
    }
  } catch(err) {}
  return output;
}


// ─────────────────────────────────────────
// 工具函式
// ─────────────────────────────────────────

// 格式化通知訊息
function buildMessage(name, classDate, classTime) {
  const dateStr = Utilities.formatDate(new Date(classDate), 'Asia/Taipei', 'MM/dd');
  return `📚 上課提醒\n\n${name} 您好！\n\n您有一堂課即將在 ${NOTIFY_DAYS_BEFORE} 天後開始：\n\n📅 日期：${dateStr}\n⏰ 時間：${classTime}\n\n請記得準時出席，期待與您相見！`;
}

// 發送 LINE Push Message
function sendLineMessage(userId, message) {
  const url = 'https://api.line.me/v2/bot/message/push';
  const payload = {
    to: userId,
    messages: [{ type: 'text', text: message }]
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + LINE_CHANNEL_TOKEN },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    if (code === 200) return true;
    Logger.log('LINE API 回應：' + code + ' - ' + response.getContentText());
    return false;
  } catch (err) {
    Logger.log('發送失敗：' + err.toString());
    return false;
  }
}

// 回覆 LINE 訊息（Webhook 用）
function replyMessage(replyToken, message) {
  const url = 'https://api.line.me/v2/bot/message/reply';
  const payload = {
    replyToken: replyToken,
    messages: [{ type: 'text', text: message }]
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + LINE_CHANNEL_TOKEN },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    UrlFetchApp.fetch(url, options);
  } catch (err) {
    Logger.log('回覆失敗：' + err.toString());
  }
}

// 取得 LINE 使用者顯示名稱
function getUserDisplayName(userId) {
  const url = 'https://api.line.me/v2/bot/profile/' + userId;
  const options = {
    method: 'get',
    headers: { 'Authorization': 'Bearer ' + LINE_CHANNEL_TOKEN },
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() === 200) {
      return JSON.parse(response.getContentText()).displayName;
    }
  } catch (err) {}
  return '未知使用者';
}

// 記錄學員到「學員登記表」
function logUser(userId, displayName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let logSheet = ss.getSheetByName(LOG_SHEET_NAME);
  
  if (!logSheet) {
    logSheet = ss.insertSheet(LOG_SHEET_NAME);
    logSheet.appendRow(['顯示名稱', 'LINE User ID', '登記時間']);
  }
  
  // 檢查是否已存在（避免重複）
  const existingData = logSheet.getDataRange().getValues();
  for (let i = 1; i < existingData.length; i++) {
    if (existingData[i][1] === userId) return; // 已存在，不重複記錄
  }
  
  logSheet.appendRow([
    displayName,
    userId,
    Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy/MM/dd HH:mm:ss')
  ]);
  
  Logger.log(`📝 新學員登記：${displayName}（${userId}）`);
}


// ─────────────────────────────────────────
// 手動測試工具（開發用）
// ─────────────────────────────────────────

// 手動執行一次通知檢查（測試用）
function manualCheck() {
  checkAndNotify();
}

// 測試發送單一訊息（填入 User ID 後執行）
function testSendMessage() {
  const testUserId = '填入你自己的 LINE User ID 來測試';
  const testMessage = '🔔 這是測試訊息，系統運作正常！';
  const result = sendLineMessage(testUserId, testMessage);
  Logger.log(result ? '✅ 測試成功！' : '❌ 測試失敗，請檢查 Token 和 User ID');
}
