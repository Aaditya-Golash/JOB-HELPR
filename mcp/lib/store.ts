import { put, get } from "@vercel/blob";
import { findLikelyDuplicate } from "./dedup";

function assertBlobToken() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is not set in this environment. Connect a Vercel " +
        "Blob store to this project (Storage tab in the Vercel dashboard) and " +
        "redeploy -- see .env.example and README.md.",
    );
  }
}

export type ApplicationRecord = {
  id: string;
  company: string;
  jobTitle: string;
  jobUrl?: string;
  source?: string; // e.g. "ZipRecruiter", "Indeed", "Job Bank"
  salary?: string;
  postedDaysAgo?: number;
  status: "shortlisted" | "materials_ready" | "outreach_drafted" | "applied";
  matchNotes?: string;
  projectsUsed?: string[];
  createdAt: string;
};

export type ApplicationListFilter = {
  status?: ApplicationRecord["status"];
  company?: string;
  role?: string;
  since?: string;
  limit?: number;
  offset?: number;
};

const STORE_KEY = "job-pipeline/applications.json";

// Serializes the full read-merge-write transaction inside one Node process.
// This prevents lost updates from concurrent requests handled by the same
// local/serverless instance. Vercel Blob is not transactional, so separate
// instances can still race; migrate this tracker to Postgres for high-write
// concurrency or multi-user production use.
let writeQueue: Promise<void> = Promise.resolve();

function withWriteLock<T>(operation: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(operation, operation);
  writeQueue = result.then(() => undefined, () => undefined);
  return result;
}

async function streamToString(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }
  return result;
}

// Deliberately no blanket try/catch here. get() already returns null for the
// one case that legitimately means "empty store" (first run, nothing saved
// yet). Any other failure -- network blip, auth issue, corrupted JSON -- must
// propagate as a real error, NOT be treated as "empty," because writeAll()
// uses allowOverwrite: true and would otherwise silently wipe out every
// previously saved application on the next save.
async function readAll(): Promise<ApplicationRecord[]> {
  assertBlobToken();
  const result = await get(STORE_KEY, { access: "private", useCache: false });
  if (!result) return [];
  const text = await streamToString(result.stream as unknown as ReadableStream);
  return JSON.parse(text) as ApplicationRecord[];
}

async function writeAll(records: ApplicationRecord[]): Promise<void> {
  assertBlobToken();
  await put(STORE_KEY, JSON.stringify(records, null, 2), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function saveApplication(record: Omit<ApplicationRecord, "id" | "createdAt">) {
  return withWriteLock(async () => {
    const all = await readAll();
    const likelyDuplicateOf = findLikelyDuplicate(all, record);
    const entry: ApplicationRecord = {
      ...record,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
    const merged = [...all.filter((existing) => existing.id !== entry.id), entry];
    await writeAll(merged);
    return { ...entry, likelyDuplicateOf };
  });
}

function includesIgnoreCase(value: string | undefined, query: string | undefined): boolean {
  if (!query) return true;
  return Boolean(value?.toLowerCase().includes(query.toLowerCase()));
}

export async function listApplications(filter: ApplicationListFilter = {}) {
  const all = await readAll();
  const sinceDate = filter.since ? new Date(filter.since) : null;
  const filtered = all.filter((a) => {
    if (filter.status && a.status !== filter.status) return false;
    if (!includesIgnoreCase(a.company, filter.company)) return false;
    if (!includesIgnoreCase(a.jobTitle, filter.role)) return false;
    if (sinceDate && !Number.isNaN(sinceDate.getTime()) && new Date(a.createdAt) < sinceDate) return false;
    return true;
  });
  const offset = Math.max(0, filter.offset ?? 0);
  const limit = Math.min(Math.max(1, filter.limit ?? 25), 100);
  return {
    count: filtered.length,
    returned: Math.min(limit, Math.max(0, filtered.length - offset)),
    nextOffset: offset + limit < filtered.length ? offset + limit : null,
    applications: filtered.slice(offset, offset + limit),
  };
}
