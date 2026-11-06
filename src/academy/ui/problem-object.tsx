import { asset } from "@/lib/art";

/** Emoji remain stable generator tokens, never the device's rendered artwork. */
export const PROBLEM_OBJECTS = {
  "🍎": "apple",
  "🐟": "fish",
  "⭐": "star",
  "🍪": "cookie",
  "⚽": "ball",
  "🐸": "frog",
} as const;

export function problemObjectId(token: string): string | undefined {
  return Object.hasOwn(PROBLEM_OBJECTS, token) ? PROBLEM_OBJECTS[token as keyof typeof PROBLEM_OBJECTS] : undefined;
}

export function ProblemObjects({ token, count }: { token: string; count: number }) {
  const id = problemObjectId(token);
  if (!id) return null;
  return <>{Array.from({ length: count }, (_, i) => (
    <img key={i} className="ac-problem-object" src={asset(`art/problem-objects/${id}.png`)} width={36} height={36} alt="" aria-hidden="true" />
  ))}</>;
}

/** Preserve the generator's equal-group boundaries in picture answer cards. */
export function ProblemPicture({ picture }: { picture: string }) {
  const groups = picture.split(" ").filter(Boolean);
  return <span className="ac-problem-picture" aria-hidden="true">{groups.map((group, i) => {
    const tokens = [...group];
    return <span className="ac-object-set" key={i}><ProblemObjects token={tokens[0] ?? ""} count={tokens.length} /></span>;
  })}</span>;
}
