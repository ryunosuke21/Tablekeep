import { Fragment } from "react";

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

export function WikiProse({ text }: { text: string }) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return null;
  return (
    <div className="space-y-4 text-[0.98rem] text-foreground/88 leading-7">
      {paragraphs.map((paragraph) => (
        <p key={paragraph} className="whitespace-pre-line">
          <DiceText text={paragraph} />
        </p>
      ))}
    </div>
  );
}
