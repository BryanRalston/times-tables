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

/** Display one Imagine portrait: hat, then shades, then scarf. */
export const PORTRAIT_SLOT_ORDER: readonly CosmeticSlot[] = ["hat", "face", "neck"];

export const COSMETICS: readonly Cosmetic[] = [
  { id: "party-hat", slot: "hat", price: 6, file: "party-hat.png" },
  { id: "scarf", slot: "neck", price: 4, file: "scarf.png" },
  { id: "bow", slot: "hat", price: 3, file: "bow.png" },
  { id: "shades", slot: "face", price: 5, file: "shades.png" },
];

export const COSMETIC_IDS = COSMETICS.map((c) => c.id);

const byId = new Map(COSMETICS.map((c) => [c.id, c]));

export function cosmeticById(id: string): Cosmetic | undefined {
  return byId.get(id as CosmeticId);
}

export function isCosmeticId(id: string): id is CosmeticId {
  return byId.has(id as CosmeticId);
}

export function cosmeticPrice(id: string): number {
  return cosmeticById(id)?.price ?? 0;
}

/** Imagine fitted composite exists for every catalog squishee. */
export function canDressFace(face: string, cosmeticId?: string | null): boolean {
  return Boolean(cosmeticId && squisheeById(face) && isCosmeticId(cosmeticId));
}

export function cosmeticCompositeFile(face: string, cosmeticId: string): string {
  return `${face}-${cosmeticId}.png`;
}

export function cosmeticCompositeSrc(face: string, cosmeticId: string): string {
  return asset(`cosmetics/${cosmeticCompositeFile(face, cosmeticId)}`);
}

/** Fitted Imagine portrait when we have a face + item; otherwise the bare toy. */
export function dressedSquisheeSrc(face: string, cosmeticId?: string | null): string {
  if (canDressFace(face, cosmeticId) && cosmeticId) return cosmeticCompositeSrc(face, cosmeticId);
  return squisheeById(face) ? squisheeSrc(face) : squisheeSrc("peach");
}

export function wornCosmetics(raw?: string | readonly string[] | null): string[] {
  const ids = Array.isArray(raw) ? raw : typeof raw === "string" && raw ? [raw] : [];
  const slots: Partial<Record<CosmeticSlot, CosmeticId>> = {};
  for (const id of ids) {
    if (typeof id !== "string" || !isCosmeticId(id)) continue;
    const item = cosmeticById(id);
    if (!item) continue;
    slots[item.slot] = item.id;
  }
  return PORTRAIT_SLOT_ORDER.map((slot) => slots[slot]).filter((id): id is CosmeticId => Boolean(id));
}

/** One Imagine portrait: hat beats shades beats scarf. */
export function portraitCosmetic(raw?: string | readonly string[] | null): string {
  return wornCosmetics(raw)[0] ?? "";
}

export function wearList(s: {
  equippedCosmetic?: string | null;
  equippedCosmetics?: readonly string[] | null;
}): string[] {
  const worn = wornCosmetics(s.equippedCosmetics?.length ? s.equippedCosmetics : s.equippedCosmetic);
  const one = portraitCosmetic(worn);
  return one ? [one] : [];
}

export function slotOfWorn(worn: readonly string[], slot: CosmeticSlot): string | undefined {
  return worn.find((id) => cosmeticById(id)?.slot === slot);
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

export function applyEquipCosmetic(
  owned: readonly string[],
  equipped: readonly string[],
  id: string,
): string[] {
  const item = cosmeticById(id);
  if (!item || !owned.includes(item.id)) return wornCosmetics(equipped);
  return [item.id];
}

export function applyUnequipCosmetic(equipped: readonly string[], id?: string): string[] {
  if (!id) return [];
  return wornCosmetics(equipped.filter((e) => e !== id));
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

export function parseEquippedCosmetics(raw: unknown, owned: readonly string[]): string[] {
  const ids = Array.isArray(raw) ? raw : typeof raw === "string" && raw ? [raw] : [];
  return wearList({
    equippedCosmetics: ids.filter((id) => typeof id === "string" && owned.includes(id)),
  });
}

export function parseEquippedCosmetic(raw: unknown, owned: readonly string[]): string {
  const list = parseEquippedCosmetics(raw, owned);
  return list[0] ?? "";
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
