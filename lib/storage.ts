import { getStore } from "@netlify/blobs";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export type RecordingStatus = "pending" | "approved" | "rejected";
export type RecordingRecord = {
  id: string;
  participantId: string;
  category: "fear" | "scream" | "not_fear" | "background";
  prompt: string;
  promptIndex: number;
  filename: string;
  relativePath: string;
  mimeType: string;
  size: number;
  createdAt: string;
  status: RecordingStatus;
  reviewNote?: string;
  reviewedAt?: string;
  points: number;
};

const DB_KEY = "records.json";
const STORE_NAME = "voice-recordings";
const LOCAL_DATA_DIR = path.join(process.cwd(), "data");
const LOCAL_RECORDINGS_DIR = path.join(process.cwd(), "recordings");
const LOCAL_DB_FILE = path.join(LOCAL_DATA_DIR, DB_KEY);
const PAYOUT_KEY = "payout-profiles.json";
const LOCAL_PAYOUT_FILE = path.join(LOCAL_DATA_DIR, PAYOUT_KEY);

function useNetlifyBlob() {
  return process.env.NETLIFY === "true" || process.env.NETLIFY_DEV === "true" || Boolean(process.env.NETLIFY_BLOBS_CONTEXT);
}

export function recordingStore() {
  return getStore(STORE_NAME);
}

export async function ensureStorage() {
  if (useNetlifyBlob()) return;
  await fs.mkdir(LOCAL_DATA_DIR, { recursive: true });
  await fs.mkdir(LOCAL_RECORDINGS_DIR, { recursive: true });
  for (const category of ["fear", "scream", "not_fear", "background"]) {
    await fs.mkdir(path.join(LOCAL_RECORDINGS_DIR, category), { recursive: true });
  }
  try { await fs.access(LOCAL_DB_FILE); } catch { await fs.writeFile(LOCAL_DB_FILE, "[]", "utf8"); }
}

export async function readRecords(): Promise<RecordingRecord[]> {
  if (useNetlifyBlob()) {
    const records = await recordingStore().get(DB_KEY, { type: "json" }) as RecordingRecord[] | null;
    return Array.isArray(records) ? records : [];
  }
  await ensureStorage();
  return JSON.parse(await fs.readFile(LOCAL_DB_FILE, "utf8")) as RecordingRecord[];
}

export async function writeRecords(records: RecordingRecord[]) {
  if (useNetlifyBlob()) {
    await recordingStore().setJSON(DB_KEY, records);
    return;
  }
  await ensureStorage();
  const temp = `${LOCAL_DB_FILE}.tmp`;
  await fs.writeFile(temp, JSON.stringify(records, null, 2), "utf8");
  await fs.rename(temp, LOCAL_DB_FILE);
}

function encryptionKey(): Buffer {
  const raw = process.env.PAYOUT_ENCRYPTION_KEY;
  if (!raw) throw new Error("PAYOUT_ENCRYPTION_KEY is not configured.");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("PAYOUT_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  return key;
}
function encrypt(value: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64");
}
function decrypt(value: string): string {
  const raw = Buffer.from(value, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
}
export type PayoutProfile = {
  participantId: string; accountHolderName: string; bankName: string; accountNumber: string;
  accountType: "cheque" | "savings" | "other"; branchCode: string; createdAt: string; updatedAt: string;
};
type StoredPayout = Omit<PayoutProfile, "accountNumber"> & { accountNumberEncrypted: string };

async function readPayouts(): Promise<StoredPayout[]> {
  if (useNetlifyBlob()) {
    const rows = await recordingStore().get(PAYOUT_KEY, { type: "json" }) as StoredPayout[] | null;
    return Array.isArray(rows) ? rows : [];
  }
  await ensureStorage();
  try { return JSON.parse(await fs.readFile(LOCAL_PAYOUT_FILE, "utf8")); } catch { return []; }
}
async function writePayouts(rows: StoredPayout[]) {
  if (useNetlifyBlob()) { await recordingStore().setJSON(PAYOUT_KEY, rows); return; }
  await ensureStorage();
  await fs.writeFile(LOCAL_PAYOUT_FILE, JSON.stringify(rows, null, 2), "utf8");
}
export async function savePayoutProfile(input: Omit<PayoutProfile, "createdAt"|"updatedAt">) {
  const rows = await readPayouts(); const old = rows.find(x => x.participantId === input.participantId);
  const now = new Date().toISOString();
  const row: StoredPayout = {...input, accountNumberEncrypted: encrypt(input.accountNumber), createdAt: old?.createdAt || now, updatedAt: now};
  await writePayouts([...rows.filter(x => x.participantId !== input.participantId), row]);
}
export async function getPayoutProfile(id: string): Promise<PayoutProfile|null> {
  const row = (await readPayouts()).find(x => x.participantId === id);
  if (!row) return null;
  return {...row, accountNumber: decrypt(row.accountNumberEncrypted)} as PayoutProfile;
}

export async function saveAudio(key: string, data: Uint8Array, mimeType: string) {
  if (useNetlifyBlob()) {
    await recordingStore().set(key, data, { metadata: { contentType: mimeType } });
    return;
  }
  await ensureStorage();
  const target = path.join(LOCAL_RECORDINGS_DIR, key);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, data);
}

export async function getAudio(key: string): Promise<Uint8Array | null> {
  if (useNetlifyBlob()) {
    const result = await recordingStore().get(key, { type: "arrayBuffer" }) as ArrayBuffer | null;
    return result ? new Uint8Array(result) : null;
  }
  try {
    return new Uint8Array(await fs.readFile(path.join(LOCAL_RECORDINGS_DIR, key)));
  } catch {
    return null;
  }
}
