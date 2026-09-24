import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { readRecords, writeRecords } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const id = String(body.id || "");
  const status = String(body.status || "");
  const reviewNote = String(body.reviewNote || "");

  if (!id || !["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid review request." }, { status: 400 });
  }

  const records = await readRecords();
  const record = records.find((item) => item.id === id);
  if (!record) return NextResponse.json({ error: "Recording not found." }, { status: 404 });

  record.status = status as "approved" | "rejected";
  record.points = status === "approved" ? 100 : 0;
  record.reviewNote = reviewNote.slice(0, 2000);
  record.reviewedAt = new Date().toISOString();

  await writeRecords(records);
  return NextResponse.json({ ok: true });
}