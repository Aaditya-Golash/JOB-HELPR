#!/usr/bin/env node
/**
 * check-ats-connectors.mjs — live connectivity check for the public ATS
 * APIs documented in /plugin/shared/references/job-portals.md.
 *
 * These endpoints aren't code the MCP server calls (job-search is a Claude
 * Code skill, not a service) -- this script exists to verify the documented
 * endpoint shapes are still accurate, since a stale doc here would send the
 * job-search skill down a dead end at runtime. Hits real, public,
 * unauthenticated endpoints for two known boards; not part of `npm test`
 * (network-dependent, would make CI flaky) -- run manually via
 * `npm run check:connectors`.
 */

const CHECKS = [
  {
    name: "Greenhouse",
    url: "https://boards-api.greenhouse.io/v1/boards/gitlab/jobs",
    validate: (json) => {
      if (!Array.isArray(json.jobs)) throw new Error("expected `jobs` array");
      if (json.jobs.length === 0) throw new Error("expected at least one job listing");
      const job = json.jobs[0];
      for (const field of ["id", "title", "absolute_url"]) {
        if (!(field in job)) throw new Error(`expected field '${field}' on a job object`);
      }
      return `${json.jobs.length} jobs, sample: "${job.title}"`;
    },
  },
  {
    name: "Lever",
    url: "https://api.lever.co/v0/postings/ro?mode=json",
    validate: (json) => {
      if (!Array.isArray(json)) throw new Error("expected a top-level array");
      if (json.length === 0) throw new Error("expected at least one posting");
      const posting = json[0];
      for (const field of ["id", "text", "hostedUrl"]) {
        if (!(field in posting)) throw new Error(`expected field '${field}' on a posting object`);
      }
      return `${json.length} postings, sample: "${posting.text}"`;
    },
  },
];

let failures = 0;

for (const check of CHECKS) {
  process.stdout.write(`${check.name} (${check.url}) ... `);
  try {
    const res = await fetch(check.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const detail = check.validate(json);
    console.log(`PASS -- ${detail}`);
  } catch (err) {
    failures++;
    console.log(`FAIL -- ${err.message}`);
  }
}

if (failures > 0) {
  console.log(`\n${failures} connector check(s) failed.`);
  process.exit(1);
} else {
  console.log("\nAll connector checks passed.");
}
