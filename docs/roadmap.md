# Tablekeep product roadmap

> **Status:** Approved product direction; implementation has not started.
>
> **Launch target:** Closed beta.
>
> **Last updated:** July 29, 2026.

Tablekeep's first release should prove one complete in-person play loop:

1. A Dungeon Master creates a private campaign.
2. Players join through an invitation link, code, or email.
3. Players maintain essential character and spell information.
4. The DM sees and, when necessary, overrides campaign-specific character state.
5. Everyone in the campaign sees the same active encounter and initiative state.

The product should reduce bookkeeping at the table without becoming a virtual tabletop or replacing physical play.

## Product decisions

The following decisions are part of the roadmap:

- Spells are required for the MVP.
- Campaigns support both shareable invite links/codes and email invitations.
- DMs can remove players from their campaigns.
- Players own and manage their character sheets.
- A DM can edit a character for their campaign. DM changes are stored as campaign-scoped overrides and must not alter that character outside the campaign.
- Active encounter state is shared and consistent for the DM and every campaign player.
- The first launch is an invitation-only closed beta.
- Site-administrator access and campaign-level DM authority remain separate concepts.

# 1. MVP jobs to be done

The MVP is complete when a DM and at least one player can use Tablekeep to prepare and run a real session from phones or laptops while campaign data remains private.

## 1.1 Enter Tablekeep and reach the right campaign

**Job:** When I arrive at Tablekeep, I need to understand the product, sign in, and reach the campaign that needs my attention without setup confusion.

### Work

- Replace the Create T3 App starter page, metadata, and links with Tablekeep branding and a focused entry page.
- Provide working Google sign-in and sign-out flows.
- Add an authenticated application shell with responsive navigation and an account menu.
- Route new users through lightweight onboarding.
- Show returning users their campaigns and the most relevant next action.
- Add loading, empty, error, expired-session, denied-access, and not-found states.
- Ensure the primary flows are touch-friendly and usable on phone-sized screens.

### Acceptance criteria

- A new user can sign in and understand how to join or create a campaign.
- A returning user can reach an existing campaign without unnecessary steps.
- Authentication failures and expired sessions have a clear recovery path.
- Unauthenticated visitors cannot access private application routes.

## 1.2 Control access to the closed beta

**Job:** When Tablekeep is in beta, the project team needs to admit intended testers without opening self-service registration to the public.

### Work

- Add a beta-access gate independent of campaign membership.
- Allow site administrators to approve, revoke, and review beta access.
- Decide whether access is granted to an email address before first sign-in or to an existing account after sign-in.
- Show a useful waitlist or access-denied page to signed-in users who are not admitted.
- Keep beta administration separate from the tools a DM uses inside a campaign.
- Document the process for admitting testers and handling support requests.

### Acceptance criteria

- Only approved beta users can enter the authenticated product.
- Revoking beta access does not silently delete campaign or character data.
- Campaign DMs cannot grant site-wide beta or administrator access.

## 1.3 Create, invite people to, and manage a private campaign

**Job:** When our group starts using Tablekeep, the DM needs to create a campaign, invite players, and manage membership while players need a reliable way to join the correct group.

### Work

- Model campaigns, memberships, campaign roles, invitation state, and timestamps.
- Support one or more DMs and any number of players within reasonable beta limits.
- Allow a DM to create and update basic campaign settings.
- Generate a revocable shareable invite link and human-enterable invite code.
- Allow a DM to send an email invitation.
- Integrate a transactional email provider for campaign invitations.
- Store invitation tokens securely; make them expiring, revocable, and single-purpose.
- Handle an invite recipient who must sign in before accepting.
- Prevent unintended acceptance by the wrong account, especially for email-addressed invitations.
- Let a DM list members, revoke pending invitations, remove players, and promote or demote campaign roles.
- Let a player leave a campaign.
- Archive campaigns without immediately destroying their data.
- Confirm destructive membership and campaign actions in the interface.

### Authorization requirements

- Every campaign-owned query and mutation must verify active membership server-side.
- DM-only mutations must verify the user's role in the requested campaign.
- Removing a member must immediately remove their access to campaign-owned data.
- Removing a player must preserve the campaign's history and define what happens to their campaign character.
- The last DM cannot leave, remove themselves, or be demoted until another DM is assigned or the campaign is archived.
- Site-wide Better Auth roles must not be used as a substitute for campaign membership.

### Acceptance criteria

- A DM can invite one player by link/code and another by email.
- Each invited player can join the intended campaign after authentication.
- A revoked, expired, already-used, or wrong-recipient invitation is rejected safely.
- A DM can remove a player and the removed player immediately loses campaign access.
- Automated tests cover DM, player, non-member, removed-member, and signed-out cases.

## 1.4 Keep an essential character ready for play

**Job:** When I prepare for or play a session, I need one fast place to see and update the character information that changes most often.

### Work

- Let a player create and attach a character to a campaign.
- Capture essential identity and system-neutral notes.
- Capture current and maximum hit points.
- Track conditions as flexible labels rather than encoding a full rules engine.
- Track inventory entries with a name, quantity, equipped state, and notes.
- Track currency without assuming that every campaign uses the same denominations.
- Provide quick, validated HP, condition, inventory, and currency updates.
- Make ownership and campaign attachment explicit in the data model.
- Define behavior for retired characters and players with more than one character.
- Provide clear saved, saving, validation-error, and retry feedback.

### Campaign-specific DM overrides

- The player-owned character record remains the base sheet.
- A DM edit creates or updates an override scoped to that character and campaign.
- The effective campaign sheet is the base value merged with active campaign overrides.
- Overrides must record which DM changed the value and when.
- The UI must identify overridden fields to both the character owner and campaign DMs.
- A DM must be able to remove an override and return the field to the player's base value.
- Editing one campaign's override must never change the base character or another campaign's effective sheet.
- Player edits to a base value must not silently erase an active DM override.

### Acceptance criteria

- A player can prepare and update a minimal character during play in a few taps.
- Another player cannot edit or access private character data they are not allowed to see.
- A DM can override an allowed field for their campaign.
- The same character viewed outside that campaign remains unchanged.
- Override creation, replacement, and removal are covered by authorization and merge-behavior tests.

## 1.5 Maintain a usable spellbook

**Job:** When I prepare spells or need one during play, I need to find it quickly, know whether it is prepared, and track the resources used to cast it.

### External spell source

Use the [D&D 5e SRD API](https://www.dnd5eapi.co/) as the initial catalog source. It provides unauthenticated REST and GraphQL access. The documented production dataset currently covers the 2014 SRD.

For the MVP:

- Prefer the versioned REST endpoints for spell lists and spell details because the required access pattern is simple.
- Wrap the upstream service behind a server-side Tablekeep adapter so application components do not depend directly on its response format.
- Keep the adapter replaceable with the GraphQL endpoint or another appropriately licensed source.
- Record the upstream source, version, and spell index with imported records.
- Cache catalog responses conservatively and handle upstream timeouts or unavailability.
- Store enough approved spell detail with a character's saved spellbook that an upstream outage does not make prepared spells unusable at the table.
- Review and satisfy the source data's attribution and license requirements before closed beta distribution.
- Do not imply that the API contains every officially published spell.

The official API documentation is available at:

- [API introduction and endpoints](https://5e-bits.github.io/docs/introduction)
- [Spell list filtering](https://5e-bits.github.io/docs/api/get-list-of-spells-with-optional-filtering)
- [GraphQL tutorial](https://5e-bits.github.io/docs/tutorials/beginner/graphql)
- [Source database and license notes](https://github.com/5e-bits/5e-database)

### Work

- Browse the SRD spell catalog and search locally by name.
- Filter spells using supported catalog fields such as level and school.
- View the details needed during play, including casting time, range, components, duration, description, level, and school when the source provides them.
- Add and remove spells from a character's spellbook.
- Mark spells as prepared or unprepared.
- Track current and maximum spell resources by level or as flexible named resources where the character requires a different model.
- Allow a user to create a custom, user-authored spell when the desired spell is not in the SRD catalog.
- Clearly distinguish catalog spells from custom campaign content.
- Prevent custom content from becoming a shared public compendium during the MVP.

### Acceptance criteria

- A player can find an SRD spell, add it to their character, and mark it prepared.
- A player can create a private custom spell reference.
- Prepared spell details remain available during a temporary upstream API outage.
- Resource changes persist and are visible in the effective campaign sheet.
- API errors do not block the rest of the character sheet.
- Attribution and required license notices are present before the beta launches.

## 1.6 See the party's current state at a glance

**Job:** When I run a session, I need a compact view of the party's relevant state so I do not interrupt play by opening every character separately.

### Work

- Show campaign members and their attached characters in a DM-oriented party overview.
- Surface effective current/max HP, active conditions, and key spell-resource state.
- Identify when displayed values include campaign-specific DM overrides.
- Link directly to character and spellbook details.
- Keep player-safe campaign context separate from DM-only controls.
- Define empty, incomplete-character, removed-member, and retired-character states.
- Use a compact, touch-friendly layout that remains readable for a larger party.

### Acceptance criteria

- A DM can understand the party's current table state from one screen.
- The overview displays the same effective values as each campaign character sheet.
- Player and DM interfaces reveal only the information authorized for that role.

## 1.7 Run one shared initiative encounter

**Job:** When an encounter begins, everyone needs the same current turn, round, and visible combatant state while the DM retains control of the encounter.

### Work

- Let a DM create, start, complete, reopen, and revisit encounters inside a campaign.
- Add campaign characters and ad hoc creatures to an encounter.
- Record initiative values and sort them with a documented tie strategy.
- Identify the active combatant and current round.
- Let a DM advance and move backward through turns safely.
- Let a DM reorder combatants and correct initiative mistakes.
- Track optional current/max HP, conditions, and DM notes for encounter combatants.
- Show a shared read-only encounter view to every active campaign player.
- Keep DM-only creature notes and controls out of player responses, not merely hidden in the UI.
- Confirm ending or deleting an active encounter.

### Consistency model

- The database is the authoritative encounter state.
- Store an encounter revision number and increment it with each state-changing mutation.
- Apply turn advancement, round changes, and combatant updates atomically.
- Reject or reconcile a mutation based on a stale revision instead of silently overwriting a newer encounter state.
- In the initial beta, refresh active encounters on a short interval and immediately invalidate/refetch after local mutations.
- Show connection and stale-state indicators when a client cannot confirm the latest revision.
- Do not allow offline encounter mutations in the MVP.
- Evaluate server-sent events, WebSockets, or another push mechanism after validating the hosting environment and beta usage.

### Acceptance criteria

- The DM and all players converge on the same encounter revision and active turn.
- Refreshing or reopening the page restores the authoritative encounter state.
- Two rapid or conflicting DM actions cannot silently corrupt turn order.
- Players cannot execute DM-only encounter mutations.
- DM-only notes never appear in player API responses.
- A mixed party and ad hoc creature encounter can be run from start to completion.

## 1.8 Trust Tablekeep with a real campaign

**Job:** When our group adopts Tablekeep, we need core campaign state to be private, resilient, understandable, and supportable.

### Work

- Generate and review Drizzle migrations for each shared domain change.
- Add automated coverage for authorization, ownership, campaign overrides, invitations, and encounter transitions.
- Add clear mutation feedback, validation messages, safe retries, and destructive confirmations.
- Define production deployment, environment configuration, and rollback procedures.
- Define database backup and restore procedures and test a restore.
- Add privacy-conscious logging and error monitoring.
- Publish beta privacy, retention, account deletion, and support expectations.
- Add basic beta feedback collection without exposing campaign content.
- Rehearse the complete product flow with separate site-admin, DM, and player accounts.
- Perform a mobile and at-the-table usability pass before inviting external groups.

### Acceptance criteria

- The team can deploy, observe, support, and recover the beta.
- Authorization tests prove campaign boundaries for allowed and denied roles.
- A database backup can be restored successfully.
- Known limitations are documented for beta testers.
- The release checklist passes with at least two separate accounts and a phone-sized viewport.

## MVP delivery sequence

Milestones describe dependency order and user outcomes. Calendar estimates should be added only after implementation tasks are broken down and team capacity is known.

| Milestone | Scope | Depends on | Exit signal |
| --- | --- | --- | --- |
| M0: Product shell | Branding, sign-in, onboarding, responsive authenticated navigation | Existing auth foundation | A signed-in user reaches a stable application home |
| M1: Closed-beta gate | Admission controls and beta administration | M0 | Only approved testers can enter the app |
| M2: Private campaigns | Campaigns, roles, link/code invites, email invites, removal, authorization helpers | M0–M1 | A DM and players complete a secure membership lifecycle |
| M3: Player essentials | Base character, campaign attachment, DM overrides, HP, conditions, inventory, currency | M2 | A player prepares a character and a DM applies a reversible campaign override |
| M4: Spellbooks | SRD adapter, cached spell details, custom spells, preparation and resource tracking | M3 | A player prepares spells that remain usable during an upstream outage |
| M5: DM table view | Party overview and role-safe campaign navigation | M3–M4 | A DM scans effective party state from one screen |
| M6: Shared encounters | Initiative, encounter revisions, player view, consistency and recovery | M2–M3 | DM and players complete an encounter while seeing the same state |
| M7: Beta hardening | Tests, migrations, monitoring, backup/restore, privacy and usability | M0–M6 | The closed-beta release checklist passes |

## MVP non-goals

- Maps, tokens, fog of war, voice, video, or campaign chat.
- Replacing physical dice or requiring digital rolls.
- Reproducing proprietary books or a complete commercial spell compendium.
- Full game-system rules automation.
- A public marketplace for custom content.
- Shops and purchasing workflows.
- A reusable creature compendium or encounter-template library.
- Offline writes.
- Public self-service registration.

# 2. Post-MVP experience enhancements

These items should be prioritized using closed-beta feedback rather than assumed to be equally valuable.

## 2.1 Deeper character management

- Abilities, skills, defenses, level progression, and richer resource tracking.
- Equipment categories, containers, attunement, item attachments, and history.
- Reusable character templates that do not force every campaign into one system.
- Character transfer, export, and import.
- A clearer comparison between base character values and campaign overrides.

## 2.2 Richer spell workflows

- Class-aware spell discovery and preparation limits where appropriate.
- Spell list bulk management and preparation templates.
- Better component and concentration reminders.
- Additional appropriately licensed data sources.
- Multilingual catalog support where the source and product experience support it.
- Campaign-shared custom spells with explicit DM approval and visibility.

## 2.3 DM preparation tools

- User-authored or appropriately licensed creature references.
- Campaign-specific creature variants and notes.
- Reusable encounter templates.
- Session notes, pinned references, and preparation checklists.
- More granular DM-only and player-facing visibility controls.

## 2.4 In-world shops

- Shop creation, stock, quantities, pricing, and availability.
- Player-facing shop browsing controlled by the DM.
- Optional purchase workflows that update shop stock and character inventory.
- Transaction history and reversible corrections.

## 2.5 Faster shared-table updates

- Server-sent events, WebSockets, or another validated push mechanism.
- Presence indicators for people currently viewing a campaign or encounter.
- Optimistic updates with explicit conflict recovery.
- Recent-change indicators and limited audit history.
- Installable PWA behavior and targeted poor-connectivity resilience.

## 2.6 Optional roll utilities

- Simple dice expressions and campaign-scoped roll history.
- Character-linked modifiers after the underlying system-neutral model is proven.
- Private and shared rolls where campaign visibility rules are explicit.
- Continued support for tables that use only physical dice.

## 2.7 Campaign and account administration

- Campaign ownership transfer.
- Richer role and permission controls.
- Account and campaign data export.
- Additional working sign-in methods.
- Self-service account deletion.
- Public signup only after the closed beta demonstrates operational readiness.

# 3. Implementation guidance

## Expected code surface

Roadmap work lands in `apps/web`, the product application. `apps/docs` is the separate public marketing and documentation site; it carries no roadmap features, only the pages that describe them.

- `apps/web/src/app/` — public entry, auth, beta gate, campaign, character, spellbook, party, and encounter routes.
- `apps/web/src/components/` — application shell and domain-specific components.
- `apps/web/src/server/db/schema/` — beta access, campaign, invitation, membership, character, override, inventory, spellbook, and encounter tables.
- `apps/web/src/server/api/routers/` — routers for each domain, composed into the application router.
- `apps/web/src/server/api/` — reusable campaign-membership, role, ownership, and beta-access authorization.
- `apps/web/src/server/integrations/` — the external spell-catalog adapter and email provider integration.
- `apps/web/src/env/server.ts` and `apps/web/.env.example` — updated together for email, monitoring, or other server configuration.
- Drizzle migration output — generated, reviewed, and committed for shared and deployed environments.
- Test files — follow the selected repository test convention, beginning with security-sensitive services and state transitions.
- `packages/ui/` — only broadly reusable presentation primitives; application-specific components remain in `apps/web`.
- `apps/docs/` — landing page, marketing pages, and user-facing documentation for released capabilities; never product features or campaign data.

## Data and authorization rules

The normal authorization path for campaign data is:

```text
authenticated session
  → approved beta user
  → active campaign membership
  → campaign role or character ownership
  → requested resource
```

Additional rules:

- Campaign roles belong to memberships, not Better Auth's site-wide role field.
- Campaign-owned records must carry or resolve to a campaign ID.
- Server responses must omit unauthorized fields entirely.
- A client-provided user ID, campaign ID, role, or encounter revision is input to verify, never proof of authority.
- Campaign overrides need provenance and must be reversible.
- Invitation tokens and codes must not be stored in retrievable plaintext where a hash can be used.
- Destructive actions should prefer archival or another recoverable state when practical.

## External dependency rules

- Call the spell API from the server rather than coupling browser components directly to it.
- Set explicit timeouts and treat upstream errors as recoverable.
- Cache selected spell details with source and version metadata.
- Avoid fetching the entire catalog on every page load.
- Test the UI against timeouts, malformed responses, missing spells, and upstream changes.
- Keep custom spell content private to its owner and authorized campaign members.
- Document attribution and licensing decisions before distributing cached source content.

# 4. Validation strategy

## Automated checks

- Run `pnpm check-types`.
- Run `pnpm check` and inspect Biome's safe fixes.
- Run `pnpm build`.
- Test invitation creation, acceptance, expiry, revocation, wrong-recipient handling, and member removal.
- Test authorization as a site administrator, campaign DM, character owner, other player, removed member, approved non-member, unapproved account, and signed-out user.
- Test campaign override creation, replacement, merge behavior, provenance, removal, and cross-campaign isolation.
- Test spell adapter parsing, cache behavior, custom spells, and upstream failure handling.
- Test encounter ordering, ties, advancement, reverse movement, round changes, stale revisions, and conflicting mutations.

## Manual release checks

- Complete onboarding and campaign joining with separate accounts.
- Accept one invite by link/code and another by email.
- Remove a player and verify access is lost immediately.
- Prepare a character and spellbook from a phone-sized viewport.
- Apply and remove a DM override and verify the base character remains unchanged.
- Disconnect the spell API and verify saved prepared spells remain usable.
- Run an encounter with one DM and multiple player views.
- Verify every participant converges on the same encounter revision.
- Exercise keyboard navigation, focus visibility, labels, error association, contrast, zoom, and screen-reader names.
- Verify logs and error reports do not expose credentials, invitation tokens, private notes, or spell content unnecessarily.
- Perform and document a database backup and restore.

## Closed-beta success signals

Exact targets can be set when the beta group size is known. At minimum, measure:

- Invited users who successfully join a campaign.
- Groups that create a character, save spells, and start an encounter.
- Time and failure rate for invitation acceptance.
- Frequency of failed or conflicting encounter updates.
- Upstream spell API failures and cache effectiveness.
- Support requests involving permissions, missing data, or unclear overrides.
- Qualitative feedback on whether Tablekeep reduced bookkeeping without distracting from play.

