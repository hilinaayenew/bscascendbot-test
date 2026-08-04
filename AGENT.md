# AGENT.md

Practical, project-specific notes for any agent working on this repo. Written from what was actually learned working on it — not generic advice.

## What this is

"Ascendency" — a mentorship platform (Because She Can / BSC) connecting African women with tech mentors. Vite + React + TypeScript frontend, Supabase backend (Postgres, Auth, Storage, Realtime, Edge Functions), deployed to Vercel. Includes an AI Career Coach chatbot feature (two personas: Chataki and Botema) as a floating widget on dashboard pages.

## Git remotes — read this before pushing anything

```
origin  https://github.com/hilinaayenew/bscascendbot-test   ← push here
second  git@github-vivid:Vivid-Insights/BSCASCENDBOT-TEST.git ← do NOT push here unless explicitly asked
```

Always push with `git push origin main` explicitly, never a bare `git push`.

**Security — do not touch or commit these files if you see them in the repo root:**
`hilinagithub` (an OpenSSH *private key*), `hilinagithub.pub`, `git` (empty file). These are credential material, not project files. Never `git add -A` in this repo for that reason — stage files explicitly by path.

## Supabase project

- Project ref: `uylxkbcaibhjqcsehcuk` (this repo's own project — there are sibling forks of this app on other Supabase projects; don't confuse them).
- Link with `npx supabase link --project-ref uylxkbcaibhjqcsehcuk` if a fresh session shows "not linked."
- **Ask before running `supabase db push` against the live database** — it's a real, shared production-ish database. Same caution applies to any direct SQL via `supabase db query`.
- As of the last migration push, all local migrations are applied (0 pending) — check with `npx supabase migration list --linked` before assuming otherwise.

## Environment quirks in this sandbox (not project bugs)

- **`github.com` intermittently fails to connect** ("Failed to connect to github.com port 443") while `supabase.com` and other hosts work fine. It's transient — retry the same `git push`/`git fetch` once or twice before treating it as a real problem. Don't spiral into deeper diagnosis over this specific symptom.
- **Direct Postgres connections time out** (`supabase db query`, `supabase migration list` sometimes hang or fail with `PgClient: Connection timed out`) even though `supabase functions deploy/list`, `secrets list`, and `db push` (HTTPS-based) work fine. If a direct DB query keeps failing, either retry once more or ask the user to run the SQL themselves via the Supabase Dashboard → SQL Editor — don't loop retrying indefinitely.
- **No Deno CLI, no Docker available.** Can't run `supabase functions serve` locally or `deno test`. Edge function correctness relies on: ESLint (it parses/catches real syntax errors even in files with `// @ts-nocheck` — type-checking is suppressed, parsing is not), careful manual review, and the Vitest suite for anything that's pure logic with no Deno-specific imports (see Testing below).

## Deploying changes

**Frontend:** `git push origin main` — that's it (Vercel auto-deploys from the repo, per `vercel.json`).

**AI Coach edge function** (anything under `supabase/functions/ai-career-coach/`): after pushing to git, also run:
```bash
npx supabase functions deploy ai-career-coach
```
Git push and Supabase deploy are independent — pushing code does not deploy the edge function, and deploying does not push to git. Do both.

**Before deploying a routing/logic change to the AI Coach**, run the test suite (see below) and ideally verify it via a separate Agent-tool subagent (not just self-reported), per the workflow the user asked for explicitly. Only deploy once that comes back green.

## Testing

`npm test` runs Vitest. It's configured (`vitest.config.ts`) to pick up `src/**/*.{test,spec}.{ts,tsx}` **and** `supabase/functions/**/*.{test,spec}.ts` — the latter was added specifically so the AI Coach's routing logic could get real tests despite living in a Deno-targeted folder.

- `supabase/functions/ai-career-coach/bsc-knowledge.test.ts` — a sync-check for `TOPIC_CATEGORIES` against `KNOWLEDGE_BASE`, guarding the data the routing instructions rely on. The routing *decisions* themselves (narrow vs. answer directly, which topic) are now entirely the AI's judgment — see below — so there's no pure-function routing logic left to unit test; verify behavior changes via manual review + deployment instead.
- This only works because `bsc-knowledge.ts` has zero Deno-specific imports (no `Deno.*`, no `npm:` specifiers) — Vite/Vitest can import it directly. Files that *do* use Deno-specific APIs (`index.ts`, anything calling `Deno.serve`/`Deno.env.get`) can't be unit-tested this way; they need manual review + actual deployment to verify.

## AI Career Coach architecture — key things learned the hard way

Full design doc: `supabase/functions/ai-career-coach/README.md` (keep it updated when the architecture changes — it drifted out of date once already this project and caused confusion).

- **Narrowing is a pure AI judgment call, by design, not a keyword rule.** Rule 5 in `bsc-coach.ts`/`botema-coach.ts`'s routing instructions asks the model to judge, from the message itself: could I give one focused answer right now, or would answering mean covering several genuinely different angles? If the latter, it calls `inviteUserContext` and writes its own tailored `question`/`options` — no fixed phrase list, no deterministic pre-check gating it. This is a deliberate choice: earlier versions used a keyword regex (`isBroadStartingAsk`, since removed) to flag/force this, built because relying on the AI alone was demonstrably unreliable at the time. It kept getting outgrown — first by phrasings it didn't anticipate, then by negation it couldn't parse ("a field that is *not* related to tech" matched "tech" just like a genuine broad ask), then by broad *named* categories ("job search strategy" spans CV/networking/interview prep, but a topic being *named* isn't the same as being *narrow*). Each fix generalized the instruction further rather than patching another regex, until the keyword layer added nothing the instruction didn't already cover on its own — at which point it was removed rather than kept as redundant belt-and-suspenders. If broad-ask misses start recurring, that's a sign the instruction needs sharpening (or the model needs to change), not a sign to bring back a keyword check.
- **Rule 6 (answer directly) also constrains scope, not just rule 5.** Even once a message is judged specific enough to answer, both personas' generation system prompts explicitly say: answer only the one angle actually asked about, don't summarize every related sub-area in the same knowledge topic "just in case." This is what actually fixes long, kitchen-sink answers — narrowing better upstream helps, but the generation step needed its own explicit constraint too.
- **`gpt-5-nano` is a reasoning model.** It can spend its entire `max_completion_tokens` budget on hidden reasoning and return empty visible content with a normal 200 OK — no thrown error. `callAzure()` in both `bsc-functions.ts` and `botema-coach.ts` auto-retries once at double the token budget before falling back to an error string. If you see "I wasn't able to generate a response," check the logs for `finish_reason` before assuming it's a routing bug.
- **Conversation history window is 6 messages** (`history.slice(-6)`), fetched from a pool of the last 10 DB rows. Anything older is gone from context except what's persisted in `coach_user_profiles` (career_stage/background/target_role/goals).
- **Choice buttons are plain text, not a schema change.** `withChoices()` in `converser.ts` appends a `%%CHOICES%%[...]` JSON marker to the message content string; the frontend (`AICoachWidget.tsx`) parses it back out. No new DB column, works with the existing `messages.content` text field.
- Both personas (`bsc-*.ts` files = Chataki, `botema-*.ts` files = Botema) have near-identical structure and need corresponding changes when one is updated — check both, it's easy to fix one and forget the other (happened multiple times this session).

## Collaboration notes

- Deploys (git push + `supabase functions deploy`) happen without re-asking each time once a change is made and verified — the user has established this as the working pattern. Migrations and other schema-affecting DB operations still require asking first.
- The user wants routing/logic changes tested (via the Vitest suite + a separate verification agent) *before* deployment, not after.
