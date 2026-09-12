import { MagentaImg } from "@/components/magenta-video";
import { canDressFace, dressedSquisheeSrc } from "@/lib/cosmetics";
import { cn } from "@/lib/utils";

export function DressedSquishee({
  id,
  cosmetic,
  className,
  imgClassName,
  alt = "",
}: {
  id: string;
  cosmetic?: string | null;
  className?: string;
  imgClassName?: string;
  alt?: string;
}) {
  const fitted = canDressFace(id, cosmetic);
  return (
    <span
      className={cn("dressed-squishee", className)}
      data-dressed={id}
      data-cosmetic={fitted ? cosmetic : undefined}
      aria-hidden={!alt}
    >
      <MagentaImg src={dressedSquisheeSrc(id, cosmetic)} alt={alt} className={imgClassName} />
    </span>
  );
}
