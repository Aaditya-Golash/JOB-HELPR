// Duplicate-application detection, adapted from career-ops's dedup-tracker.mjs
// (santifer/career-ops, MIT licensed) — see /NOTICE.md and /CONFLICTS.md at
// the repo root. The original dedupes rows in a local applications.md file;
// this version is storage-agnostic and checks against whatever store.ts
// already has before a new entry is saved.

// Status advancement order (higher = more advanced in the pipeline). Not
// currently used to block a save, but kept here so callers can compare
// how far along an existing match already is before deciding what to do.
export const STATUS_RANK: Record<string, number> = {
  shortlisted: 0,
  materials_ready: 1,
  outreach_drafted: 2,
  applied: 3,
};

// Strips common legal-entity suffixes and punctuation/spacing differences so
// "Bell Canada" and "Bell Canada Inc." collapse to the same key. Deliberately
// does NOT strip all parenthetical content -- an earlier version of this
// logic did, and a regional qualifier like "(Canada)" was discarded along
// with it, breaking the distinction between "Bell (Canada)" and "Bell
// (Mexico)". Caught by testing against real-shaped inputs.
export function normalizeCompany(name: string): string {
  return String(name ?? "")
    .toLowerCase()
    .replace(/\b(incorporated|inc|corporation|corp|limited|ltd|llc|co)\.?\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeJobTitle(title: string): string {
  return String(title ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

// Only flags a match when both company and full job title match after
// normalization -- deliberately conservative, so it never silently blocks a
// legitimately different role at the same company.
export function findLikelyDuplicate<T extends { company: string; jobTitle: string }>(
  existing: T[],
  candidate: { company: string; jobTitle: string },
): T | null {
  const company = normalizeCompany(candidate.company);
  const jobTitle = normalizeJobTitle(candidate.jobTitle);
  return (
    existing.find(
      (e) => normalizeCompany(e.company) === company && normalizeJobTitle(e.jobTitle) === jobTitle,
    ) ?? null
  );
}
