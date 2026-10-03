import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, getUserForSession } from "@/lib/db";

export const SESSION_COOKIE = "fastvpn_session";
export async function currentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return token ? getUserForSession(token) : null;
}
export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
export function newSessionToken(userId: string) { return createSession(userId); }
