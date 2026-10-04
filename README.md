# FastVPN

A dark, English-language VPN account dashboard built with Next.js 16 and MongoDB. MongoDB stores accounts, scrypt password hashes, sessions, registered devices, subscription state, and Heleket invoices.

## Local development

1. Use Node.js 20 or newer and install dependencies with `npm install`.
2. Create a MongoDB database, locally or with MongoDB Atlas.
3. Copy `.env.example` to `.env.local` and set `MONGODB_URI` and `MONGODB_DATABASE`.
4. Run `npm run dev` and open the local URL printed by Next.js.

The app creates its indexes on first database use. Sessions expire automatically. For production, configure the same environment variables on your Node.js host, then use `npm run build` and `npm start`.

## Heleket payments

Set `HELEKET_MERCHANT_ID` and `HELEKET_PAYMENT_API_KEY` in the server environment. `POST /api/payments` accepts `{ "plan": "1" | "12" | "24" }` for an authenticated user. The server signs invoice requests with the private API key. Configure the Heleket callback URL as `https://<your-domain>/api/webhooks/heleket`. The callback verifies Heleket's signature and updates the payment and subscription in MongoDB; returning from checkout does not activate a subscription. Payments are billed in USD and Heleket presents supported cryptocurrency options.

## VPN gateway integration

Accounts, devices, subscriptions, and billing are dynamic. This project does not yet operate a VPN tunnel or provisioning control plane: server locations and latency are presentation data, and the device list tracks account devices only. Real VPN connectivity requires VPN servers (such as a WireGuard control plane) and device provisioning/revocation integrations. The interface does not claim the tunnel is connected.
