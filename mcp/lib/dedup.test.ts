import { describe, it, expect } from "vitest";
import { normalizeCompany, findLikelyDuplicate } from "./dedup";

describe("normalizeCompany", () => {
  it("strips common legal-entity suffixes", () => {
    expect(normalizeCompany("Bell Canada Inc.")).toBe("bell canada");
    expect(normalizeCompany("Acme Corp")).toBe("acme");
    expect(normalizeCompany("Acme Corporation")).toBe("acme");
    expect(normalizeCompany("Acme Ltd.")).toBe("acme");
    expect(normalizeCompany("Acme LLC")).toBe("acme");
  });

  it("preserves distinguishing parenthetical content instead of stripping it wholesale", () => {
    // Regression test for the bug documented in CONFLICTS.md: an earlier
    // version stripped all parenthetical content, which collapsed distinct
    // regional entities into the same key.
    expect(normalizeCompany("Bell (Canada) Inc.")).toBe("bell canada");
    expect(normalizeCompany("Bell (Mexico)")).toBe("bell mexico");
    expect(normalizeCompany("Bell (Canada) Inc.")).not.toBe(normalizeCompany("Bell (Mexico)"));
  });

  it("is case- and whitespace-insensitive", () => {
    expect(normalizeCompany("  ACME   corp.  ")).toBe(normalizeCompany("Acme Corp"));
  });

  it("handles null/undefined/empty gracefully", () => {
    expect(normalizeCompany("")).toBe("");
    // @ts-expect-error -- exercising runtime guard against non-string input
    expect(normalizeCompany(undefined)).toBe("");
    // @ts-expect-error -- exercising runtime guard against non-string input
    expect(normalizeCompany(null)).toBe("");
  });
});

describe("findLikelyDuplicate", () => {
  const existing = [
    { company: "Bell (Canada) Inc.", jobTitle: "Business Analyst" },
    { company: "TELUS", jobTitle: "Data Analyst II" },
  ];

  it("flags a match when company and job title both normalize the same", () => {
    const dup = findLikelyDuplicate(existing, {
      company: "Bell Canada",
      jobTitle: "Business Analyst",
    });
    expect(dup).not.toBeNull();
    expect(dup?.company).toBe("Bell (Canada) Inc.");
  });

  it("does not flag a different regional entity as a duplicate", () => {
    const dup = findLikelyDuplicate(existing, {
      company: "Bell (Mexico)",
      jobTitle: "Business Analyst",
    });
    expect(dup).toBeNull();
  });

  it("does not flag a different job title at the same company", () => {
    const dup = findLikelyDuplicate(existing, {
      company: "Bell Canada",
      jobTitle: "Data Analyst",
    });
    expect(dup).toBeNull();
  });

  it("is case- and whitespace-insensitive on job title", () => {
    const dup = findLikelyDuplicate(existing, {
      company: "TELUS",
      jobTitle: "  data   analyst II  ",
    });
    expect(dup).not.toBeNull();
  });

  it("returns null against an empty existing list", () => {
    expect(findLikelyDuplicate([], { company: "Anyone", jobTitle: "Anything" })).toBeNull();
  });
});
