import { asset } from "@/lib/art";

export type CosmeticSlot = "hat" | "neck" | "face";

export type Cosmetic = {
  id: string;
  slot: CosmeticSlot;
  file: string;
  name: string;
  price: number;
};

export type EquippedCosmetics = {
  hat?: string;
  neck?: string;
  face?: string;
};

export const COSMETICS: readonly Cosmetic[] = [
  { id: "bow", slot: "hat", file: "bow.png", name: "Bow", price: 3 },
  { id: "scarf", slot: "neck", file: "scarf.png", name: "Scarf", price: 4 },
  { id: "glasses", slot: "face", file: "glasses.png", name: "Glasses", price: 4 },
  { id: "hat-party", slot: "hat", file: "hat-party.png", name: "Party hat", price: 5 },
  { id: "beanie", slot: "hat", file: "beanie.png", name: "Beanie", price: 5 },
];

const byId = new Map(COSMETICS.map((c) => [c.id, c]));

export function cosmeticById(id: string): Cosmetic | undefined {
  return byId.get(id);
}

export function cosmeticSrc(id: string): string {
  const c = cosmeticById(id);
  return asset(`art/cosmetics/${c?.file ?? `${id}.png`}`);
}

export function parseOwnedCosmetics(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const id of v) {
    if (typeof id !== "string" || !byId.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function parseEquippedCosmetics(v: unknown, owned: readonly string[] = []): EquippedCosmetics {
  if (!v || typeof v !== "object") return {};
  const o = v as Record<string, unknown>;
  const next: EquippedCosmetics = {};
  const ownedSet = new Set(owned);
  for (const slot of ["hat", "neck", "face"] as const) {
    const id = o[slot];
    if (typeof id !== "string") continue;
    const item = cosmeticById(id);
    if (!item || item.slot !== slot) continue;
    if (ownedSet.size && !ownedSet.has(id)) continue;
    next[slot] = id;
  }
  return next;
}

export type CosmeticBuyReason = "ok" | "missing" | "owned" | "poor";

export function applyBuyCosmetic(
  coins: number,
  owned: readonly string[],
  id: string,
): { ok: boolean; reason: CosmeticBuyReason; coins: number; owned: string[] } {
  const item = cosmeticById(id);
  if (!item) return { ok: false, reason: "missing", coins, owned: [...owned] };
  if (owned.includes(id)) return { ok: false, reason: "owned", coins, owned: [...owned] };
  if (coins < item.price) return { ok: false, reason: "poor", coins, owned: [...owned] };
  return { ok: true, reason: "ok", coins: coins - item.price, owned: [...owned, id] };
}

export type CosmeticEquipReason = "ok" | "missing" | "unowned";

export function applyEquipCosmetic(
  owned: readonly string[],
  equipped: EquippedCosmetics,
  id: string,
): { ok: boolean; reason: CosmeticEquipReason; equipped: EquippedCosmetics } {
  const item = cosmeticById(id);
  if (!item) return { ok: false, reason: "missing", equipped };
  if (!owned.includes(id)) return { ok: false, reason: "unowned", equipped };
  const next = { ...equipped };
  if (next[item.slot] === id) delete next[item.slot];
  else next[item.slot] = id;
  return { ok: true, reason: "ok", equipped: next };
}

export function applyUnequipSlot(equipped: EquippedCosmetics, slot: CosmeticSlot): EquippedCosmetics {
  const next = { ...equipped };
  delete next[slot];
  return next;
}
