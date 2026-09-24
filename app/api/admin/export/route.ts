import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { readRecords } from "@/lib/storage";

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  if (!(await isAdmin())) return new NextResponse("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "all";
  const records = await readRecords();
  const selected = status === "all" ? records : records.filter((r) => r.status === status);

  const headers = [
    "id", "participantId", "category", "prompt", "promptIndex",
    "filename", "relativePath", "mimeType", "size", "createdAt",
    "status", "points", "randValue", "reviewNote", "reviewedAt"
  ];

  const lines = [
    headers.map(csvCell).join(","),
    ...selected.map((r) => [
      r.id, r.participantId, r.category, r.prompt, r.promptIndex,
      r.filename, r.relativePath, r.mimeType, r.size, r.createdAt,
      r.status, r.points || 0, ((r.points || 0) * 0.10).toFixed(2), r.reviewNote || "", r.reviewedAt || ""
    ].map(csvCell).join(","))
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="voice-recordings-${status}.csv"`
    }
  });
}