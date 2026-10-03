# FastVPN

A dark, English-language VPN account dashboard built with Next.js 16. It uses Node.js built-in SQLite for accounts, password hashes, sessions, registered devices, subscription state, and Heleket invoices.

## Run locally

1. Use Node.js 22.13 or newer.
2. Copy `.env.example` to `.env.local` and set your Heleket merchant ID and payment API key to enable checkout.
3. Run `npm run dev` and open http://localhost:3000.
4. Configure the Heleket callback URL as `https://<your-domain>/api/webhooks/heleket`.

Accounts can be created from the sign-in screen. Passwords are scrypt-hashed. Sessions are random tokens stored hashed in SQLite and sent in HTTP-only cookies. The SQLite database defaults to `./data/fastvpn.sqlite`; set `SQLITE_DATA_DIR` to a persistent writable directory in deployment. Keep the database on a persistent volume and run a single app instance when using local SQLite.

## Heleket payments

`POST /api/payments` accepts `{ "plan": "1" | "12" | "24" }` for an authenticated user. The server signs invoice requests using the private API key. The callback handler verifies Heleket's signature and updates invoice and subscription records in SQLite. The success redirect does not grant a subscription; the verified callback does. Payments are billed in USD and Heleket presents the supported crypto payment options.

## VPN gateway integration

The account, device registry, subscriptions, and billing are dynamic. This starter does not yet operate a VPN tunnel or provisioning control plane: server locations and latency are sample presentation data, and the device list tracks account devices only. Connecting to real VPN servers requires a VPN backend (for example, a WireGuard control plane) and provisioning/revocation calls. The app deliberately does not show a fabricated IP address or mark the VPN tunnel as connected.

## Production requirements

Use HTTPS, set production Heleket credentials, keep a durable SQLite volume with backups, and add abuse controls such as login and registration rate limits. For multi-instance or serverless deployment, use a network database instead of local SQLite.
