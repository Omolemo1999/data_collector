import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { readRecords } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const records = await readRecords();
  records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ records });
}