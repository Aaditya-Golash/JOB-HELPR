import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("repository production contract", () => {
  it("documents and examples MCP authentication", () => {
    expect(read(".env.example")).toContain("MCP_API_KEY=replace-me-before-production");
    expect(read("README.md")).toContain("Authorization: Bearer <key>");
    expect(read("MCP_SETUP.md")).toContain("x-mcp-api-key");
  });

  it("documents six tools consistently and no legacy 3-5 project policy", () => {
    const docs = [read("README.md"), read("../README.md"), read("../plugin/shared/references/scoring-rubric.md")].join("\n");
    expect(docs).not.toMatch(/all 5 tools/i);
    expect(docs).not.toMatch(/3[-–]5 projects/i);
    expect(read("README.md")).toContain("all 6 tools");
  });

  it("protects every MCP method through the shared route wrapper", () => {
    const route = read("app/api/mcp/route.ts");
    expect(route).toContain("authorizeMcpRequest(request)");
    expect(route).toContain("protectedHandler as GET");
    expect(route).toContain("protectedHandler as POST");
    expect(route).toContain("protectedHandler as DELETE");
    expect(route).toContain(".max(3)");
  });
});
