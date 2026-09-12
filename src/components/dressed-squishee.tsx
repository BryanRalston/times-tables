import { MagentaImg } from "@/components/magenta-video";
import { canDressFace, dressedSquisheeSrc, portraitCosmetic, slotOfWorn, wornCosmetics } from "@/lib/cosmetics";
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
  const item = portraitCosmetic(worn);
  const fitted = canDressFace(id, item);
  const hat = slotOfWorn(item ? [item] : [], "hat");
  const neck = slotOfWorn(item ? [item] : [], "neck");
  const face = slotOfWorn(item ? [item] : [], "face");
  return (
    <span
      className={cn("dressed-squishee", className)}
      data-dressed={id}
      data-cosmetic={fitted ? item : undefined}
      data-cosmetic-hat={hat}
      data-cosmetic-neck={neck}
      data-cosmetic-face={face}
      aria-hidden={!alt}
    >
      <span className={cn("dressed-stack", imgClassName)}>
        <MagentaImg src={dressedSquisheeSrc(id, fitted ? item : "")} alt={alt} className="dressed-face" />
      </span>
    </span>
  );
}
