import { squisheeById } from "@/lib/squishees";
import { squisheeUrl } from "../paths";
import { useCast } from "./round-cast";

export function CountToken({ id, faded }: { id?: string; faded?: boolean }) {
  const cast = useCast();
  const face = id ?? cast?.buddyId ?? "peach";
  const squishee = squisheeById(face);
  if (!squishee) return <i className="ac-dot" />;
  return (
    <img
      className={faded ? "ac-token is-faded" : "ac-token"}
      src={squisheeUrl(squishee.file)}
      alt=""
      draggable={false}
    />
  );
}

export function SquisheeTen({ pink, teal }: { pink: number; teal: number }) {
  const cast = useCast();
  const kept = cast?.buddyId ?? "peach";
  const extra = cast?.hostId ?? "frog";
  const cells = Array.from({ length: 10 }, (_, i) => {
    if (i < pink) return kept;
    if (i < pink + teal) return extra;
    return null;
  });
  return (
    <div className="ac-ten" aria-label={`${Math.max(0, pink + teal)} squishees on a ten-frame`}>
      {cells.map((face, i) => (face ? <CountToken key={i} id={face} /> : <i key={i} />))}
    </div>
  );
}
