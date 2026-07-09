// Region-matched mailing address lookup for filling in an actual ATS
// application form field -- deliberately NOT part of profile.ts / the
// resume+cover-letter generators, so an address never ends up baked into a
// generated document by default. Only call this when a specific form field
// asks for a mailing address.
//
// The five real addresses live only in env vars (ADDRESS_*, see
// .env.example), never in this file or anywhere else in the repo -- unlike
// phone/email, a home street address is identifying enough that it
// shouldn't sit in git history even behind a placeholder-fallback pattern.
// If an env var for a matched region isn't set, this returns null rather
// than guessing at an address to hand to a real employer.

type Region = {
  key: string;
  envVar: string;
  // Keyword match is intentionally generous (city + well-known surrounding
  // municipalities) rather than exhaustive -- if a location doesn't match
  // clearly, this returns no match rather than a wrong guess.
  keywords: string[];
};

const REGIONS: Region[] = [
  {
    key: "vancouver",
    envVar: "ADDRESS_VANCOUVER",
    keywords: [
      "vancouver", "burnaby", "richmond", "surrey", "coquitlam",
      "north vancouver", "west vancouver", "delta", "langley",
      "new westminster", "port coquitlam", "port moody", "maple ridge",
      "white rock", "lower mainland",
    ],
  },
  {
    key: "calgary",
    envVar: "ADDRESS_CALGARY",
    keywords: ["calgary", "airdrie", "okotoks", "cochrane", "chestermere"],
  },
  {
    key: "edmonton",
    envVar: "ADDRESS_EDMONTON",
    keywords: [
      "edmonton", "sherwood park", "st. albert", "st albert",
      "spruce grove", "leduc", "fort saskatchewan", "strathcona",
    ],
  },
  {
    key: "ontario-quebec-nova-scotia",
    envVar: "ADDRESS_TORONTO",
    keywords: [
      "ontario", "toronto", "ottawa", "mississauga", "brampton", "hamilton",
      "london", "kitchener", "waterloo", "markham", "vaughan",
      "quebec", "montreal", "quebec city", "nova scotia", "halifax",
      "dartmouth",
    ],
  },
  {
    key: "kelowna",
    envVar: "ADDRESS_KELOWNA",
    // Also the default fallback for an otherwise-unmatched BC location,
    // since it's the home-base address -- see selectAddress().
    keywords: ["kelowna", "west kelowna", "lake country", "peachland", "okanagan"],
  },
];

const BC_FALLBACK_KEYWORDS = ["british columbia", "bc", "b.c."];

export type AddressMatch = {
  region: string;
  address: string | null;
};

// Matches on substring, longest keyword first, so "north vancouver" wins
// over a bare "vancouver" keyword collision, and so on across regions.
export function selectAddress(jobLocation: string): AddressMatch | null {
  const location = String(jobLocation ?? "").toLowerCase();

  const allMatches = REGIONS
    .flatMap((region) => region.keywords.map((keyword) => ({ region, keyword })))
    .filter(({ keyword }) => location.includes(keyword))
    .sort((a, b) => b.keyword.length - a.keyword.length);

  let region: Region | undefined = allMatches[0]?.region;

  if (!region && BC_FALLBACK_KEYWORDS.some((kw) => location.includes(kw))) {
    region = REGIONS.find((r) => r.key === "kelowna");
  }

  if (!region) return null;

  return {
    region: region.key,
    address: process.env[region.envVar]?.trim() || null,
  };
}
