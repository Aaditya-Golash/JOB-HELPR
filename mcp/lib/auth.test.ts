import { afterEach, describe, expect, it, vi } from "vitest";
import { authorizeMcpRequest } from "./auth";

function request(headers: HeadersInit = {}) {
  return new Request("http://localhost/api/mcp", { headers });
}

describe("MCP authentication", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("rejects a request without credentials when MCP_API_KEY is set", () => {
    vi.stubEnv("MCP_API_KEY", "test-secret");
    expect(authorizeMcpRequest(request())?.status).toBe(401);
  });

  it("accepts an Authorization bearer token", () => {
    vi.stubEnv("MCP_API_KEY", "test-secret");
    expect(authorizeMcpRequest(request({ Authorization: "Bearer test-secret" }))).toBeNull();
  });

  it("accepts an x-mcp-api-key header", () => {
    vi.stubEnv("MCP_API_KEY", "test-secret");
    expect(authorizeMcpRequest(request({ "x-mcp-api-key": "test-secret" }))).toBeNull();
  });

  it("allows an unset key only outside production", () => {
    vi.stubEnv("MCP_API_KEY", "");
    vi.stubEnv("NODE_ENV", "test");
    expect(authorizeMcpRequest(request())).toBeNull();
  });

  it("fails closed when production has no key", () => {
    vi.stubEnv("MCP_API_KEY", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(authorizeMcpRequest(request())?.status).toBe(503);
  });
});
