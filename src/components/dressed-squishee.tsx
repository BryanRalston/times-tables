import { MagentaImg } from "@/components/magenta-video";
import {
  canDressFace,
  cosmeticById,
  cosmeticOverlaySrc,
  dressedSquisheeSrc,
  slotOfWorn,
  wornCosmetics,
} from "@/lib/cosmetics";
import { cn } from "@/lib/utils";

export function DressedSquishee({
  id,
  cosmetic,
  className,
  imgClassName,
  alt = "",
}: {
  id: string;
  cosmetic?: string | readonly string[] | null;
  className?: string;
  imgClassName?: string;
  alt?: string;
}) {
  const worn = wornCosmetics(cosmetic);
  const baked =
    worn.find((item) => canDressFace(id, item) && cosmeticById(item)?.slot === "hat") ??
    worn.find((item) => canDressFace(id, item));
  const overlays = worn.filter((item) => item !== baked);
  const hat = slotOfWorn(worn, "hat");
  const neck = slotOfWorn(worn, "neck");
  const face = slotOfWorn(worn, "face");
  return (
    <span
      className={cn("dressed-squishee", className)}
      data-dressed={id}
      data-cosmetic={worn.join(" ") || undefined}
      data-cosmetic-hat={hat}
      data-cosmetic-neck={neck}
      data-cosmetic-face={face}
      aria-hidden={!alt}
    >
      <span className={cn("dressed-stack", imgClassName)}>
        <MagentaImg src={dressedSquisheeSrc(id, baked)} alt={alt} className="dressed-face" />
        {overlays.map((itemId) => {
          const item = cosmeticById(itemId);
          if (!item) return null;
          return (
            <img
              key={item.id}
              src={cosmeticOverlaySrc(item.id)}
              alt=""
              draggable={false}
              className={cn("cosmetic-overlay", `cosmetic-overlay-${item.slot}`)}
              data-cosmetic-hat={item.slot === "hat" ? item.id : undefined}
              data-cosmetic-neck={item.slot === "neck" ? item.id : undefined}
              data-cosmetic-face={item.slot === "face" ? item.id : undefined}
            />
          );
        })}
      </span>
    </span>
  );
}
