import { MagentaImg } from "@/components/magenta-video";
import { cosmeticById, cosmeticSrc, type EquippedCosmetics } from "@/lib/cosmetics";
import { squisheeSrc } from "@/lib/squishees";
import { cn } from "@/lib/utils";

export function DressedSquishee({
  id,
  equipped,
  className,
  bodyClassName,
}: {
  id: string;
  equipped?: EquippedCosmetics;
  className?: string;
  bodyClassName?: string;
}) {
  const hat = equipped?.hat && cosmeticById(equipped.hat)?.slot === "hat" ? equipped.hat : undefined;
  const neck = equipped?.neck && cosmeticById(equipped.neck)?.slot === "neck" ? equipped.neck : undefined;
  const face = equipped?.face && cosmeticById(equipped.face)?.slot === "face" ? equipped.face : undefined;
  return (
    <span
      className={cn("dressed-squishee", className)}
      data-avatar={id}
      data-cosmetic-hat={hat ?? undefined}
      data-cosmetic-neck={neck ?? undefined}
      data-cosmetic-face={face ?? undefined}
    >
      <MagentaImg src={squisheeSrc(id)} alt="" className={cn("dressed-squishee-body", bodyClassName)} />
      {hat ? <MagentaImg src={cosmeticSrc(hat)} alt="" className="dressed-hat" /> : null}
      {neck ? <MagentaImg src={cosmeticSrc(neck)} alt="" className="dressed-neck" /> : null}
      {face ? <MagentaImg src={cosmeticSrc(face)} alt="" className="dressed-face" /> : null}
    </span>
  );
}
