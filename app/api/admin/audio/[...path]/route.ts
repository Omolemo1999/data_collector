import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getAudio } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  if (!(await isAdmin())) return new NextResponse("Unauthorized", { status: 401 });
  const params = await context.params;
  const parts = params.path || [];
  if (parts.length !== 2) return new NextResponse("Invalid path", { status: 400 });
  const [category, filename] = parts;
  if (!["fear", "scream", "not_fear", "background"].includes(category)) return new NextResponse("Invalid category", { status: 400 });
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) return new NextResponse("Invalid filename", { status: 400 });

  const key = `${category}/${filename}`;
  const data = await getAudio(key);
  if (!data) return new NextResponse("Not found", { status: 404 });
  const type = filename.endsWith(".mp4") ? "audio/mp4" : "audio/webm";
  return new NextResponse(data as BodyInit, { headers: { "Content-Type": type, "Cache-Control": "private, no-store" } });
}
