import { cookies } from "next/headers";
import { authenticate, createAccount, deleteSession, getUserForSession } from "@/lib/db";
import { SESSION_COOKIE, newSessionToken } from "@/lib/session";

const sessionOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 30 };

export async function GET() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const user = token ? getUserForSession(token) : null;
  return Response.json({ user });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { action?: string; name?: string; email?: string; password?: string };
    const store = await cookies();
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== new URL(request.url).host) return Response.json({ error: "Cross-origin request blocked." }, { status: 403 });
    if (body.action === "logout") {
      const token = store.get(SESSION_COOKIE)?.value;
      if (token) deleteSession(token);
      store.delete(SESSION_COOKIE);
      return Response.json({ ok: true });
    }
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    if (!/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    if (password.length < 8) return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });

    let user;
    if (body.action === "register") {
      const name = body.name?.trim() ?? "";
      if (name.length < 2 || name.length > 80) return Response.json({ error: "Name must be between 2 and 80 characters." }, { status: 400 });
      user = await createAccount(name, email, password);
    } else if (body.action === "login") {
      user = await authenticate(email, password);
      if (!user) return Response.json({ error: "Email or password is incorrect." }, { status: 401 });
    } else return Response.json({ error: "Unknown authentication action." }, { status: 400 });

    const token = newSessionToken(user.id);
    store.set(SESSION_COOKIE, token, sessionOptions);
    return Response.json({ user });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not complete sign in." }, { status: 400 });
  }
}
