import { toString as qrToSvg } from "qrcode";
import { SAVE_VERSION, parseSave } from "./storage";
import type { Save } from "./model";

const ZIP_PREFIX = "SA1.";
const RAW_PREFIX = "SA0.";

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x4000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlToBytes(text: string): Uint8Array {
  const pad = text.length % 4 === 0 ? "" : "=".repeat(4 - (text.length % 4));
  const b64 = text.replaceAll("-", "+").replaceAll("_", "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deflateRaw(text: string): Promise<Uint8Array> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function inflateRaw(bytes: Uint8Array): Promise<string> {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  const stream = new Blob([copy]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Response(stream).text();
}

function childId(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const id = (value as { id?: unknown }).id;
  return typeof id === "string" && id ? id : null;
}

/** A backup code for this device. Nothing is uploaded. */
export async function exportBackup(save: Save): Promise<string> {
  const json = JSON.stringify(save);
  try {
    const bytes = await deflateRaw(json);
    return ZIP_PREFIX + bytesToBase64Url(bytes);
  } catch {
    return RAW_PREFIX + bytesToBase64Url(new TextEncoder().encode(json));
  }
}

/** Restore a code made by exportBackup. A bad code returns null and does not invent a save. */
export async function importBackup(code: string): Promise<Save | null> {
  const trimmed = code.trim().replace(/\s+/g, "");
  try {
    let json: string;
    if (trimmed.startsWith(ZIP_PREFIX)) json = await inflateRaw(base64UrlToBytes(trimmed.slice(ZIP_PREFIX.length)));
    else if (trimmed.startsWith(RAW_PREFIX)) json = new TextDecoder().decode(base64UrlToBytes(trimmed.slice(RAW_PREFIX.length)));
    else return null;
    const raw = JSON.parse(json) as unknown;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const record = raw as { version?: unknown; children?: unknown };
    if (record.version !== SAVE_VERSION || !Array.isArray(record.children) || record.children.length === 0) return null;
    const firstId = childId(record.children[0]);
    if (!firstId) return null;
    const save = parseSave(raw);
    if (save.children[0]?.id !== firstId) return null;
    return save;
  } catch {
    return null;
  }
}

/** SVG QR of the backup code, drawn on this device. Null when the code is too long to scan. */
export async function backupQrSvg(code: string): Promise<string | null> {
  try {
    const svg = await qrToSvg(code, { type: "svg", errorCorrectionLevel: "L", margin: 1 });
    const start = svg.indexOf("<svg");
    return start >= 0 ? svg.slice(start) : null;
  } catch {
    return null;
  }
}
