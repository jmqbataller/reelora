import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createReeloraMcpServer } from "./mcp.js";

const server = createReeloraMcpServer();
const transport = new StdioServerTransport();
await server.connect(transport);
