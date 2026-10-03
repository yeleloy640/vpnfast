import { addDevice, getDashboard, removeDevice } from "@/lib/db";
import { currentUser } from "@/lib/session";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  const dashboard = await getDashboard(user);
  if (dashboard.devices.length >= 5) return Response.json({ error: "Your plan allows up to five devices." }, { status: 403 });
  const { name, platform } = await request.json() as { name?: string; platform?: string };
  if (!name?.trim() || !platform?.trim()) return Response.json({ error: "Device name and platform are required." }, { status: 400 });
  const id = await addDevice(user.id, name.trim().slice(0, 80), platform.trim().slice(0, 40));
  return Response.json({ id }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !await removeDevice(user.id, id)) return Response.json({ error: "Device not found." }, { status: 404 });
  return Response.json({ ok: true });
}
