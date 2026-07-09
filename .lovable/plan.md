

## Goal

Close the small remaining gaps from your local sync. Most of what you listed is already in place — only one real fix is needed (Profile portfolio link), plus an optional avatar polish in Admin.

## Current state (verified against the codebase)

| Item | Status |
|---|---|
| `AdminPairingsManagement.tsx` | Already exists — no placeholder needed |
| `AdminWorkshops.tsx` | Already exists — no placeholder needed |
| `resolveAvatarUrl` in `src/lib/utils.ts` | Already present (handles Google Drive + Supabase storage paths) |
| `Explore.tsx` uses `resolveAvatarUrl` | Done |
| `Profile.tsx` uses `resolveAvatarUrl` | Done |
| `ProfilePreview.tsx` uses `resolveAvatarUrl` | Done |
| Admin Camera icon + direct upload | Done (`handleAdminAvatarUpload`) |
| `fetchAll()` after upload | Done (called inside upload handler) |
| LinkedIn link absolute (`https://` prepend) | Done in `Profile.tsx` and `ProfilePreview.tsx` |
| Portfolio link in `Profile.tsx` | **Missing** — only LinkedIn is rendered |

## Changes to apply

### 1. `src/pages/Profile.tsx` — add portfolio link

- Add `portfolio_url: string | null` to the `ProfileData` interface.
- Include `portfolio_url` in the `profiles` SELECT query.
- Add a `portfolio_url` field on each entry in the `mockUsers` array (set to `null`).
- In the contact links block (next to the LinkedIn link), render a Portfolio link when `profileData.portfolio_url` is set, using the same `startsWith("http") ? url : ` + "https://" + url` absolute-URL guard already used for LinkedIn, with a `Globe` icon from `lucide-react`.

### 2. `src/pages/Admin.tsx` — show avatar thumbnail in All Users (small polish)

In the "All Users" tab, replace the plain-text user name block with a small avatar thumbnail (using `resolveAvatarUrl(u.avatar_url)`) next to the name, so admins can see whether an upload succeeded without leaving the page. The Camera button stays as-is.

## Out of scope / not doing

- No new placeholder `AdminPairingsManagement` / `AdminWorkshops` files — the real ones already exist and are wired in. Creating placeholders would overwrite working features.
- No changes to `resolveAvatarUrl` — current implementation already handles Google Drive `/d/<id>/` and `id=<id>` URL forms plus Supabase storage paths.
- No DB / migration changes — `portfolio_url` already exists on `profiles` (used by Settings and ProfilePreview).

