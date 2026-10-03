import { currentUser } from "@/lib/session";
import { getDashboard } from "@/lib/db";

export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  return Response.json(getDashboard(user));
}
