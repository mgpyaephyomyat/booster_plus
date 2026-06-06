import express from "express";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const AI_MODEL = process.env.AI_MODEL || "openai/gpt-4o-mini";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const SERVICES = {
  facebook: `📘 Facebook Services

1️⃣ Facebook Followers
1K = 14,000 Ks

2️⃣ Facebook Post Like
100 = 2,000 Ks

3️⃣ Facebook Post Like Myanmar Names
100 = 4,000 Ks

4️⃣ Facebook Video Views
1K = 4,000 Ks

📌 Note:
Profile / Page / Post ကို Public ဖွင့်ထားပေးပါရှင့်။
Order တင်ပြီးနောက် 3 ရက်ကျော် ကြာနိုင်ပါတယ်။
စိတ်အေးအေးထားပြီး စောင့်ပေးပါရှင့် 💙`,

  tiktok: `🎵 TikTok Services

1️⃣ TikTok Followers
1K = 17,000 Ks

2️⃣ TikTok Likes
1K = 9,000 Ks

3️⃣ TikTok Video Views
1K = 5,000 Ks

📌 Note:
Account / Video ကို Public ဖွင့်ထားပေးပါရှင့်။
Order တင်ပြီးနောက် 3 ရက်ကျော် ကြာနိုင်ပါတယ်။
စိတ်အေးအေးထားပြီး စောင့်ပေးပါရှင့် 💙`
};

const welcomeText = `မင်္ဂလာပါရှင့် 🙏
Booster Plus မှ ကြိုဆိုပါတယ် 🚀

ဘယ် Service ကို ကြည့်ချင်ပါသလဲ?`;

async function sendMessage(chatId, text, buttons = null) {
  const payload = {
    chat_id: chatId,
    text
  };

  if (buttons) {
    payload.reply_markup = {
      inline_keyboard: buttons
    };
  }

  await axios.post(`${TELEGRAM_API}/sendMessage`, payload);
}

async function saveCustomer(msg) {
  const user = msg.from;

  await supabase.from("customers").upsert({
    telegram_id: user.id,
    username: user.username || null,
    first_name: user.first_name || null
  }, {
    onConflict: "telegram_id"
  });
}

function mainButtons() {
  return [
    [{ text: "📘 Facebook Services", callback_data: "facebook" }],
    [{ text: "🎵 TikTok Services", callback_data: "tiktok" }],
    [{ text: "📞 Contact Admin", callback_data: "admin" }]
  ];
}

async function askAI(userText) {
  if (!OPENROUTER_API_KEY) return null;

  try {
    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: AI_MODEL,
        messages: [
          {
            role: "system",
            content: `You are Booster Plus SMM bot assistant.
Detect user intent only.

Return only one of these words:
facebook
tiktok
public_note
waiting_note
admin
unknown

Services:
Facebook Followers 1K = 14000 Ks
Facebook Post Like 100 = 2000 Ks
Facebook Post Like Myanmar Names 100 = 4000 Ks
Facebook Video Views 1K = 4000 Ks
TikTok Followers 1K = 17000 Ks
TikTok Likes 1K = 9000 Ks
TikTok Video Views 1K = 5000 Ks

If user mentions FB, Facebook, follower, like, Myanmar name, view, page, post => facebook.
If user mentions TikTok, tt, tiktok like, tiktok follower, tiktok view => tiktok.
If user asks private/public/profile lock => public_note.
If user asks waiting time/how long/delay => waiting_note.
If user wants human/admin/contact => admin.
If unrelated => unknown.`
          },
          {
            role: "user",
            content: userText
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return res.data.choices?.[0]?.message?.content?.trim().toLowerCase();
  } catch (err) {
    console.error("AI error:", err.response?.data || err.message);
    return null;
  }
}

async function handleText(msg) {
  const chatId = msg.chat.id;
  const text = msg.text?.toLowerCase() || "";

  await saveCustomer(msg);

  if (["/start", "hi", "hello", "hey", "မင်္ဂလာပါ"].includes(text)) {
    return sendMessage(chatId, welcomeText, mainButtons());
  }

  if (text.includes("facebook") || text.includes("fb") || text.includes("ဖေ့")) {
    return sendMessage(chatId, SERVICES.facebook, mainButtons());
  }

  if (text.includes("tiktok") || text.includes("tt") || text.includes("တစ်တော့")) {
    return sendMessage(chatId, SERVICES.tiktok, mainButtons());
  }

  const intent = await askAI(text);

  if (intent === "facebook") {
    return sendMessage(chatId, SERVICES.facebook, mainButtons());
  }

  if (intent === "tiktok") {
    return sendMessage(chatId, SERVICES.tiktok, mainButtons());
  }

  if (intent === "public_note") {
    return sendMessage(chatId, "📌 Profile / Page / Post / Video ကို Public ဖွင့်ထားမှ Order တင်လို့ရပါတယ်ရှင့်။", mainButtons());
  }

  if (intent === "waiting_note") {
    return sendMessage(chatId, "⏳ Order processing time က 3 ရက်ကျော် ကြာနိုင်ပါတယ်ရှင့်။ စိတ်အေးအေးထားပြီး စောင့်ပေးပါနော် 💙", mainButtons());
  }

  if (intent === "admin") {
    return sendMessage(chatId, "📞 Admin ကို ဆက်သွယ်ချင်ရင် ဒီမှာ message ပို့ထားနိုင်ပါတယ်ရှင့်။", mainButtons());
  }

  return sendMessage(chatId, "နားမလည်သေးပါရှင့်။ Facebook Service လား TikTok Service လား ရွေးပေးပါနော် 💙", mainButtons());
}

app.post("/webhook", async (req, res) => {
  try {
    const update = req.body;

    if (update.message) {
      await handleText(update.message);
    }

    if (update.callback_query) {
      const chatId = update.callback_query.message.chat.id;
      const data = update.callback_query.data;

      if (data === "facebook") {
        await sendMessage(chatId, SERVICES.facebook, mainButtons());
      }

      if (data === "tiktok") {
        await sendMessage(chatId, SERVICES.tiktok, mainButtons());
      }

      if (data === "admin") {
        await sendMessage(chatId, "📞 Admin ကို ဆက်သွယ်ချင်ရင် ဒီ chat မှာ message ပို့ထားနိုင်ပါတယ်ရှင့်။");
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.get("/", (req, res) => {
  res.send("Booster Plus Bot is running.");
});

app.get("/health", (req, res) => {
  res.send("OK");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Booster Plus Bot running on port ${PORT}`);
});