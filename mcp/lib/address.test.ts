import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { selectAddress } from "./address";

// Fake addresses only -- the real ones live in .env.local / the Vercel
// dashboard and are never referenced from a test file.
const ENV_KEYS = ["ADDRESS_VANCOUVER", "ADDRESS_CALGARY", "ADDRESS_EDMONTON", "ADDRESS_TORONTO", "ADDRESS_KELOWNA"];
const ORIGINAL: Record<string, string | undefined> = {};

describe("selectAddress", () => {
  beforeEach(() => {
    for (const key of ENV_KEYS) {
      ORIGINAL[key] = process.env[key];
      delete process.env[key];
    }
    process.env.ADDRESS_VANCOUVER = "123 Fake St, Vancouver, BC V0V 0V0";
    process.env.ADDRESS_CALGARY = "456 Fake Ave, Calgary, AB T0T 0T0";
    process.env.ADDRESS_EDMONTON = "789 Fake Rd, Sherwood Park, AB T0T 0T0";
    process.env.ADDRESS_TORONTO = "321 Fake Blvd, Toronto, ON M0M 0M0";
    process.env.ADDRESS_KELOWNA = "654 Fake Way, Kelowna, BC V0V 0V0";
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (ORIGINAL[key] === undefined) delete process.env[key];
      else process.env[key] = ORIGINAL[key];
    }
  });

  it("matches a Lower Mainland city to the Vancouver region", () => {
    expect(selectAddress("Burnaby, BC")?.region).toBe("vancouver");
    expect(selectAddress("Remote - Surrey")?.region).toBe("vancouver");
  });

  it("matches Calgary and its surrounding towns", () => {
    expect(selectAddress("Calgary, AB")?.region).toBe("calgary");
    expect(selectAddress("Airdrie, AB")?.region).toBe("calgary");
  });

  it("matches Edmonton and its surrounding towns", () => {
    expect(selectAddress("Edmonton, AB")?.region).toBe("edmonton");
    expect(selectAddress("Sherwood Park, AB")?.region).toBe("edmonton");
  });

  it("buckets Ontario/Quebec/Nova Scotia cities into one region", () => {
    expect(selectAddress("Toronto, ON")?.region).toBe("ontario-quebec-nova-scotia");
    expect(selectAddress("Montreal, QC")?.region).toBe("ontario-quebec-nova-scotia");
    expect(selectAddress("Halifax, NS")?.region).toBe("ontario-quebec-nova-scotia");
  });

  it("matches Kelowna directly", () => {
    expect(selectAddress("Kelowna, BC")?.region).toBe("kelowna");
  });

  it("falls back to Kelowna for an unmatched BC location", () => {
    expect(selectAddress("Prince George, British Columbia")?.region).toBe("kelowna");
  });

  it("returns null for a location matching no region and no BC fallback", () => {
    expect(selectAddress("Winnipeg, MB")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(selectAddress("")).toBeNull();
  });

  it("prefers the longer, more specific keyword on overlap", () => {
    // "north vancouver" should win over a bare "vancouver" substring match.
    expect(selectAddress("North Vancouver, BC")?.region).toBe("vancouver");
  });

  it("returns the matched region's address from the env var", () => {
    const match = selectAddress("Calgary, AB");
    expect(match?.address).toBe("456 Fake Ave, Calgary, AB T0T 0T0");
  });

  it("returns a null address (not a guess) when the matched region's env var isn't set", () => {
    delete process.env.ADDRESS_CALGARY;
    const match = selectAddress("Calgary, AB");
    expect(match?.region).toBe("calgary");
    expect(match?.address).toBeNull();
  });
});
