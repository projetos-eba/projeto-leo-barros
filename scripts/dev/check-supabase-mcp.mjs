const endpoint = process.env.SUPABASE_MCP_URL ?? "http://127.0.0.1:54321/mcp";

const response = await fetch(endpoint, {
  body: JSON.stringify({
    id: 1,
    jsonrpc: "2.0",
    method: "initialize",
    params: {
      capabilities: {},
      clientInfo: {
        name: "projeto-leo-barros-mcp-check",
        version: "1.0.0",
      },
      protocolVersion: "2025-06-18",
    },
  }),
  headers: {
    Accept: "application/json, text/event-stream",
    "Content-Type": "application/json",
    "MCP-Protocol-Version": "2025-06-18",
  },
  method: "POST",
});

if (!response.ok) {
  throw new Error(`SUPABASE_MCP_UNAVAILABLE:${response.status}`);
}

const body = await response.text();
if (!body.includes("\"jsonrpc\"") && !body.includes("event: message")) {
  throw new Error("SUPABASE_MCP_UNEXPECTED_RESPONSE");
}

console.log(`Supabase MCP disponivel em ${endpoint}`);
