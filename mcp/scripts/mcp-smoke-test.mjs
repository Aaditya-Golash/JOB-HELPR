#!/usr/bin/env node
/**
 * mcp-smoke-test.mjs — end-to-end check of the live MCP endpoint.
 *
 * Connects a real MCP client (the same SDK a real caller like Claude Desktop
 * would use) to a running dev/prod server over Streamable HTTP and calls
 * every tool the server exposes, the same way the plugin's skills do. Not
 * part of `npm test` -- it needs a running server, so run it manually:
 *
 *   npm run dev            (in one terminal)
 *   npm run smoke           (in another)
 *
 * Or against a deployed URL:
 *   MCP_URL=https://job-pipeline-mcp.vercel.app/api/mcp npm run smoke
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MCP_URL = process.env.MCP_URL ?? "http://localhost:3000/api/mcp";
const EXPECTED_TOOLS = [
  "generate_resume",
  "generate_cover_letter",
  "save_application",
  "list_applications",
  "get_profile",
];

const results = [];

function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} -- ${name}${detail ? `: ${detail}` : ""}`);
}

async function callTool(client, name, args) {
  const result = await client.callTool({ name, arguments: args });
  if (result.isError) {
    const text = result.content?.[0]?.text ?? "unknown error";
    throw new Error(text);
  }
  return result.content?.[0]?.text ?? "";
}

async function main() {
  console.log(`Connecting to ${MCP_URL} ...\n`);
  const client = new Client({ name: "job-helpr-smoke-test", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));

  try {
    await client.connect(transport);
  } catch (err) {
    console.error(`Could not connect to ${MCP_URL}. Is the dev server running? (npm run dev)`);
    console.error(String(err));
    process.exit(1);
  }

  // 1. tools/list -- confirms all 5 tools are actually registered and reachable.
  const { tools } = await client.listTools();
  const toolNames = tools.map((t) => t.name).sort();
  const missing = EXPECTED_TOOLS.filter((t) => !toolNames.includes(t));
  record(
    "tools/list exposes all 5 expected tools",
    missing.length === 0,
    missing.length ? `missing: ${missing.join(", ")}` : toolNames.join(", "),
  );

  // 2. get_profile
  try {
    const text = await callTool(client, "get_profile", {});
    const parsed = JSON.parse(text);
    record(
      "get_profile returns the structured profile",
      typeof parsed.name === "string" && Array.isArray(parsed.projects) && parsed.projects.length > 0,
      `name="${parsed.name}", ${parsed.projects?.length} projects`,
    );
  } catch (err) {
    record("get_profile returns the structured profile", false, String(err.message ?? err));
  }

  // 3. generate_resume
  try {
    const text = await callTool(client, "generate_resume", {
      jobTitle: "Business Analyst",
      company: "Acme Corp",
      jobDescription: "Looking for a business analyst with SQL, data pipelines, and stakeholder reporting experience.",
    });
    const ok = text.includes("\\documentclass") && text.includes("\\begin{document}") && text.includes("Projects used:");
    record("generate_resume returns compilable-looking LaTeX", ok, `${text.length} chars`);
  } catch (err) {
    record("generate_resume returns compilable-looking LaTeX", false, String(err.message ?? err));
  }

  // 4. generate_cover_letter
  try {
    const text = await callTool(client, "generate_cover_letter", {
      jobTitle: "Business Analyst",
      company: "Acme Corp",
      jobDescription: "Looking for a business analyst with SQL, data pipelines, and stakeholder reporting experience.",
      whyThem: "Acme's data-driven culture is a strong match for my background.",
    });
    const ok = text.includes("\\documentclass") && text.includes("Sincerely");
    record("generate_cover_letter returns compilable-looking LaTeX", ok, `${text.length} chars`);
  } catch (err) {
    record("generate_cover_letter returns compilable-looking LaTeX", false, String(err.message ?? err));
  }

  // 5 & 6. save_application / list_applications -- these need a real Vercel
  // Blob store (BLOB_READ_WRITE_TOKEN). If it isn't configured, the correct,
  // intended behavior is the clear error from mcp/lib/store.ts, not a crash
  // -- treat that specific error as a pass for this check, and anything else
  // as a real failure.
  const uniqueSuffix = Date.now();
  const testCompany = `Smoke Test Co ${uniqueSuffix}`;
  let blobConfigured = true;

  try {
    const firstText = await callTool(client, "save_application", {
      company: testCompany,
      jobTitle: "Business Analyst",
      status: "shortlisted",
    });
    const first = JSON.parse(firstText);
    record("save_application saves a new entry", Boolean(first.id), `id=${first.id}`);

    const secondText = await callTool(client, "save_application", {
      company: testCompany,
      jobTitle: "Business Analyst",
      status: "shortlisted",
    });
    const second = JSON.parse(secondText);
    record(
      "save_application flags a likely duplicate on the second identical save",
      Boolean(second.likelyDuplicateOf),
      second.likelyDuplicateOf ? `duplicate of id=${second.likelyDuplicateOf.id}` : "likelyDuplicateOf was null",
    );

    const listText = await callTool(client, "list_applications", {});
    const list = JSON.parse(listText);
    const found = list.filter((a) => a.company === testCompany);
    record("list_applications reads back both saved entries", found.length === 2, `found ${found.length}`);
  } catch (err) {
    const message = String(err.message ?? err);
    if (/BLOB_READ_WRITE_TOKEN is not set/.test(message)) {
      blobConfigured = false;
      record(
        "save_application / list_applications (skipped -- no Blob store configured)",
        true,
        "server correctly threw the documented clear error instead of failing silently; connect a Vercel Blob store to test the full save/dedup/list path",
      );
    } else {
      record("save_application / list_applications", false, message);
    }
  }

  await client.close();

  console.log("");
  const failed = results.filter((r) => !r.pass);
  if (failed.length > 0) {
    console.log(`${failed.length}/${results.length} checks failed.`);
    process.exit(1);
  }
  console.log(`All ${results.length} checks passed.${blobConfigured ? "" : " (Blob store not configured -- see above.)"}`);
}

main();
