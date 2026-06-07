import express from "express";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const AI_MODEL = process.env.AI_MODEL || "openai/gpt-4o-mini";

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is missing in Render Environment Variables");
}

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const VERSION = "booster-plus-v4-multi-cart";

const SERVICE_PRICES = [
  {
    id: "facebook_followers",
    platform: "facebook",
    name: "Facebook Followers",
    unitQuantity: 1000,
    unitLabel: "1K",
    unitPrice: 14000
  },
  {
    id: "facebook_post_like",
    platform: "facebook",
    name: "Facebook Post Like",
    unitQuantity: 100,
    unitLabel: "100",
    unitPrice: 2000
  },
  {
    id: "facebook_post_like_myanmar",
    platform: "facebook",
    name: "Facebook Post Like Myanmar Names",
    unitQuantity: 100,
    unitLabel: "100",
    unitPrice: 4000
  },
  {
    id: "facebook_video_views",
    platform: "facebook",
    name: "Facebook Video Views",
    unitQuantity: 1000,
    unitLabel: "1K",
    unitPrice: 4000
  },
  {
    id: "tiktok_followers",
    platform: "tiktok",
    name: "TikTok Followers",
    unitQuantity: 1000,
    unitLabel: "1K",
    unitPrice: 17000
  },
  {
    id: "tiktok_likes",
    platform: "tiktok",
    name: "TikTok Likes",
    unitQuantity: 1000,
    unitLabel: "1K",
    unitPrice: 9000
  },
  {
    id: "tiktok_video_views",
    platform: "tiktok",
    name: "TikTok Video Views",
    unitQuantity: 1000,
    unitLabel: "1K",
    unitPrice: 5000
  }
];

const SERVICE_BY_ID = Object.fromEntries(SERVICE_PRICES.map((service) => [service.id, service]));
const BURMESE_WITH = "\u1014\u1032\u1037";

const welcomeText = `မင်္ဂလာပါရှင့် 🙏
Booster Plus မှ ကြိုဆိုပါတယ် 🚀

ဘယ် Service လေးလိုချင်ပါသလဲ?`;

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

function mainButtons() {
  return [
    [{ text: "📘 Facebook Services", callback_data: "facebook" }],
    [{ text: "🎵 TikTok Services", callback_data: "tiktok" }],
    [{ text: "📞 Contact Admin", url: "https://t.me/pyaephyomyat_lv999" }]
  ];
}

async function sendMessage(chatId, text, buttons = null) {
  const payload = { chat_id: chatId, text };

  if (buttons) {
    payload.reply_markup = { inline_keyboard: buttons };
  }

  try {
    await axios.post(`${TELEGRAM_API}/sendMessage`, payload);
  } catch (err) {
    console.error("Telegram sendMessage error:", err.response?.data || err.message);
  }
}

function normalizeOrderText(text) {
  return text
    .toLowerCase()
    .replace(/\u00a0/g, " ")
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasPlatform(text) {
  return /\b(facebook|face\s*book|fb)\b/.test(text) || /\b(tiktok|tik\s*tok|tt)\b/.test(text);
}

function hasServiceKeyword(text) {
  return /\b(followers?|likes?|views?|post|video|myanmar|names?)\b/.test(text);
}

function detectPlatform(text, fallback = null) {
  if (/\b(facebook|face\s*book|fb)\b/.test(text)) return "facebook";
  if (/\b(tiktok|tik\s*tok|tt)\b/.test(text)) return "tiktok";
  return fallback;
}

function detectServiceId(text, platform) {
  const hasFollowers = /\bfollowers?\b/.test(text);
  const hasLikes = /\blikes?\b/.test(text);
  const hasViews = /\bviews?\b/.test(text);
  const hasMyanmarNames = /\bmyanmar\b/.test(text) && /\bnames?\b/.test(text);

  if (platform === "facebook") {
    if (hasFollowers) return "facebook_followers";
    if (hasLikes && hasMyanmarNames) return "facebook_post_like_myanmar";
    if (hasLikes) return "facebook_post_like";
    if (hasViews) return "facebook_video_views";
  }

  if (platform === "tiktok") {
    if (hasFollowers) return "tiktok_followers";
    if (hasLikes) return "tiktok_likes";
    if (hasViews) return "tiktok_video_views";
  }

  return null;
}

function parseQuantity(text) {
  const quantityMatch = text.match(/\b(\d{1,3}(?:,\d{3})+|\d+(?:[.,]\d+)?)\s*(k)?\b/i);
  if (!quantityMatch) return null;

  let numberText = quantityMatch[1];
  if (/^\d{1,3}(,\d{3})+$/.test(numberText)) {
    numberText = numberText.replace(/,/g, "");
  } else {
    numberText = numberText.replace(",", ".");
  }

  const value = Number.parseFloat(numberText);
  if (!Number.isFinite(value) || value <= 0) return null;

  return Math.round(value * (quantityMatch[2] ? 1000 : 1));
}

function calculatePrice(service, quantity) {
  return Math.round((quantity / service.unitQuantity) * service.unitPrice);
}

function splitOrderClauses(text) {
  const connectorPattern = new RegExp(`\\s+and\\s+|\\s*${BURMESE_WITH}\\s*|\\s*[&+]\\s*|\\s*;\\s*`, "i");
  return text.split(connectorPattern).map((part) => part.trim()).filter(Boolean);
}

function parseOrderItems(userText) {
  const normalized = normalizeOrderText(userText);
  const clauses = splitOrderClauses(normalized);
  const hasQuantity = parseQuantity(normalized) !== null;
  const orderLike = (hasServiceKeyword(normalized) && (hasPlatform(normalized) || hasQuantity)) || (hasPlatform(normalized) && hasQuantity);
  const items = [];
  let unclear = false;
  let lastPlatform = null;

  for (const clause of clauses) {
    const platform = detectPlatform(clause, lastPlatform);
    const quantity = parseQuantity(clause);
    const serviceId = platform ? detectServiceId(clause, platform) : null;
    const clauseLooksLikeOrder = hasServiceKeyword(clause) || hasPlatform(clause) || quantity;

    if (serviceId && quantity) {
      const service = SERVICE_BY_ID[serviceId];
      items.push({
        service,
        quantity,
        price: calculatePrice(service, quantity)
      });
      lastPlatform = platform;
      continue;
    }

    if (clauseLooksLikeOrder && orderLike) {
      unclear = true;
    }

    if (platform) {
      lastPlatform = platform;
    }
  }

  return {
    items,
    isOrderLike: orderLike || items.length > 0,
    unclear: unclear || (orderLike && items.length === 0)
  };
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatQuantity(quantity) {
  if (quantity >= 1000 && quantity % 1000 === 0) {
    return `${formatNumber(quantity / 1000)}K`;
  }

  if (quantity > 1000) {
    const kValue = quantity / 1000;
    return `${formatNumber(Number(kValue.toFixed(2)))}K`;
  }

  return formatNumber(quantity);
}

function buildOrderSummary(items) {
  const lines = items.map((item, index) => {
    const unitPrice = `${formatNumber(item.service.unitPrice)} Ks / ${item.service.unitLabel}`;
    return `${index + 1}. ${item.service.name} - ${formatQuantity(item.quantity)} (${unitPrice}) = ${formatNumber(item.price)} Ks`;
  });
  const total = items.reduce((sum, item) => sum + item.price, 0);

  return `Order Summary\n\n${lines.join("\n")}\n\nTotal Price: ${formatNumber(total)} Ks`;
}

function unclearOrderText() {
  return "Order message is unclear. Please choose the service and quantity again, for example: TikTok followers 1K and TikTok likes 2K.";
}

async function saveCustomer(msg) {
  try {
    const user = msg.from;

    const { error } = await supabase.from("customers").upsert(
      {
        telegram_id: user.id,
        username: user.username || null,
        first_name: user.first_name || null
      },
      { onConflict: "telegram_id" }
    );

    if (error) console.error("Supabase saveCustomer error:", error);
  } catch (err) {
    console.error("saveCustomer crash:", err.message);
  }
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
Return only one word:
facebook
tiktok
public_note
waiting_note
admin
unknown

Facebook Followers 1K = 14000 Ks
Facebook Post Like 100 = 2000 Ks
Facebook Post Like Myanmar Names 100 = 4000 Ks
Facebook Video Views 1K = 4000 Ks
TikTok Followers 1K = 17000 Ks
TikTok Likes 1K = 9000 Ks
TikTok Video Views 1K = 5000 Ks

FB/Facebook/follower/like/Myanmar name/view/page/post => facebook.
TikTok/tt/tiktok like/follower/view => tiktok.
Private/public/profile lock => public_note.
Waiting/how long/delay => waiting_note.
Admin/contact/human => admin.
Other => unknown.`
          },
          { role: "user", content: userText }
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
  const text = msg.text?.toLowerCase().trim() || "";

  await saveCustomer(msg);

  if (["/start", "hi", "hello", "hey", "မင်္ဂလာပါ"].includes(text)) {
    return sendMessage(chatId, welcomeText, mainButtons());
  }

  const order = parseOrderItems(text);

  if (order.unclear) {
    return sendMessage(chatId, unclearOrderText(), mainButtons());
  }

  if (order.items.length > 0) {
    return sendMessage(chatId, buildOrderSummary(order.items), mainButtons());
  }

  if (text.includes("facebook") || text.includes("fb") || text.includes("ဖေ့")) {
    return sendMessage(chatId, SERVICES.facebook, mainButtons());
  }

  if (text.includes("tiktok") || text.includes("tt") || text.includes("တစ်တော့")) {
    return sendMessage(chatId, SERVICES.tiktok, mainButtons());
  }

  const intent = await askAI(text);

  if (intent === "facebook") return sendMessage(chatId, SERVICES.facebook, mainButtons());
  if (intent === "tiktok") return sendMessage(chatId, SERVICES.tiktok, mainButtons());

  if (intent === "public_note") {
    return sendMessage(chatId, "📌 Profile / Page / Post / Video ကို Public ဖွင့်ထားမှ Order တင်လို့ရပါတယ်ရှင့်။", mainButtons());
  }

  if (intent === "waiting_note") {
    return sendMessage(chatId, "⏳ Order processing time က 3 ရက်ကျော် ကြာနိုင်ပါတယ်ရှင့်။ စိတ်အေးအေးထားပြီး စောင့်ပေးပါနော် 💙", mainButtons());
  }

  if (intent === "admin") {
    return sendMessage(chatId, "📞 Admin ကို ဆက်သွယ်ရန် အောက်က Contact Admin ခလုတ်ကို နှိပ်ပေးပါရှင့်။", mainButtons());
  }

  return sendMessage(chatId, "နားမလည်သေးပါရှင့်။ Facebook Service လား TikTok Service လား ရွေးပေးပါနော် 💙", mainButtons());
}

app.post("/webhook", async (req, res) => {
  res.sendStatus(200);

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
    }
  } catch (err) {
    console.error("Webhook error:", err.response?.data || err.message);
  }
});

app.get("/", (req, res) => {
  res.send(`Booster Plus Bot is running. ${VERSION}`);
});

app.get("/health", (req, res) => {
  res.send(`OK - ${VERSION}`);
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Booster Plus Bot running on port ${PORT}`);
  console.log(`Running version: ${VERSION}`);
});
