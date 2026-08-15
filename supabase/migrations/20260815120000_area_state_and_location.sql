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

-- ── ISSUE-014 · Location ───────────────────────────────────────────────────
-- S1 asks "What role and location?" and routing rule 3 names location as
-- capturable, but there has never been anywhere to put it. Salary advice
-- depends on it more than on anything else — and Phase 4's web search cannot
-- ask "what does this role pay in <city>" without it.

ALTER TABLE public.coach_user_profiles
  ADD COLUMN IF NOT EXISTS location text;

COMMENT ON COLUMN public.coach_user_profiles.location IS
  'City and/or country, as the user gave it. Drives market-rate advice and is a required input for the W-marked facets.';

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
