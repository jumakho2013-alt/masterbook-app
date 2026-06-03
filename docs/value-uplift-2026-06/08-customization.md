# Notion-grade customization for MasterBook

## North star

Notion's lesson: **everything is a block, but newcomers see a page.** Airtable's lesson: **every field has a type, but the type chooser is one tap.** Linear's lesson: **opinionated defaults beat configuration.** Coda's lesson: **formulas are powerful but die in mobile.**

MasterBook's translation: **profession-pack on first run gives instant "this app gets me" feeling. Custom fields live behind a single "Customize" entry point in Settings, not scattered across the UI. Free users never see a custom-field UI. PRO users see one button per entity ("Add field to clients") that opens a 3-tap flow. ELITE adds formulas, saved views, and pack sharing.**

The goal is not to become Notion. It is to feel like a **CRM that fits your trade exactly**, which is something Notion/Airtable can never be because they require setup. We ship the setup pre-built.

## 1. Data model — Supabase

**Schema-on-read with JSONB**, but typed metadata table so we can index, validate, and migrate.

```sql
-- field definitions per workspace
create table custom_fields (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  entity text not null check (entity in ('client','appointment','service')),
  key text not null,                    -- snake_case, stable
  label text not null,                  -- user-facing, localizable
  type text not null check (type in ('text','number','date','select','multiselect','phone','url','file','formula','lookup','boolean')),
  config jsonb not null default '{}',   -- {options:[...], precision:2, formula:"..."}
  position int not null default 0,
  required boolean not null default false,
  show_in_list boolean not null default false,
  pack_id uuid references profession_packs(id),  -- traceability
  pack_version int,
  created_at timestamptz default now(),
  unique(workspace_id, entity, key)
);

-- values: one row per entity instance, jsonb of {key: value}
alter table clients      add column custom jsonb not null default '{}';
alter table appointments add column custom jsonb not null default '{}';
alter table services     add column custom jsonb not null default '{}';

-- searchable: GIN index on custom + generated columns for hot fields
create index clients_custom_gin on clients using gin (custom jsonb_path_ops);

-- profession packs (read-only catalog + user copies)
create table profession_packs (
  id uuid primary key,
  slug text unique not null,           -- 'manicure','tutor','vet','mechanic'
  name jsonb not null,                 -- {ru:"Маникюр", en:"Manicure"}
  version int not null,
  author_id uuid,                      -- null = official; uuid = community
  is_public boolean default false,
  payload jsonb not null,              -- fields, statuses, services, templates
  installs int default 0,
  created_at timestamptz default now()
);

-- statuses are first-class because they drive workflow
create table statuses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  entity text not null,                -- usually 'appointment'
  key text not null,
  label jsonb not null,
  color text,
  position int not null,
  is_terminal boolean default false,
  unique(workspace_id, entity, key)
);
```

**Why JSONB, not EAV.** EAV (entity-attribute-value) tables explode JOINs and are slower at the scale we'd ever reach (single-user data, ≤50k rows). JSONB gives us GIN indexes, atomic upserts, RLS works unchanged. Notion uses a property-bag; Airtable uses columnar storage; for a phone-first CRM with low row counts, JSONB wins.

**Schema-on-write hybrid.** `custom_fields` is the truth — validation happens client-side and via a Postgres trigger that rejects unknown keys when `strict_mode = true` (default off for forward compat). This means upstream pack updates that add new fields don't reject old client writes.

## 2. Visibility model

Three tiers, mapped to entitlements:

| Tier | Custom fields | Statuses | Pack install | Pack create | Formulas | Saved views | Marketplace |
|---|---|---|---|---|---|---|---|
| **Free (≤30 clients)** | 0 | default only | 1 (locked after install) | – | – | – | – |
| **PRO (299₽/mo)** | 5 per entity | up to 6 custom | unlimited | private | – | 3 | browse only |
| **ELITE (~599₽/mo)** | unlimited | unlimited | unlimited | public/share | yes | unlimited | publish |

This makes ELITE a real upgrade, not a fake one. PRO users hit the "5 fields" wall when they're already invested → strong conversion signal. Notion did this with "blocks" (free unlimited, but team features paywalled); we mirror it on field-count which is the actual power dial.

Free users **never see** custom-field UI elements. The "Customize" entry in Settings is hidden until a profession pack with ≥1 custom field is selected, OR shows a paywall.

## 3. Field types — v1 vs v2

**v1.2 (paid launch):** `text`, `number`, `date`, `select`, `multiselect`, `phone`, `url`, `boolean`. These cover ~95% of trades: pet breed (select), car plate (text), exam grade (number), allergens (multiselect), portfolio link (url), is-vegan (boolean).

**v1.3:** `file` (already have photo storage, generalize), `lookup` (read-only from another entity — e.g. on appointment, show client's allergies).

**v1.4 (ELITE):** `formula` (calculated). Mobile-safe subset: arithmetic, string concat, date math, `if`, `sum`, `count`. No nested formulas. Evaluated client-side via a sandboxed evaluator (e.g. `expr-eval`). Server re-evaluates on write for indexed formula fields.

**Never:** rollups across workspaces, scripting, automation. Those are different products.

## 4. Templates / profession packs

Each pack is a JSON document:

```ts
type ProfessionPack = {
  slug: string;
  name: LocalizedString;
  version: number;
  icon: string;
  fields: CustomFieldDef[];           // typed, validated
  statuses: StatusDef[];
  services: ServiceTemplate[];        // name, default price, default duration
  reminderTemplates: ReminderTemplate[];  // {trigger:'1h_before', text:"..."}
  documentTemplates: DocumentTemplate[];  // receipt/contract markdown
  defaultViews?: SavedView[];         // ELITE
};
```

**Bundled official packs (v1.2):** manicure, brows, lashes, hair, massage, tutor, photographer, mechanic, vet, fitness-coach, tattoo, cleaner, plumber, music-teacher, lawyer, IT-freelancer. 16 packs covers ~80% of self-employed CIS market.

**Pack install** is idempotent: it diffs current workspace state vs pack, shows the user a preview ("This will add 3 fields and 2 statuses"), then applies. **Never** destroys user data on install or update — only adds. Removal is explicit.

**Pack updates** (upstream version bump): non-breaking changes (new optional field) auto-apply with a toast. Breaking changes (field type change, removed status) require user confirmation with migration preview.

## 5. UI flow

**First-run:**
1. Pick profession → pack auto-installs → user lands in a Clients screen with profession-correct fields already there. No "configure your CRM" step.
2. A subtle banner: "We set this up for {profession}. Tweak anytime in Settings → Customize." Dismissible.

**Daily use:** zero customization UI visible. The 4 default client fields look like always; profession-pack fields look identical, just below them.

**Customize (Settings → Customize, PRO-gated):**
- Three tabs: Clients / Appointments / Services
- Each shows current fields with drag-to-reorder, edit, delete
- "+ Add field" → bottom sheet: name → type → (type-specific config) → save
- Total 3 taps from Settings to a working new field

**Statuses** live next to Appointments tab. Drag to reorder pipeline, tap to rename, color-pick.

This pattern (hidden by default, one entry point when wanted) is the Linear playbook. Notion's mistake on mobile is exposing the block-menu everywhere; we won't.

## 6. Backward compatibility

**Field type change:** allowed only if safe (text→url, text→phone always safe; number→text safe; anything→text safe). Unsafe changes (select→number) require a migration screen: "12 clients have values that won't fit. Discard / Keep as text / Cancel." Idempotent.

**Field deletion:** soft-delete first (`deleted_at` on `custom_fields`). Values stay in JSONB for 90 days, can be restored. Then hard-purge via background job.

**Pack upgrade with renamed field:** pack manifest declares `migrations: [{from:"old_key", to:"new_key"}]`. Apply on update.

**Schema migrations on app side:** versioned via existing Supabase migration pattern. Each pack ships with its own version chain.

Concrete rule from CLAUDE.md item #4: every `up` has a working `down`. For `custom_fields` table, down is trivial (DROP). For added columns, down preserves data in an `archived_custom` JSONB before drop, so user can restore via support.

## 7. Indexing and search

**GIN index on `custom` JSONB** → all custom fields searchable out-of-box, ~10ms on 10k rows.

**"Pin to list view"** toggle per field (`show_in_list`) — appears as a column in the client list, free-text searchable from the existing search bar. Max 2 pinned for mobile readability.

**Filter chips** on client list: each `select` / `multiselect` / `boolean` field becomes a filter chip. Tutor pins "grade" → filter chips for "A/B/C" appear above list. This is the killer feature for vets, tutors, mechanics — they need to slice client lists by domain criteria.

## 8. Power-user features (ELITE)

**Formulas.** Client-side `expr-eval` sandbox + Postgres `plv8` for server eval on indexed fields. Examples:
- `total_revenue` = `sum(appointments.price where status='done')`
- `visits_this_year` = `count(appointments where year(date)=year(today()))`
- `loyalty_tier` = `if(visits_this_year >= 12, "VIP", if(visits_this_year >= 6, "Regular", "New"))`

**Lookups.** Read-only fields that pull from related entities. On `appointment`, show `client.allergies`. No transitive lookups (mobile UX dies).

**Saved views.** Stored filter + sort + pinned-fields combo. Examples ship with packs:
- Vet: "Due for vaccination" (last_vaccination + 365 < today)
- Tutor: "Falling behind" (avg_grade < 70)
- Mechanic: "Service overdue" (last_service + 180 < today)

These are pure JSONB filters on `custom`, no new tables. Saved view = `{name, entity, filters, sort, pinned_fields}`.

## 9. Constraint design

The tier table above. Key UX decisions:

- **Free users never see "you can't"** — the Customize entry point itself is hidden. Free users see professional pack defaults applied; they just can't add fields. Avoids paywall fatigue.
- **PRO hits a soft ceiling at 5** — when adding 6th: friendly upsell "Add unlimited fields with ELITE." Not aggressive. The 5-limit is per entity (5 client + 5 appointment + 5 service), generous in practice.
- **Pack-bundled fields don't count against the limit.** If the vet pack ships 8 fields, all 8 work on PRO. Only fields the user adds personally count. This makes packs valuable and avoids penalty for picking a thorough pack.

## 10. Keeping single-profession path frictionless

**Defaults off, reveal on demand.** Anyone who picks "Manicure" gets the current MasterBook experience exactly — same 4 client fields, same screens, same speed. The pack just pre-fills services and reminder text.

**No "advanced mode" toggle.** Notion's killer mistake was making "databases" a separate entity from "pages." We have one mode that's progressively powerful.

**Custom fields render inline** in existing screens, not behind tabs or accordions. A vet sees `Pet breed` right under `Phone number`, same visual weight. Adding a field doesn't restructure the UI.

**Performance budget:** a screen with 0 custom fields renders the same as today (zero overhead). A screen with 5 custom fields adds <50ms. Pre-fetch field defs at app start, cache in Zustand.

## 11. Sharing economy — community marketplace

**ELITE-only publishing**, free browsing. Each user can publish their pack as public; others install with one tap.

**Why ELITE for publish:** quality control via friction + incentive to upgrade. Browse is free because installed packs drive retention.

**Trust mechanisms:** install count, last-updated, verified-author badge for paying users with ≥3-month tenure, screenshots required. Auto-reject packs that include external URLs or PII patterns.

**Revenue split (v2.0):** authors of high-install packs get free ELITE + revenue share. Pack of the month featured. This is **Notion's templates gallery** done right (Notion's is free; ours is curated and tied to retention).

**Differentiation moat:** once a vet community has 5 great vet-packs, leaving MasterBook costs them workflow knowledge. This is how Notion locked in PMs and how Airtable locked in ops teams.

## 12. Implementation — concrete

**TypeScript types** in `src/types/customFields.ts`:

```ts
export type FieldType = 'text'|'number'|'date'|'select'|'multiselect'
  |'phone'|'url'|'file'|'formula'|'lookup'|'boolean';

export interface CustomFieldDef {
  id: string;
  entity: 'client'|'appointment'|'service';
  key: string;
  label: LocalizedString;
  type: FieldType;
  config: FieldConfig;          // discriminated union per type
  position: number;
  required: boolean;
  showInList: boolean;
  packId?: string;
  packVersion?: number;
}

export type CustomValues = Record<string, unknown>;
```

**Files to touch:**

- `src/types/customFields.ts` — new
- `src/types/professionPack.ts` — new
- `src/store/customFieldsStore.ts` — Zustand slice, AsyncStorage-backed
- `src/store/packStore.ts` — installed packs + active pack
- `src/components/fields/` — `FieldRenderer.tsx` dispatches by type → `TextField`, `SelectField`, etc. (8 components in v1.2)
- `src/screens/Settings/CustomizeScreen.tsx` — entry point, PRO-gated
- `src/screens/Settings/EditFieldScreen.tsx` — add/edit single field
- `src/screens/Onboarding/ProfessionScreen.tsx` — exists, extend to load pack
- `src/services/packService.ts` — install / update / diff
- `src/services/formulaEvaluator.ts` — v1.4
- `src/lib/validation/customFieldSchema.ts` — Zod schemas per type
- `supabase/migrations/00X_custom_fields.sql` — schema above + RLS
- `supabase/migrations/00X_profession_packs.sql` — catalog
- `packs/*.json` — 16 bundled packs, loaded as static assets

**RLS:** `custom_fields` and `statuses` filtered by `workspace_id = auth.uid()` (or workspace membership in v1.5). Packs: `is_public=true OR author_id=auth.uid()`.

**Release plan:**
- **v1.2** ship JSONB columns, 8 field types, 16 packs, Customize screen behind PRO. Statuses configurable.
- **v1.3** marketplace browse, file/lookup fields, pin-to-list, filter chips.
- **v1.4** formulas, saved views, ELITE tier launches.
- **v1.5** marketplace publish, team-shared packs.

**Self-review per CLAUDE.md:** cross-layer (client validates → trigger validates), cleanup (no listeners added), error paths (unknown field → silent ignore in non-strict, error in strict), reversibility (every migration has down preserving data), edge cases (empty pack, conflicting keys on install, pack version downgrade rejected), self-grep (existing `Client` type extended not replaced — check all 30+ usages), read-side contract (form writes `custom.pet_breed`, list reads `custom.pet_breed`, search indexes `custom`).

This makes MasterBook the **only CRM where a vet, tutor, and manicurist all feel "this app was built for me"** — at a price that, with formulas and marketplace, becomes a steal.