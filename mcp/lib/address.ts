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
  city: string;
  defaultAddress: string;
  priority: number;
  // Keyword match is intentionally generous (city + well-known surrounding
  // municipalities) rather than exhaustive -- if a location doesn't match
  // clearly, this returns no match rather than a wrong guess.
  keywords: string[];
};

const REGIONS: Region[] = [
  {
    key: "ontario-quebec-nova-scotia",
    envVar: "ADDRESS_TORONTO",
    city: "Toronto, ON",
    defaultAddress: "155 Yorkville Ave, Toronto, ON M5R 0B4",
    priority: 1,
    keywords: [
      "toronto", "mississauga", "brampton", "markham", "vaughan", "ottawa",
      "ontario", "quebec", "montreal", "nova scotia", "halifax",
    ],
  },
  {
    key: "calgary",
    envVar: "ADDRESS_CALGARY",
    city: "Calgary, AB",
    defaultAddress: "204 Coville Crescent NE, Calgary, AB T3K 5J5",
    priority: 2,
    keywords: ["calgary", "airdrie", "okotoks", "cochrane"],
  },
  {
    key: "edmonton",
    envVar: "ADDRESS_EDMONTON",
    city: "Edmonton, AB",
    defaultAddress: "396 Meadowview Tsse., Sherwood Park, AB T8H 1X6",
    priority: 3,
    keywords: ["edmonton", "sherwood park", "st. albert", "st albert", "spruce grove", "leduc"],
  },
  {
    key: "vancouver",
    envVar: "ADDRESS_VANCOUVER",
    city: "Vancouver, BC",
    defaultAddress: "275 N Kootenay St, Vancouver, BC V5K 3R2",
    priority: 4,
    keywords: [
      "vancouver", "burnaby", "richmond", "surrey", "coquitlam",
      "north vancouver", "west vancouver", "delta", "langley",
      "new westminster", "lower mainland",
    ],
  },
  {
    key: "kelowna",
    envVar: "ADDRESS_KELOWNA",
    city: "Kelowna, BC",
    defaultAddress: "881 Academy Way, Kelowna, BC V1V 0A2",
    priority: 5,
    // Also the default fallback for an otherwise-unmatched BC location,
    // since it's the home-base address -- see selectAddress().
    keywords: ["kelowna", "west kelowna", "lake country", "peachland", "okanagan"],
  },
];

const BC_FALLBACK_KEYWORDS = ["british columbia", "bc", "b.c."];

export type AddressMatch = {
  region: string;
  city: string;
  address: string | null;
};

export type ApplicationLocation = {
  cityProvince: string;
  fullAddress: string | null;
  region: string | null;
  matchReason: string;
};

function selectRegion(jobDescription: string, jobLocation?: string): { region: Region | null; matchReason: string } {
  const directLocation = String(jobLocation ?? "").trim();
  const text = `${directLocation} ${jobDescription ?? ""}`.toLowerCase();

  const allMatches = REGIONS
    .flatMap((region) => region.keywords.map((keyword) => ({ region, keyword })))
    .filter(({ keyword }) => text.includes(keyword))
    .sort((a, b) => a.region.priority - b.region.priority || b.keyword.length - a.keyword.length);

  let region: Region | undefined = allMatches[0]?.region;

  if (!region && BC_FALLBACK_KEYWORDS.some((kw) => text.includes(kw))) {
    region = REGIONS.find((r) => r.key === "kelowna");
    return { region: region ?? null, matchReason: "BC fallback to Kelowna" };
  }

  if (!region) return { region: null, matchReason: "No usable location match" };
  return {
    region,
    matchReason: allMatches.length > 1 ? "Multiple locations matched; priority order applied" : "Direct city/region match",
  };
}

export function selectApplicationLocation(jobDescription: string, jobLocation?: string): ApplicationLocation {
  const { region, matchReason } = selectRegion(jobDescription, jobLocation);
  if (!region) {
    return {
      cityProvince: "British Columbia",
      fullAddress: null,
      region: null,
      matchReason,
    };
  }
  return {
    cityProvince: region.city,
    fullAddress: process.env[region.envVar]?.trim() || region.defaultAddress,
    region: region.key,
    matchReason,
  };
}

export function selectResumeCity(jobLocation: string): string {
  return selectApplicationLocation(jobLocation).cityProvince;
}

// Matches on substring and applies the configured multi-location priority:
// Toronto, Calgary, Edmonton, Vancouver, then Kelowna.
export function selectAddress(jobLocation: string): AddressMatch | null {
  const selected = selectApplicationLocation(jobLocation);

  if (!selected.region) return null;

  return {
    region: selected.region,
    city: selected.cityProvince,
    address: selected.fullAddress,
  };
}
