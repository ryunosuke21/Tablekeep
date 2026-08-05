import { Fragment, type ReactNode } from "react";
import { IconTable } from "@tabler/icons-react";

import { DiceRoll, parseDiceExpression } from "./dice-roll";

const DICE_IN_TEXT = /\b(?:\d{1,2})?d(?:4|6|8|10|12|20)(?:\s*[+-]\s*\d+)?\b/gi;

export function DiceText({ text }: { text: string }) {
  const parts: Array<{ value: string; dice: boolean; offset: number }> = [];
  let lastIndex = 0;

  for (const match of text.matchAll(DICE_IN_TEXT)) {
    const index = match.index ?? 0;
    if (index > lastIndex)
      parts.push({
        value: text.slice(lastIndex, index),
        dice: false,
        offset: lastIndex,
      });
    const value = match[0];
    parts.push({
      value,
      dice: parseDiceExpression(value) !== null,
      offset: index,
    });
    lastIndex = index + value.length;
  }
  if (lastIndex < text.length)
    parts.push({
      value: text.slice(lastIndex),
      dice: false,
      offset: lastIndex,
    });

  if (parts.length === 0) return text;
  return parts.map((part) => (
    <Fragment key={`${part.offset}-${part.value}`}>
      {part.dice ? <DiceRoll expression={part.value} /> : part.value}
    </Fragment>
  ));
}

function InlineText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const emphasis = /\*\*(.+?)\*\*/g;
  let cursor = 0;
  for (const match of text.matchAll(emphasis)) {
    const index = match.index ?? 0;
    if (index > cursor)
      parts.push(
        <DiceText key={`plain-${cursor}`} text={text.slice(cursor, index)} />,
      );
    parts.push(
      <strong key={`strong-${index}`} className="font-semibold text-foreground">
        <DiceText text={match[1] ?? ""} />
      </strong>,
    );
    cursor = index + match[0].length;
  }
  if (cursor < text.length)
    parts.push(<DiceText key={`plain-${cursor}`} text={text.slice(cursor)} />);
  return parts.length ? parts : <DiceText text={text} />;
}

function MarkdownTable({ block }: { block: string }) {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const rows = lines
    .filter((_, index) => index !== 1)
    .map((line) =>
      line
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((cell) => cell.trim()),
    );
  const [headers = [], ...body] = rows;

  return (
    <div className="my-5 overflow-hidden rounded-xl border bg-background shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
          <thead className="bg-muted/65">
            <tr>
              {headers.map((header) => (
                <th key={header} className="border-b px-4 py-3 font-semibold">
                  <InlineText text={header} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {body.map((row) => (
              <tr
                key={row.join("-")}
                className="odd:bg-card/40 hover:bg-muted/35"
              >
                {headers.map((header, cellIndex) => (
                  <td key={header} className="px-4 py-3 text-foreground/85">
                    <InlineText text={row[cellIndex] ?? "—"} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderBlock(block: string) {
  if (/^\|.+\|\n\|?\s*:?-{3}/.test(block))
    return <MarkdownTable block={block} />;

  const tableTitle = block.match(/^Table:\s*(.+)$/i);
  if (tableTitle)
    return (
      <h4 className="flex items-center gap-2 pt-2 font-semibold text-base">
        <span className="grid size-7 place-items-center rounded-md bg-primary/10 text-primary">
          <IconTable className="size-4" />
        </span>
        {tableTitle[1]}
      </h4>
    );

  const heading = block.match(/^(#{2,4})\s+(.+)$/);
  if (heading)
    return (
      <h3 className="pt-2 font-semibold text-lg">
        <InlineText text={heading[2] ?? ""} />
      </h3>
    );

  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.every((line) => /^[-*]\s+/.test(line)))
    return (
      <ul className="ml-5 list-disc space-y-2 marker:text-primary">
        {lines.map((line) => (
          <li key={line}>
            <InlineText text={line.replace(/^[-*]\s+/, "")} />
          </li>
        ))}
      </ul>
    );
  if (lines.every((line) => /^\d+\.\s+/.test(line)))
    return (
      <ol className="ml-5 list-decimal space-y-2 marker:font-mono marker:text-primary">
        {lines.map((line) => (
          <li key={line}>
            <InlineText text={line.replace(/^\d+\.\s+/, "")} />
          </li>
        ))}
      </ol>
    );

  return (
    <p className="whitespace-pre-line">
      <InlineText text={block} />
    </p>
  );
}

export function WikiProse({ text }: { text: string }) {
  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  if (blocks.length === 0) return null;
  return (
    <div className="space-y-4 text-[0.98rem] text-foreground/88 leading-7">
      {blocks.map((block) => (
        <Fragment key={block}>{renderBlock(block)}</Fragment>
      ))}
    </div>
  );
}
