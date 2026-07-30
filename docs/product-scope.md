# Product scope

## Purpose

Tablekeep is a companion for campaigns played together in person. It gives each person a reliable place for information that changes during play, while letting the table keep its own rules, dice, books, and style of play.

The product should feel useful at a busy table: fast to scan, quick to update, and respectful of what each participant should be able to see.

## Users and responsibilities

| Role | Primary responsibilities | Typical tools |
| --- | --- | --- |
| Player | Maintain their own character information and take part in a campaign. | Character sheet, hit points, spells, inventory, rolls. |
| Dungeon Master | Prepare and run a campaign. | Campaign setup, party overview, initiative, creatures, shops, encounter notes. |
| Campaign member | A player or DM with access to a particular campaign. | Shared campaign context, subject to campaign visibility rules. |
| Site administrator | Operate the application, not individual campaigns. | Account administration and operational tools. |

## Planned feature areas

### Character management

- Character identity, abilities, skills, defenses, hit points, and conditions.
- Level-relevant information and freeform notes.
- Spell books, prepared spells, and resource tracking.
- Inventory, equipment, currency, and item quantities.

### Campaign play

- Campaign creation and membership.
- A party overview that helps the DM run the current session.
- Explicit visibility controls for material that should remain DM-only.
- Dice/roll helpers for tables that want them, without requiring digital rolling.

### Dungeon Master tools

- Initiative and encounter tracking.
- Creature/monster references and campaign-specific notes.
- Shop creation, stock, pricing, and customer-facing views when appropriate.
- Reusable encounter and campaign-preparation material.

## Product principles

1. **At-the-table speed.** Important state—especially hit points, initiative, and inventory—must be easy to find and update.
2. **Shared, not intrusive.** Digital support should not take attention away from people at the table.
3. **Private by default.** Campaign ownership, membership, and DM-only information must be enforced on the server.
4. **System-respectful.** Start with flexible, system-neutral data and avoid assuming that every group uses the same rules.
5. **Rules-content safety.** Do not embed copied proprietary game rules or commercial compendium content. Support user-created and appropriately licensed material.

## Non-goals for the first iterations

- Replacing virtual tabletops, voice/video platforms, or physical dice.
- Hosting or reproducing proprietary rulebooks and monster manuals.
- Mandating a single game system or table workflow.
- Building every DM planning tool before the core campaign, character, and encounter flows are dependable.

## Suggested delivery order

1. Campaigns, membership, and authorization.
2. Character sheets with hit-point and inventory updates.
3. Spellbooks, preparation, and resource tracking using safe content sources.
4. DM party overview and shared initiative tracking.
5. Creature references, shops, richer encounter preparation, and optional roll utilities.

This is a planning guide, not an implementation contract. See
[the product roadmap](roadmap.md) for the approved MVP boundary and delivery
sequence, and update both documents when the team makes a product decision.
