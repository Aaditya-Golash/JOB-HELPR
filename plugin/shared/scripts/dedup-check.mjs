#!/usr/bin/env node
/**
 * dedup-check.mjs — duplicate-application detection for the tracker skill.
 *
 * Adapted from career-ops's dedup-tracker.mjs (santifer/career-ops, MIT
 * licensed). The original dedupes rows in a local applications.md file; this
 * version is storage-agnostic — it takes the list already returned by
 * job-pipeline-mcp's `list_applications` tool and flags likely duplicates
 * before a new entry is saved, rather than merging rows after the fact.
 *
 * NOTE: job-pipeline-mcp's `save_application` tool now runs this same check
 * server-side (see mcp/lib/dedup.ts) and returns `likelyDuplicateOf` directly
 * in its response — this file exists as the reference implementation and a
 * fallback for anything calling the tracker skill without going through
 * save_application's own response.
 *
 * Usage (called from the tracker skill, not run standalone):
 *   import { findLikelyDuplicate, STATUS_RANK } from './dedup-check.mjs';
 *   const dup = findLikelyDuplicate(existingApplications, { company, jobTitle });
 */

// Status advancement order (higher = more advanced in the pipeline), matching
// the status enum job-pipeline-mcp's save_application tool actually accepts.
export const STATUS_RANK = {
  shortlisted: 0,
  materials_ready: 1,
  outreach_drafted: 2,
  applied: 3,
};

/**
 * Normalize a company name into a grouping key, stripping common legal-entity
 * suffixes (Inc., Ltd., LLC, Corp.) and punctuation/spacing differences, so
 * "Bell Canada" and "Bell Canada Inc." collapse to the same key. Deliberately
 * does NOT strip all parenthetical content - an earlier version did, and a
 * regional qualifier like "(Canada)" was being discarded along with it,
 * which broke matching against a variant of the same name without the
 * qualifier. Caught by testing this against real-shaped inputs, not assumed.
 */
export function normalizeCompany(name) {
  return String(name ?? '')
    .toLowerCase()
    .replace(/\b(incorporated|inc|corporation|corp|limited|ltd|llc|co)\.?\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Normalize a job title for comparison: case- and whitespace-insensitive. */
function normalizeJobTitle(jobTitle) {
  return String(jobTitle ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Look for an existing application that's likely the same as the one about
 * to be saved. Only flags a match when both company and full job title match
 * after normalization — deliberately conservative, so it never silently
 * blocks a legitimately different role at the same company.
 *
 * @param {Array<{company: string, jobTitle: string, status?: string}>} existing
 * @param {{company: string, jobTitle: string}} candidate
 * @returns {object|null} the existing entry it collides with, or null
 */
export function findLikelyDuplicate(existing, candidate) {
  const company = normalizeCompany(candidate.company);
  const jobTitle = normalizeJobTitle(candidate.jobTitle);
  return (
    existing.find(
      (e) => normalizeCompany(e.company) === company && normalizeJobTitle(e.jobTitle) === jobTitle,
    ) ?? null
  );
}
