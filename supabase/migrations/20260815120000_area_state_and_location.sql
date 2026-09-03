-- ============================================================================
-- v4 area model — state for the area lifecycle, plus location
--
-- ⚠️  NOT YET APPLIED. This file is written and ready; it has not been pushed.
--     `supabase db push` runs against the shared database, which AGENT.md says
--     to ask about first. Apply deliberately, not as a side effect.
--
-- Covers storyboard ISSUE-008, ISSUE-014 and ISSUE-016. Bundled into one
-- migration because each one otherwise costs a separate round of asking.
--
-- All columns are nullable with no default beyond the array cases, so existing
-- rows stay valid and the current code keeps working untouched — nothing reads
-- these until Phase 2 ships.
-- ============================================================================

-- ── ISSUE-008 · Which area is open, and what has been covered ───────────────
-- Today the only stored context is a single overwritable career_topic, with no
-- memory of what was discussed and no concept of an area being open or closed.

ALTER TABLE public.coach_user_profiles
  ADD COLUMN IF NOT EXISTS active_area text,
  ADD COLUMN IF NOT EXISTS area_opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS covered_facets text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS closed_areas text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.coach_user_profiles.active_area IS
  'Discussion area currently open (area key, e.g. ''salary''), or NULL when outside any area — storyboard STATE A.';
COMMENT ON COLUMN public.coach_user_profiles.area_opened_at IS
  'When the active area was entered. Used to spot stalled areas.';
COMMENT ON COLUMN public.coach_user_profiles.covered_facets IS
  'Facet IDs already answered (e.g. {S1,G4,G4a}). Kept across close/re-entry so a returning user resumes rather than restarts.';
COMMENT ON COLUMN public.coach_user_profiles.closed_areas IS
  'Areas explicitly closed, so the coach can offer what has not been covered yet.';

-- ── Stall + wrap-up tracking (Phase 4 port) ─────────────────────────────────
-- The local test harness (scripts/coach-local.mjs) keeps these three fields in
-- an in-memory `state` object that starts fresh every run. A stateless edge
-- function has nowhere to keep them between requests without a column each —
-- without stall_count, "two turns with nothing new added" can never be
-- detected across a request boundary; without last_stage, every turn looks
-- like a stage change; without wrapped_up, the coach could re-offer to finish
-- every single turn instead of exactly once before closing.

ALTER TABLE public.coach_user_profiles
  ADD COLUMN IF NOT EXISTS stall_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wrapped_up boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_stage text;

COMMENT ON COLUMN public.coach_user_profiles.stall_count IS
  'Consecutive turns in the active area with no new information added. Reset to 0 whenever a turn adds something; two in a row triggers the wrap-up (if the area has one) or closes the area.';
COMMENT ON COLUMN public.coach_user_profiles.wrapped_up IS
  'Whether the coach has already offered to finish the active area once. A second stall after this closes the area rather than offering again. Reset whenever an area is (re-)entered.';
COMMENT ON COLUMN public.coach_user_profiles.last_stage IS
  'The stage letter from the most recent classification in the active area, so the stall check can tell a repeated stage from a genuine change. NULL outside an area.';

-- ── ISSUE-014 · Location ───────────────────────────────────────────────────
-- S1 asks "What role and location?" and routing rule 3 names location as
-- capturable, but there has never been anywhere to put it. Salary advice
-- depends on it more than on anything else — and Phase 4's web search cannot
-- ask "what does this role pay in <city>" without it.

ALTER TABLE public.coach_user_profiles
  ADD COLUMN IF NOT EXISTS location text;

COMMENT ON COLUMN public.coach_user_profiles.location IS
  'City and/or country, as the user gave it. Drives market-rate advice and is a required input for the W-marked facets.';

-- ── Who she is, in prose ───────────────────────────────────────────────────
-- A fixed set of variables can only hold what somebody anticipated. The five
-- we have — career_stage, current_background, target_role, goals, challenges —
-- cannot hold "she found out a male colleague earns more, saw it on a document
-- she was not meant to open, and does not want to seem difficult", which is
-- precisely the sort of thing a mentor would remember and act on.
--
-- So: two short paragraphs the coach maintains, alongside the variables rather
-- than instead of them. The variables stay useful for anything that has to be
-- queried or filtered; the prose carries the situation.
--
-- Rules that go with these, enforced in the prompt that writes them:
--   • record only what she has said — never infer, never embellish
--   • keep each to a few sentences; this is a memory, not a file on her
--   • rewrite in full each time rather than appending, so it stays readable

ALTER TABLE public.coach_user_profiles
  ADD COLUMN IF NOT EXISTS situation text,
  ADD COLUMN IF NOT EXISTS aims text,
  ADD COLUMN IF NOT EXISTS profile_updated_at timestamptz;

COMMENT ON COLUMN public.coach_user_profiles.situation IS
  'Where she is now, in prose: role, place, what is happening with her pay or job right now. Written by the coach from what she has said. Never inferred.';
COMMENT ON COLUMN public.coach_user_profiles.aims IS
  'What she is trying to do, in prose: where she wants to get to, what is in her way, what she has already tried.';
COMMENT ON COLUMN public.coach_user_profiles.profile_updated_at IS
  'When the prose was last rewritten — distinct from updated_at, which moves whenever any field changes.';

-- ── ISSUE-016 · challenges ─────────────────────────────────────────────────
-- The column exists, is typed on UserProfile, and is SELECTed in index.ts —
-- but captureUserBackground.updateContext() never writes it, so it is always
-- empty. Documenting rather than dropping: the field is wanted, the write is
-- simply missing, and dropping it would need a matching code change.

COMMENT ON COLUMN public.coach_user_profiles.challenges IS
  'NOT CURRENTLY POPULATED — captureUserBackground does not write this (ISSUE-016). Wire up the write or drop the column; do not assume it holds data.';

-- ── Lookup cache for Phase 4 ───────────────────────────────────────────────
-- Market-rate lookups are identical for every user asking about the same role
-- in the same place, so they are cached globally rather than per user. Keeps
-- the search bill flat as usage grows, and keeps answers consistent between
-- two people asking the same question in the same week.

CREATE TABLE IF NOT EXISTS public.coach_market_lookups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  location text NOT NULL,
  snippets jsonb NOT NULL,          -- [{ text, source, published }]
  fetched_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  UNIQUE (role, location)
);

COMMENT ON TABLE public.coach_market_lookups IS
  'Cached web-search results for W-marked facets. Shared across users — a rate lookup is not personal data. Each snippet keeps its source and publication date so answers can cite both.';

CREATE INDEX IF NOT EXISTS coach_market_lookups_lookup_idx
  ON public.coach_market_lookups (role, location, expires_at DESC);

-- Cached public rate data, not user data: readable by any signed-in user,
-- written only by the edge function via the service role.
ALTER TABLE public.coach_market_lookups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users can read market lookups"
  ON public.coach_market_lookups
  FOR SELECT TO authenticated
  USING (true);
