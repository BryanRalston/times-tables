import type { SheetItem } from "./types";

export function WordSheet({ items }: { items: SheetItem[] }) {
  const bank: string[] = [];
  for (const item of items) {
    if (!bank.includes(item.answer)) bank.push(item.answer);
  }
  return (
    <>
      <h2>Word list</h2>
      <ul className="ac-word-list">
        {bank.map((word) => (
          <li key={word}>{word}</li>
        ))}
      </ul>
      <ol className="ac-word-sheet">
        {items.map((item, index) => (
          <li key={`${item.prompt}-${item.answer}-${index}`}>
            <p>{item.prompt}</p>
            {item.trace ? <p className="ac-trace">{item.trace}</p> : null}
            <span className="ac-write-line" />
            <span className="ac-write-line" />
          </li>
        ))}
      </ol>
    </>
  );
}
