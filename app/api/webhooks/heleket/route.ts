import { createHash, timingSafeEqual } from "node:crypto";
import { applyPayment } from "@/lib/db";

type HeleketWebhook = { sign?: string; order_id?: string; status?: string; [key: string]: unknown };

export async function POST(request: Request) {
  const apiKey = process.env.HELEKET_PAYMENT_API_KEY;
  if (!apiKey) return Response.json({ error: "Webhook is not configured" }, { status: 503 });

  try {
    const data = await request.json() as HeleketWebhook;
    const receivedSign = data.sign;
    if (typeof receivedSign !== "string") return Response.json({ error: "Missing signature" }, { status: 400 });

    const payload = { ...data };
    delete payload.sign;
    const serialized = JSON.stringify(payload).replaceAll("/", "\\/");
    const expectedSign = createHash("md5").update(Buffer.from(serialized).toString("base64") + apiKey).digest("hex");
    const expected = Buffer.from(expectedSign, "hex");
    const received = Buffer.from(receivedSign, "hex");
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    if (typeof payload.order_id !== "string" || !payload.order_id.startsWith("fastvpn_")) {
      return Response.json({ error: "Unknown order" }, { status: 400 });
    }

    if (!applyPayment(payload.order_id, typeof payload.status === "string" ? payload.status : "unknown")) {
      return Response.json({ error: "Unknown payment order" }, { status: 404 });
    }
    return Response.json({ received: true });
  } catch {
    return Response.json({ error: "Invalid webhook payload" }, { status: 400 });
  }
}
