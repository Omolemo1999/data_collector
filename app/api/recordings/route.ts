import { NextResponse } from "next/server";
import { ensureStorage, readRecords, writeRecords, saveAudio, RecordingRecord } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 30;

const allowedCategories = new Set(["fear", "scream", "not_fear", "background"]);
const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    await ensureStorage();
    const form = await request.formData();
    const audio = form.get("audio");
    const participantId = String(form.get("participantId") || "");
    const category = String(form.get("category") || "");
    const prompt = String(form.get("prompt") || "");
    const promptIndex = Number(form.get("promptIndex"));

    if (!(audio instanceof File)) return NextResponse.json({ error: "Audio file is required." }, { status: 400 });
    if (!participantId || participantId.length > 80) return NextResponse.json({ error: "Invalid participant ID." }, { status: 400 });
    if (!allowedCategories.has(category)) return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    if (!prompt || !Number.isInteger(promptIndex)) return NextResponse.json({ error: "Invalid prompt data." }, { status: 400 });
    if (audio.size <= 0 || audio.size > MAX_BYTES) return NextResponse.json({ error: "Audio file is empty or too large." }, { status: 400 });

    const safeParticipant = participantId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const extension = audio.type.includes("mp4") ? "mp4" : "webm";
    const id = crypto.randomUUID();
    const filename = `${safeParticipant}_${String(promptIndex + 1).padStart(2, "0")}_${id}.${extension}`;
    const relativePath = `${category}/${filename}`;

    await saveAudio(relativePath, new Uint8Array(await audio.arrayBuffer()), audio.type || "audio/webm");

    const record: RecordingRecord = {
      id, participantId: safeParticipant,
      category: category as RecordingRecord["category"], prompt, promptIndex,
      filename, relativePath, mimeType: audio.type || "audio/webm", size: audio.size,
      createdAt: new Date().toISOString(), status: "pending", points: 0
    };
    const records = await readRecords();
    records.push(record);
    await writeRecords(records);
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not save recording." }, { status: 500 });
  }
}
