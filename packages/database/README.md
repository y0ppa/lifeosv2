# @brain/database

The single source of truth for Brain's Postgres schema. One migration so far:
[`0001_init_schema.sql`](supabase/migrations/0001_init_schema.sql) — replaces
the old localStorage/`app_state` blob with normalized, RLS-protected tables.

## Apply the migration (no CLI, no extra secrets needed)

1. Open your project at [supabase.com/dashboard](https://supabase.com/dashboard) → **SQL Editor**.
2. Open `supabase/migrations/0001_init_schema.sql` in this folder, copy its full contents.
3. Paste into a new SQL Editor query and click **Run**.
4. Confirm in **Table Editor** that the new tables appear (profiles, workouts, habits, health_records, etc.) and that **Authentication → Policies** shows RLS enabled with `_select_own` / `_insert_own` / etc. policies on each.

That's it — no database password or access token required for this path.

## Alternative: apply via Supabase CLI

Only needed if you'd rather manage migrations from the command line going forward.

```bash
# from the repo root
npx supabase login                              # opens a browser, same device-code flow as `gh auth login`
npx supabase link --project-ref <your-project-ref>   # find the ref in your project's dashboard URL
npm run db:push --workspace packages/database
```

## Generating TypeScript types from the live schema

Once linked:

```bash
npm run gen-types --workspace packages/database
```

This overwrites `types/database.types.ts` with types generated directly from
your actual database, which `packages/shared` re-exports for the mobile app
and any future server routes.

## Adding a new migration later

```bash
npm run migration:new --workspace packages/database -- <name>
```

Creates a new timestamped file under `supabase/migrations/`. Never edit
`0001_init_schema.sql` after it's been applied to a real project — add a new
migration instead.
