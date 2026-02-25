const CRYPTO_API = "https://pay.crypt.bot/api";

const requireEnv = (value, name) => {
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
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
    requireEnv(CRYPTO_BOT_TOKEN, "CRYPTO_BOT_TOKEN");

    const response = await fetch(`${CRYPTO_API}/createInvoice`, {
      method: "POST",
      headers: {
        "Crypto-Pay-API-Token": CRYPTO_BOT_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currency_type: "fiat",
        fiat: "RUB",
        amount: "100.00",
        description: "KomaruPromts — Вход навсегда",
        payload: `komaru_${Date.now()}`,
        expires_in: 3600,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data?.ok) {
      throw new Error(data?.error?.message || "CryptoBot error");
    }

    const invoice = data.result;
    return res.status(200).json({
      ok: true,
      invoice_id: invoice.invoice_id,
      pay_url: invoice.pay_url,
      amount: invoice.amount,
      asset: invoice.asset,
      status: invoice.status,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
