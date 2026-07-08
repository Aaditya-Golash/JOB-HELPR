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

const STORE_KEY = "job-pipeline/applications.json";

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
  const all = await readAll();
  const likelyDuplicateOf = findLikelyDuplicate(all, record);
  const entry: ApplicationRecord = {
    ...record,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  all.push(entry);
  await writeAll(all);
  return { ...entry, likelyDuplicateOf };
}

export async function listApplications(filter?: Partial<Pick<ApplicationRecord, "status">>) {
  const all = await readAll();
  if (filter?.status) return all.filter((a) => a.status === filter.status);
  return all;
}
