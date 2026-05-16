const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// 填入你的設定
const GOOGLE_SHEET_URL = '你的 Apps Script /exec 網址';

app.post('/webhook', async (req, res) => {
  res.sendStatus(200); // 立刻回傳 200 給 LINE

  const events = req.body.events || [];
  for (const event of events) {
    const userId = event.source?.userId;
    const displayName = await getDisplayName(userId);
    if (userId) {
      // 把 User ID 傳給 Apps Script 存入試算表
      await axios.post(GOOGLE_SHEET_URL, { userId, displayName }).catch(() => {});
    }
  }
});

async function getDisplayName(userId) {
  try {
    const res = await axios.get(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: { Authorization: `Bearer ${process.env.LINE_TOKEN}` }
    });
    return res.data.displayName;
  } catch { return '未知'; }
}

app.listen(3000, () => console.log('Webhook running'));
