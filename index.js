const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const GOOGLE_SHEET_URL = process.env.GOOGLE_SHEET_URL;

// ✅ 新增：健康檢查端點（測試用）
app.get('/', (req, res) => {
  res.send('Webhook server is running ✅');
});

// ✅ 新增：完整 Log，方便除錯
app.post('/webhook', async (req, res) => {
  console.log('=== 收到 LINE 請求 ===');
  console.log(JSON.stringify(req.body, null, 2));
  
  res.sendStatus(200);

  const events = req.body.events || [];
  if (events.length === 0) {
    console.log('events 為空（Verify 用的測試請求）');
    return;
  }

  for (const event of events) {
    const userId = event.source?.userId;
    console.log('userId:', userId, '/ event type:', event.type);
    
    const displayName = await getDisplayName(userId);
    console.log('displayName:', displayName);
    
    if (userId) {
      const result = await axios.post(GOOGLE_SHEET_URL, { userId, displayName }).catch(e => {
        console.log('傳送到 Apps Script 失敗：', e.message);
      });
      console.log('Apps Script 回應：', result?.status);
    }
  }
});

async function getDisplayName(userId) {
  try {
    const res = await axios.get(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: { Authorization: `Bearer ${process.env.LINE_TOKEN}` }
    });
    return res.data.displayName;
  } catch (e) {
    console.log('取得名稱失敗：', e.message);
    return '未知';
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Webhook running on port ${PORT}`));
