import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { analyzeReeloraRequest, editReel } from "./engine.js";

const highlightSchema = z.enum([
  "top_wear",
  "pants",
  "fabric",
  "print",
  "fit",
  "front_back",
  "general",
]);

const audioModeSchema = z.enum(["silent", "music", "original"]);

function textResult(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}

export function createReeloraMcpServer(): McpServer {
  const server = new McpServer({
    name: "reelora",
    version: "0.1.0",
  });

  server.registerTool(
    "reelora_analyze",
    {
      title: "Analyze raw Reel videos",
      description:
        "Analyze raw product/fashion videos using FFmpeg scene detection and preservation-safe heuristics. Returns candidate clip windows without modifying the media.",
      inputSchema: {
        rawVideos: z.array(z.string().min(1)).min(1).describe("Local file paths, file:// URLs, or HTTPS URLs for raw source videos."),
      },
    },
    async ({ rawVideos }) => {
      const result = await analyzeReeloraRequest({ rawVideos });
      return textResult(result);
    },
  );

  server.registerTool(
    "reelora_edit",
    {
      title: "Automatically edit a preservation-first Reel",
      description:
        "Turn uploaded/mounted raw videos plus an ending/outro video into a polished 9:16 Reel. Automatically selects, cuts, rearranges, reframes, crossfades, and exports while never generating or replacing the model, product, fabric, logo, print, or other visual content. For top_wear, the target shot distribution is 70% product-focus, 20% whole-body, 10% detail.",
      inputSchema: {
        rawVideos: z.array(z.string().min(1)).min(1).describe("Raw source videos as local paths, file:// URLs, or HTTPS URLs."),
        outroVideo: z.string().min(1).describe("Required ending/outro video. It is preserved and used as the final segment."),
        music: z.string().min(1).optional().describe("Optional music/audio path or HTTPS URL. No generated voice-over is ever added."),
        highlight: highlightSchema.default("general").describe("What the edit should visually prioritize."),
        targetDuration: z.number().min(6).max(30).default(15).describe("Target duration in seconds before the outro."),
        outputName: z.string().min(1).optional().describe("Optional MP4 output filename."),
        audioMode: audioModeSchema.default("silent").describe("silent by default; music is automatically selected when a music file is supplied."),
      },
    },
    async ({ rawVideos, outroVideo, music, highlight, targetDuration, outputName, audioMode }) => {
      const result = await editReel({
        rawVideos,
        outroVideo,
        music,
        highlight,
        targetDuration,
        outputName,
        audioMode,
      });
      return textResult(result);
    },
  );

  return server;
}
