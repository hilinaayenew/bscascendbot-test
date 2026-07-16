/**
 * Compute a 0-100 profile completion score used by the onboarding
 * dialog and dashboard "profile strength" widget.
 */
export type ProfileLike = {
  full_name?: string | null;
  bio?: string | null;
  country?: string | null;
  phone?: string | null;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  avatar_url?: string | null;
  expertise?: string[] | null;
  interests?: string[] | null;
};

type Check = { key: string; label: string; weight: number; done: boolean };

export function profileChecks(p: ProfileLike | null | undefined): Check[] {
  const v = p || {};
  const has = (s?: string | null) => !!(s && s.trim().length > 0);
  const arr = (a?: string[] | null) => Array.isArray(a) && a.length > 0;
  return [
    { key: "avatar", label: "Add a profile photo", weight: 10, done: has(v.avatar_url) },
    { key: "name", label: "Add your full name", weight: 10, done: has(v.full_name) },
    { key: "bio", label: "Write a short bio", weight: 15, done: has(v.bio) && (v.bio || "").trim().length >= 40 },
    { key: "country", label: "Set your country", weight: 10, done: has(v.country) },
    { key: "phone", label: "Add a contact phone", weight: 10, done: has(v.phone) },
    { key: "linkedin", label: "Link your LinkedIn", weight: 10, done: has(v.linkedin_url) },
    { key: "portfolio", label: "Add a portfolio link", weight: 5, done: has(v.portfolio_url) },
    { key: "expertise", label: "Pick your technical skills", weight: 15, done: arr(v.expertise) },
    { key: "interests", label: "Pick your soft skills", weight: 15, done: arr(v.interests) },
  ];
}

export function profileStrength(p: ProfileLike | null | undefined): number {
  const checks = profileChecks(p);
  const total = checks.reduce((sum, c) => sum + c.weight, 0);
  const done = checks.filter((c) => c.done).reduce((sum, c) => sum + c.weight, 0);
  return Math.round((done / total) * 100);
}