import { COSMETIC_IDS, cosmeticPrice, isCosmeticId, type CosmeticId, type CosmeticSlot } from "@/lib/cosmetics";
import { show, t } from "./i18n";

/**
 * Academy-only looks. Squishee Math keeps the four fitted composites in
 * `@/lib/cosmetics`. Each academy look is drawn to that squishee's head or
 * neck and shares the picture's squish, so the costume deforms with the body.
 * Looks are cut-out photos of real accessories, pre-fitted per squishee.
 * Nothing here paints eyes or a mouth.
 */
export const WARDROBE = [
  { id: "flower-clip", slot: "face", price: 9, stars: 12, bond: 0, study: 0 },
  { id: "star-cap", slot: "hat", price: 14, stars: 24, bond: 0, study: 0 },
  { id: "bow-tie", slot: "neck", price: 16, stars: 0, bond: 9, study: 0 },
  { id: "round-glasses", slot: "face", price: 20, stars: 0, bond: 0, study: 6 },
  { id: "flower-crown", slot: "hat", price: 22, stars: 0, bond: 12, study: 0 },
  { id: "berry-beret", slot: "hat", price: 26, stars: 48, bond: 0, study: 0 },
  { id: "sun-hat", slot: "hat", price: 34, stars: 96, bond: 0, study: 0 },
  { id: "night-cap", slot: "hat", price: 38, stars: 0, bond: 15, study: 0 },
  { id: "party-crown", slot: "hat", price: 48, stars: 240, bond: 0, study: 0 },
  { id: "star-glasses", slot: "face", price: 56, stars: 0, bond: 0, study: 14 },
] as const;

export type WardrobeId = (typeof WARDROBE)[number]["id"];
export type ShopId = CosmeticId | WardrobeId;

export const BOND_REWARDS = WARDROBE.filter((item) => item.bond > 0);
export const STUDY_REWARDS = WARDROBE.filter((item) => item.study > 0);

const byId = new Map(WARDROBE.map((item) => [item.id, item]));

export function isWardrobeId(id: string): id is WardrobeId {
  return byId.has(id as WardrobeId);
}

export function isShopId(id: string): id is ShopId {
  return isCosmeticId(id) || isWardrobeId(id);
}

export function wardrobeById(id: string) {
  return byId.get(id as WardrobeId);
}

/** Looks that cannot sit right on a body: capybara is drawn in profile, penguin already wears a bow tie. */
const HIDDEN_ON: Readonly<Record<string, readonly string[]>> = {
  capybara: ["round-glasses", "star-glasses"],
  penguin: ["bow-tie"],
};

export function lookShowsOn(face: string, id: string): boolean {
  return !(HIDDEN_ON[face] ?? []).includes(id);
}

/** Per-squishee costume. A shared sticker would sit in the wrong place on a different body. */
export function wardrobeSrc(face: string, id: string): string {
  return `/times-tables/wardrobe/fitted/${face}-${id}.webp`;
}

/** Classics first, then the academy set, so a gift day stays stable as kids own more. */
export function giftOutfitIds(): string[] {
  return [...COSMETIC_IDS, ...WARDROBE.map((item) => item.id)];
}

export function nextGiftOutfit(seed: number, owned: readonly string[]): string | null {
  const left = giftOutfitIds().filter((id) => !owned.includes(id));
  if (!left.length) return null;
  return left[seed % left.length] ?? null;
}

export function looksCrossingStars(prevStars: number, nextStars: number): WardrobeId[] {
  if (nextStars <= prevStars) return [];
  const out: WardrobeId[] = [];
  for (const item of WARDROBE) {
    if (item.stars > 0 && prevStars < item.stars && nextStars >= item.stars) out.push(item.id);
  }
  return out;
}

export function outfitPrice(id: string): number {
  return wardrobeById(id)?.price ?? cosmeticPrice(id);
}

export type CosmeticBuyReason = "ok" | "missing" | "owned" | "poor";

export function applyBuyWardrobe(
  coins: number,
  owned: readonly string[],
  id: string,
): { ok: boolean; reason: CosmeticBuyReason; coins: number; cosmetics: string[] } {
  const item = wardrobeById(id);
  if (!item) return { ok: false, reason: "missing", coins, cosmetics: [...owned] };
  if (owned.includes(item.id)) return { ok: false, reason: "owned", coins, cosmetics: [...owned] };
  if (coins < item.price) return { ok: false, reason: "poor", coins, cosmetics: [...owned] };
  return { ok: true, reason: "ok", coins: coins - item.price, cosmetics: [...owned, item.id] };
}

export function parseOwnedLooks(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const id of raw) {
    if (typeof id !== "string" || seen.has(id) || !isShopId(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function parseEquippedLook(raw: unknown, owned: readonly string[]): string {
  if (typeof raw !== "string" || !isShopId(raw) || !owned.includes(raw)) return "";
  return raw;
}

export interface ShopItem {
  id: ShopId;
  slot: CosmeticSlot;
  price: number;
}

export interface ShopSection {
  slot: CosmeticSlot;
  title: string;
  items: ShopItem[];
}

const CLASSIC: readonly ShopItem[] = [
  { id: "bow", slot: "hat", price: 4 },
  { id: "party-hat", slot: "hat", price: 6 },
  { id: "scarf", slot: "neck", price: 5 },
  { id: "shades", slot: "face", price: 8 },
];

export function shopSections(): ShopSection[] {
  const items: ShopItem[] = [
    ...CLASSIC,
    ...WARDROBE.map((item) => ({ id: item.id, slot: item.slot, price: item.price })),
  ];
  const sections: { slot: CosmeticSlot; title: string }[] = [
    { slot: "hat", title: "Hats" },
    { slot: "neck", title: "Scarves" },
    { slot: "face", title: "Faces" },
  ];
  return sections.map((section) => ({
    slot: section.slot,
    title: section.title,
    items: items
      .filter((item) => item.slot === section.slot)
      .sort((a, b) => a.price - b.price || a.id.localeCompare(b.id)),
  }));
}

export function shopItems(): ShopItem[] {
  return shopSections().flatMap((section) => section.items);
}

function shopEnglish(id: ShopId): string {
  switch (id) {
    case "party-hat":
      return "Party hat";
    case "scarf":
      return "Scarf";
    case "bow":
      return "Bow";
    case "shades":
      return "Shades";
    case "flower-clip":
      return "Flower clip";
    case "star-cap":
      return "Star cap";
    case "bow-tie":
      return "Bow tie";
    case "round-glasses":
      return "Round glasses";
    case "flower-crown":
      return "Flower crown";
    case "berry-beret":
      return "Berry beret";
    case "sun-hat":
      return "Sun hat";
    case "night-cap":
      return "Night cap";
    case "party-crown":
      return "Party crown";
    case "star-glasses":
      return "Star glasses";
    default: {
      const neverId: never = id;
      return neverId;
    }
  }
}

export function outfitLabel(id: string): string {
  if (!isShopId(id)) return id;
  return show(shopEnglish(id));
}

/** How a look is earned without spending coins. Classics follow friendship in bond.ts. */
export function outfitHint(id: string): string {
  if (!isShopId(id)) return "";
  switch (id) {
    case "party-hat":
      return t("Or a best buddy", "O el mejor amigo");
    case "bow":
      return t("Or a good friend", "O un buen amigo");
    case "scarf":
      return t("Or 3 stars in a game", "O 3 estrellas en un juego");
    case "shades":
      return t("Or 3 stars in 3 games", "O 3 estrellas en 3 juegos");
    case "flower-clip":
      return t("Or 12 stars", "O 12 estrellas");
    case "star-cap":
      return t("Or 24 stars", "O 24 estrellas");
    case "bow-tie":
      return t("Or 9 games with your pal", "O 9 juegos con tu amigo");
    case "round-glasses":
      return t("Or 3 stars in 6 games", "O 3 estrellas en 6 juegos");
    case "flower-crown":
      return t("Or 12 games with your pal", "O 12 juegos con tu amigo");
    case "berry-beret":
      return t("Or 48 stars", "O 48 estrellas");
    case "sun-hat":
      return t("Or 96 stars", "O 96 estrellas");
    case "night-cap":
      return t("Or 15 games with your pal", "O 15 juegos con tu amigo");
    case "party-crown":
      return t("Or 240 stars", "O 240 estrellas");
    case "star-glasses":
      return t("Or 3 stars in every game", "O 3 estrellas en cada juego");
    default: {
      const neverId: never = id;
      return neverId;
    }
  }
}
