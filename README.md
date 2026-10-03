# FastVPN

A dark, English-language VPN account dashboard built with Next.js 16 and Cloudflare Workers. Cloudflare D1 stores accounts, scrypt password hashes, sessions, registered devices, subscription state, and Heleket invoices.

## Cloudflare Workers Builds settings

In **Workers & Pages → your Worker → Settings → Builds**, set:

- **Build command:** `npm run cf:build`
- **Deploy command:** `npm run cf:deploy`

The plain `npm run build` only creates the standard Next.js build. It does not generate `.open-next`. The `cf:build` command creates the Worker bundle; `cf:deploy` also rebuilds that bundle before deploying, so deployment does not depend on Workers Builds carrying generated files between its build and deploy steps. If logs still show `Executing user deploy command: npx wrangler deploy`, update and save the Deploy command above in the Cloudflare dashboard; the repository cannot change that dashboard setting.

## Cloudflare setup

1. Use Node.js 20 or newer.
2. Create the D1 database: `npx wrangler d1 create vpn-fast-db`.
3. Copy the `database_id` returned by Wrangler into `wrangler.jsonc`, replacing the local placeholder.
4. Apply the schema locally with `npx wrangler d1 migrations apply vpn-fast-db --local`; use `--remote` to initialize the production database.
5. Copy `.env.example` to `.dev.vars` for local Cloudflare preview, or configure `HELEKET_MERCHANT_ID` and `HELEKET_PAYMENT_API_KEY` as Worker secrets.
6. Run `npm run dev` for Next.js development, or `npm run preview` to run in the local Workers runtime.
7. Configure the Heleket callback URL as `https://<your-domain>/api/webhooks/heleket`.

The `DB` binding and migration directory are configured in `wrangler.jsonc`. `migrations/0001_init.sql` creates the D1 schema and a trigger that activates a subscription exactly once when a pending invoice changes to paid. D1 starts empty; the previous local SQLite file is not automatically copied to Cloudflare.

## Heleket payments

`POST /api/payments` accepts `{ "plan": "1" | "12" | "24" }` for an authenticated user. The server signs invoice requests with the private API key. The callback handler verifies Heleket's signature and records the payment in D1. A D1 trigger extends the subscription when payment status changes to paid; returning from checkout does not activate a subscription. Payments are billed in USD and Heleket presents supported cryptocurrency options.

## VPN gateway integration

Accounts, devices, subscriptions, and billing are dynamic. This project does not yet operate a VPN tunnel or provisioning control plane: server locations and latency are presentation data, and the device list tracks account devices only. Real VPN connectivity requires VPN servers (such as a WireGuard control plane) and device provisioning/revocation integrations. The interface does not claim the tunnel is connected.
