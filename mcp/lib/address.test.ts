import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { selectAddress, selectApplicationLocation } from "./address";

const ENV_KEYS = ["ADDRESS_VANCOUVER", "ADDRESS_CALGARY", "ADDRESS_EDMONTON", "ADDRESS_TORONTO", "ADDRESS_KELOWNA"];
const ORIGINAL: Record<string, string | undefined> = {};

describe("address and resume city selection", () => {
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

  it("maps Vancouver-area jobs to Vancouver city and address", () => {
    expect(selectApplicationLocation("Hybrid role in Vancouver, BC").cityProvince).toBe("Vancouver, BC");
    expect(selectAddress("Remote - Surrey")?.address).toBe("123 Fake St, Vancouver, BC V0V 0V0");
  });

  it("maps Calgary-area jobs to Calgary city and address", () => {
    expect(selectApplicationLocation("Calgary, AB").cityProvince).toBe("Calgary, AB");
    expect(selectAddress("Airdrie, AB")?.address).toBe("456 Fake Ave, Calgary, AB T0T 0T0");
  });

  it("maps Edmonton-area jobs to Edmonton city and Sherwood Park address", () => {
    expect(selectApplicationLocation("Edmonton, AB").cityProvince).toBe("Edmonton, AB");
    expect(selectAddress("Sherwood Park, AB")?.address).toBe("789 Fake Rd, Sherwood Park, AB T0T 0T0");
  });

  it("maps Ontario, Quebec, and Nova Scotia jobs to Toronto city and address", () => {
    for (const location of ["Ontario", "Montreal, QC", "Halifax, NS"]) {
      expect(selectApplicationLocation(location).cityProvince).toBe("Toronto, ON");
      expect(selectAddress(location)?.address).toBe("321 Fake Blvd, Toronto, ON M0M 0M0");
    }
  });

  it("maps Kelowna jobs to Kelowna city and address", () => {
    expect(selectApplicationLocation("Kelowna, BC").cityProvince).toBe("Kelowna, BC");
    expect(selectAddress("West Kelowna")?.address).toBe("654 Fake Way, Kelowna, BC V0V 0V0");
  });

  it("applies multi-location priority", () => {
    expect(selectApplicationLocation("Locations: Toronto, Calgary, Vancouver").cityProvince).toBe("Toronto, ON");
    expect(selectApplicationLocation("Locations: Calgary or Vancouver").cityProvince).toBe("Calgary, AB");
    expect(selectApplicationLocation("Locations: Edmonton or Vancouver").cityProvince).toBe("Edmonton, AB");
  });

  it("returns a full application location object", () => {
    const selected = selectApplicationLocation("Hybrid role in Vancouver, BC");
    expect(selected).toMatchObject({
      cityProvince: "Vancouver, BC",
      fullAddress: "123 Fake St, Vancouver, BC V0V 0V0",
      region: "vancouver",
      matchReason: "Direct city/region match",
    });
  });

  it("uses British Columbia only when no usable location is present", () => {
    expect(selectApplicationLocation("Remote role with no listed city").cityProvince).toBe("British Columbia");
  });

  it("falls back to Kelowna for an unmatched BC location", () => {
    expect(selectAddress("Prince George, British Columbia")?.region).toBe("kelowna");
  });

  it("returns null for a location matching no region and no BC fallback", () => {
    expect(selectAddress("Winnipeg, MB")).toBeNull();
  });

  it("returns the built-in application address when a matched env var is not set", () => {
    delete process.env.ADDRESS_CALGARY;
    const match = selectAddress("Calgary, AB");
    expect(match?.city).toBe("Calgary, AB");
    expect(match?.address).toBe("204 Coville Crescent NE, Calgary, AB T3K 5J5");
  });
});
