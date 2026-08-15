import express from "express";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createReeloraMcpServer } from "./mcp.js";
import { reeloraDataDir } from "./engine.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);
const dataDir = reeloraDataDir();
const outputsDir = path.join(dataDir, "outputs");
await mkdir(outputsDir, { recursive: true });

app.disable("x-powered-by");
app.use(express.json({ limit: "16mb" }));
app.use(
  "/outputs",
  express.static(outputsDir, {
    index: false,
    fallthrough: false,
    maxAge: "1h",
  }),
);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "reelora", version: "0.7.2", preservationMode: "strict-no-generative", aiVideoRemix: true, materialRemixValidation: true, multiSourceCoverage: true, automaticVerticalReframe: true });
});

app.post("/mcp", async (req, res) => {
  const server = createReeloraMcpServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  res.on("close", () => {
    void transport.close();
    void server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "reelora_mcp_error",
        message: error instanceof Error ? error.message : "Unknown server error",
      });
    }
  }
});

app.get("/mcp", (_req, res) => {
  res.status(405).json({ error: "method_not_allowed", message: "Use POST /mcp for stateless Streamable HTTP." });
});

app.delete("/mcp", (_req, res) => {
  res.status(405).json({ error: "method_not_allowed", message: "This Reelora MCP endpoint is stateless." });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Reelora v0.7.2 MCP server listening on port ${port}`);
});
