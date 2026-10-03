import { createHash, randomUUID } from "node:crypto";
import { createPaymentOrder, failPaymentOrder, markPaymentCreated } from "@/lib/db";
import { currentUser } from "@/lib/session";

const plans: Record<string, { amount: string; title: string }> = {
  "1": { amount: "9.99", title: "FastVPN Premium — 1 month" },
  "12": { amount: "59.99", title: "FastVPN Premium — 12 months" },
  "24": { amount: "89.99", title: "FastVPN Premium — 24 months" },
};

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in to purchase a plan." }, { status: 401 });
  const merchant = process.env.HELEKET_MERCHANT_ID;
  const apiKey = process.env.HELEKET_PAYMENT_API_KEY;
  if (!merchant || !apiKey) {
    return Response.json({ error: "Payments are not configured. Set HELEKET_MERCHANT_ID and HELEKET_PAYMENT_API_KEY." }, { status: 503 });
  }

  try {
    const { plan } = await request.json();
    const selected = plans[String(plan)];
    if (!selected) return Response.json({ error: "Unknown subscription plan." }, { status: 400 });

    const origin = new URL(request.url).origin;
    const orderId = `fastvpn_${randomUUID().replaceAll("-", "")}`;
    await createPaymentOrder(orderId, user.id, Number(plan), selected.amount);
    const payload = {
      amount: selected.amount,
      currency: "USD",
      order_id: orderId,
      url_return: origin,
      url_success: `${origin}?payment=success`,
      url_callback: `${origin}/api/webhooks/heleket`,
      lifetime: 3600,
      additional_data: selected.title,
      theme: "light",
    };
    const body = JSON.stringify(payload);
    const sign = createHash("md5").update(Buffer.from(body).toString("base64") + apiKey).digest("hex");
    const upstream = await fetch("https://api.heleket.com/v1/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json", merchant, sign },
      body,
      cache: "no-store",
    });
    const result = await upstream.json();
    if (!upstream.ok || result.state !== 0 || !result.result?.url) {
      await failPaymentOrder(payload.order_id);
      return Response.json({ error: result.message || "Heleket could not create an invoice." }, { status: 502 });
    }
    await markPaymentCreated(payload.order_id, result.result.uuid, result.result.url);
    return Response.json({ url: result.result.url, orderId: payload.order_id });
  } catch {
    return Response.json({ error: "Could not create an invoice. Please try again." }, { status: 500 });
  }
}
