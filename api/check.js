const CRYPTO_API = "https://pay.crypt.bot/api";
const TELEGRAM_API = "https://api.telegram.org";

const requireEnv = (value, name) => {
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
};

const getInvoice = async (invoiceId, token) => {
  const response = await fetch(`${CRYPTO_API}/getInvoices?invoice_ids=${invoiceId}`, {
    headers: {
      "Crypto-Pay-API-Token": token,
    },
  });

  const data = await response.json();
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error?.message || "CryptoBot error");
  }

  return data.result.items?.[0];
};

const createInviteLink = async (channelId, token) => {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const response = await fetch(`${TELEGRAM_API}/bot${token}/createChatInviteLink`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: Number(channelId),
      member_limit: 1,
      expire_date: expiresAt,
      name: `komaru-${Date.now()}`,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data?.ok) {
    throw new Error(data?.description || "Telegram API error");
  }

  return data.result.invite_link;
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  try {
    const CRYPTO_BOT_TOKEN = process.env.CRYPTO_BOT_TOKEN;
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHANNEL_ID = process.env.CHANNEL_ID;

    requireEnv(CRYPTO_BOT_TOKEN, "CRYPTO_BOT_TOKEN");
    requireEnv(TELEGRAM_BOT_TOKEN, "TELEGRAM_BOT_TOKEN");
    requireEnv(CHANNEL_ID, "CHANNEL_ID");

    const { invoice_id } = req.body || {};
    if (!invoice_id) {
      return res.status(400).json({ ok: false, message: "invoice_id required" });
    }

    const invoice = await getInvoice(invoice_id, CRYPTO_BOT_TOKEN);
    if (!invoice) {
      return res.status(404).json({ ok: false, message: "Invoice not found" });
    }

    if (invoice.status !== "paid") {
      return res.status(200).json({ ok: true, paid: false, status: invoice.status });
    }

    const inviteLink = await createInviteLink(CHANNEL_ID, TELEGRAM_BOT_TOKEN);
    return res.status(200).json({ ok: true, paid: true, invite_link: inviteLink });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
