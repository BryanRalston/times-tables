import { asset } from "@/lib/art";
import type { Ui } from "@/lib/i18n";
import { squisheeById, squisheeSrc } from "@/lib/squishees";

export type CosmeticId = "party-hat" | "scarf" | "bow" | "shades";
export type CosmeticSlot = "hat" | "neck" | "face";

export type Cosmetic = {
  id: CosmeticId;
  slot: CosmeticSlot;
  price: number;
  file: string;
};

/** v1 faces with Imagine-fitted composites. Never slap a generic hat on other toys. */
export const COSMETIC_FACES = ["peach", "frog", "cat", "bunny"] as const;
export type CosmeticFace = (typeof COSMETIC_FACES)[number];

export const COSMETICS: readonly Cosmetic[] = [
  { id: "party-hat", slot: "hat", price: 6, file: "party-hat.png" },
  { id: "scarf", slot: "neck", price: 5, file: "scarf.png" },
  { id: "bow", slot: "hat", price: 4, file: "bow.png" },
  { id: "shades", slot: "face", price: 8, file: "shades.png" },
];

export const COSMETIC_IDS = COSMETICS.map((c) => c.id);

const byId = new Map(COSMETICS.map((c) => [c.id, c]));
const faces = new Set<string>(COSMETIC_FACES);

export function cosmeticById(id: string): Cosmetic | undefined {
  return byId.get(id as CosmeticId);
}

export function isCosmeticId(id: string): id is CosmeticId {
  return byId.has(id as CosmeticId);
}

export function isCosmeticFace(id: string): id is CosmeticFace {
  return faces.has(id);
}

export function cosmeticPrice(id: string): number {
  return cosmeticById(id)?.price ?? 0;
}

export function canDressFace(face: string, cosmeticId?: string | null): boolean {
  return Boolean(cosmeticId && isCosmeticFace(face) && isCosmeticId(cosmeticId));
}

export function cosmeticCompositeFile(face: string, cosmeticId: string): string {
  return `${face}-${cosmeticId}.png`;
}

export function cosmeticCompositeSrc(face: string, cosmeticId: string): string {
  return asset(`cosmetics/${cosmeticCompositeFile(face, cosmeticId)}`);
}

/** Fitted composite when we have one; otherwise the bare toy — never a floating hat. */
export function dressedSquisheeSrc(face: string, cosmeticId?: string | null): string {
  if (canDressFace(face, cosmeticId) && cosmeticId) return cosmeticCompositeSrc(face, cosmeticId);
  return squisheeById(face) ? squisheeSrc(face) : squisheeSrc("peach");
}

export type CosmeticBuyReason = "ok" | "missing" | "owned" | "poor";

export function applyBuyCosmetic(
  coins: number,
  owned: readonly string[],
  id: string,
): { ok: boolean; reason: CosmeticBuyReason; coins: number; cosmetics: string[] } {
  const item = cosmeticById(id);
  if (!item) return { ok: false, reason: "missing", coins, cosmetics: [...owned] };
  if (owned.includes(item.id)) return { ok: false, reason: "owned", coins, cosmetics: [...owned] };
  if (coins < item.price) return { ok: false, reason: "poor", coins, cosmetics: [...owned] };
  return { ok: true, reason: "ok", coins: coins - item.price, cosmetics: [...owned, item.id] };
}

export function parseCosmeticIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const id of raw) {
    if (typeof id !== "string" || !isCosmeticId(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function parseEquippedCosmetic(raw: unknown, owned: readonly string[]): string {
  if (typeof raw !== "string" || !isCosmeticId(raw) || !owned.includes(raw)) return "";
  return raw;
}

export function cosmeticLabel(id: CosmeticId, ui: Ui): string {
  switch (id) {
    case "party-hat":
      return ui.partyHat;
    case "scarf":
      return ui.scarf;
    case "bow":
      return ui.bow;
    case "shades":
      return ui.shades;
    default: {
      const _never: never = id;
      return _never;
    }
  }
}
