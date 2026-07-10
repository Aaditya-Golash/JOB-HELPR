import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { saveApplication, listApplications } from "./store";

// In-memory fake for the one Vercel Blob key this module reads/writes, so
// tests exercise the real read-modify-write + dedup logic in store.ts
// without touching the network or requiring real credentials.
let fakeBlob: string | null = null;

function stringToStream(text: string): ReadableStream {
  const bytes = new TextEncoder().encode(text);
  let sent = false;
  return {
    getReader() {
      return {
        async read() {
          if (sent) return { done: true, value: undefined };
          sent = true;
          return { done: false, value: bytes };
        },
        releaseLock() {},
      };
    },
  } as unknown as ReadableStream;
}

vi.mock("@vercel/blob", () => ({
  get: vi.fn(async () => {
    if (fakeBlob === null) return null;
    return { stream: stringToStream(fakeBlob) };
  }),
  put: vi.fn(async (_key: string, body: string) => {
    fakeBlob = body;
    return { url: "https://fake.blob.vercel-storage.com/job-pipeline/applications.json" };
  }),
}));

describe("store", () => {
  const ORIGINAL_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

  beforeEach(() => {
    fakeBlob = null;
    process.env.BLOB_READ_WRITE_TOKEN = "fake-token-for-tests";
  });

  afterEach(() => {
    process.env.BLOB_READ_WRITE_TOKEN = ORIGINAL_TOKEN;
  });

  it("throws a clear, actionable error when BLOB_READ_WRITE_TOKEN is missing", async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    await expect(listApplications()).rejects.toThrow(/BLOB_READ_WRITE_TOKEN is not set/);
  });

  it("starts empty when nothing has been saved yet", async () => {
    await expect(listApplications()).resolves.toMatchObject({
      count: 0,
      returned: 0,
      nextOffset: null,
      applications: [],
    });
  });

  it("round-trips a saved application through the fake blob store", async () => {
    const saved = await saveApplication({
      company: "Acme Corp",
      jobTitle: "Business Analyst",
      status: "shortlisted",
    });
    expect(saved.id).toBeTruthy();
    expect(saved.createdAt).toBeTruthy();
    expect(saved.likelyDuplicateOf).toBeNull();

    const all = await listApplications();
    expect(all.applications).toHaveLength(1);
    expect(all.applications[0].company).toBe("Acme Corp");
  });

  it("filters listApplications by status", async () => {
    await saveApplication({ company: "A", jobTitle: "X", status: "shortlisted" });
    await saveApplication({ company: "B", jobTitle: "Y", status: "applied" });

    const shortlisted = await listApplications({ status: "shortlisted" });
    expect(shortlisted.applications).toHaveLength(1);
    expect(shortlisted.applications[0].company).toBe("A");
  });

  it("filters listApplications by company, role, and since with a small default page", async () => {
    await saveApplication({ company: "Northwind Telecom", jobTitle: "BI Analyst", status: "shortlisted" });
    await saveApplication({ company: "Northbridge Capital", jobTitle: "Finance Analyst", status: "shortlisted" });

    const filtered = await listApplications({ company: "northwind", role: "bi", since: "2000-01-01" });
    expect(filtered.count).toBe(1);
    expect(filtered.returned).toBe(1);
    expect(filtered.applications[0].company).toBe("Northwind Telecom");
  });

  it("paginates listApplications instead of returning everything by default", async () => {
    for (let i = 0; i < 30; i++) {
      await saveApplication({ company: `Company ${i}`, jobTitle: "Role", status: "shortlisted" });
    }
    const firstPage = await listApplications();
    expect(firstPage.count).toBe(30);
    expect(firstPage.returned).toBe(25);
    expect(firstPage.nextOffset).toBe(25);
    expect(firstPage.applications).toHaveLength(25);
  });

  it("flags a likely duplicate on save instead of silently creating a second row", async () => {
    await saveApplication({ company: "Bell Canada Inc.", jobTitle: "Business Analyst", status: "shortlisted" });
    const second = await saveApplication({ company: "Bell (Canada)", jobTitle: "Business Analyst", status: "shortlisted" });

    expect(second.likelyDuplicateOf).not.toBeNull();
    expect(second.likelyDuplicateOf?.company).toBe("Bell Canada Inc.");
  });

  it("still saves the duplicate row -- flagging is informational, not blocking", async () => {
    await saveApplication({ company: "Bell Canada Inc.", jobTitle: "Business Analyst", status: "shortlisted" });
    await saveApplication({ company: "Bell Canada Inc.", jobTitle: "Business Analyst", status: "shortlisted" });

    const all = await listApplications();
    expect(all.applications).toHaveLength(2);
  });

  it("never wipes prior saves -- each save is additive", async () => {
    for (let i = 0; i < 5; i++) {
      await saveApplication({ company: `Company ${i}`, jobTitle: "Role", status: "shortlisted" });
    }
    const all = await listApplications();
    expect(all.applications).toHaveLength(5);
  });

  it("serializes concurrent saves so neither application is dropped", async () => {
    await Promise.all([
      saveApplication({ company: "Concurrent A", jobTitle: "Analyst", status: "shortlisted" }),
      saveApplication({ company: "Concurrent B", jobTitle: "Analyst", status: "shortlisted" }),
    ]);
    const all = await listApplications();
    expect(all.applications.map((entry) => entry.company).sort()).toEqual(["Concurrent A", "Concurrent B"]);
  });

  it("fails clearly instead of overwriting corrupted tracker data", async () => {
    fakeBlob = "{not valid json";
    await expect(saveApplication({ company: "Safe", jobTitle: "Role", status: "shortlisted" })).rejects.toThrow();
    expect(fakeBlob).toBe("{not valid json");
  });
});
