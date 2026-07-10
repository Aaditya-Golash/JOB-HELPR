import { timingSafeEqual } from "node:crypto";

let warnedAboutMissingKey = false;

function secretsEqual(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function authorizeMcpRequest(request: Request): Response | null {
  const expected = process.env.MCP_API_KEY?.trim();

  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      return Response.json({ error: "MCP_API_KEY is required in production." }, { status: 503 });
    }
    if (!warnedAboutMissingKey) {
      warnedAboutMissingKey = true;
      console.warn("MCP_API_KEY is unset; allowing unauthenticated MCP requests in local development only.");
    }
    return null;
  }

  const authorization = request.headers.get("authorization") ?? "";
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  const headerKey = request.headers.get("x-mcp-api-key")?.trim();
  if ((bearer && secretsEqual(bearer, expected)) || (headerKey && secretsEqual(headerKey, expected))) return null;

  return Response.json({ error: "Unauthorized" }, { status: 401, headers: { "WWW-Authenticate": "Bearer" } });
}
