# Wiki entry artwork

Artwork is optional and added by hand. Drop a file here and the matching entry
picks it up on its next render — there is no build step, manifest, or import to
update.

## Where a file goes

```
public/images/wiki/<category>/<slug>.png
```

- `<category>` is one of `species`, `backgrounds`, `classes`, `spells`,
  `creatures`, `feats`, `items`, `rules`.
- `<slug>` is the entry name, lowercased, with accents and punctuation dropped
  and spaces turned into hyphens.

| Entry | File |
| --- | --- |
| Aboleth | `public/images/wiki/creatures/aboleth.png` |
| Adult Black Dragon | `public/images/wiki/creatures/adult-black-dragon.png` |
| Fireball | `public/images/wiki/spells/fireball.png` |
| Adamantine Armor (Breastplate) | `public/images/wiki/items/adamantine-armor-breastplate.png` |
| Circle of the Land | `public/images/wiki/classes/circle-of-the-land.png` |

The slug comes from the entry name rather than its source-qualified key, so one
file covers the same entry across every source book: `aboleth.png` is used by
the 2014, 2024, Black Flag, and Monstrous Menagerie aboleths alike.

## Missing artwork

An entry with no file falls back to its category plate (`/wiki/*.webp`), shown
dimmed so it reads as a placeholder rather than real art. Nothing breaks and no
list goes blank, so new upstream entries are safe to leave without images.

## Format

Use `.png`, cropped square — entries are shown as a square thumbnail in lists
and on record pages, and cropped to 16:9 in card view. The extension is set by
`WIKI_IMAGE_EXTENSION` in `apps/web/src/lib/wiki/images.ts`; change it there if
you would rather keep the whole set as `.webp`.
