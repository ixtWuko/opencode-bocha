import { type Plugin, tool } from "@opencode-ai/plugin";
import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

interface WebPageValue {
  id: string | null;
  name: string;
  url: string;
  displayUrl: string;
  snippet: string;
  summary?: string;
  siteName: string;
  siteIcon: string;
  datePublished: string;
  dateLastCrawled: string;
  cachedPageUrl: string | null;
  language: string | null;
}

interface BochaWebData {
  _type: string;
  queryContext: { originalQuery: string };
  webPages: {
    webSearchUrl: string;
    totalEstimatedMatches: number;
    value: WebPageValue[];
    someResultsRemoved: boolean;
  };
  images: unknown | null;
  videos: unknown | null;
}

interface BochaSuccessResponse {
  code: 200;
  log_id: string;
  msg: string | null;
  data: BochaWebData;
}

interface BochaErrorResponse {
  code: number;
  message: string;
  log_id: string;
}

const BOCHA_API_ENDPOINT = "https://api.bochaai.com/v1/web-search";
const FETCH_TIMEOUT = 30_000;

const VALID_FRESHNESS = new Set(["noLimit", "oneDay", "oneWeek", "oneMonth", "oneYear"]);

function isErrorResponse(body: unknown): body is BochaErrorResponse {
  if (typeof body !== "object" || body === null) return false;
  const r = body as Record<string, unknown>;
  return typeof r.code === "number" && r.code !== 200 && typeof r.message === "string";
}

function getApiKey(): string {
  const envKey = process.env.BOCHA_API_KEY;
  if (envKey) return envKey;

  try {
    const authPath = join(homedir(), ".local", "share", "opencode", "auth.json");
    if (existsSync(authPath)) {
      const authData = JSON.parse(readFileSync(authPath, "utf-8"));
      const entry = authData["bocha"];
      if (entry?.key) return entry.key;
    }
  } catch {
    // ignore read errors, fall through to error
  }

  throw new Error(
    [
      "Bocha API Key not found.",
      "",
      "Option 1 — Set the BOCHA_API_KEY environment variable.",
      "",
      "Option 2 — Store it via opencode auth:",
      "  opencode auth login other",
      '  then enter "bocha" as the provider name and paste your API key.',
    ].join("\n"),
  );
}

function formatDate(dateStr: string): string {
  return dateStr.replace(/T.*$/, "");
}

function formatResults(query: string, pages: WebPageValue[]): string {
  const lines: string[] = [
    `Search results for: "${query}"`,
    `Total: ${pages.length} results shown`,
    "",
  ];

  for (let i = 0; i < pages.length; i++) {
    const r = pages[i];
    lines.push(`[${i + 1}] ${r.name}`);
    lines.push(`    URL: ${r.url}`);
    if (r.summary) {
      lines.push(`    Summary: ${r.summary}`);
    } else if (r.snippet) {
      lines.push(`    Snippet: ${r.snippet}`);
    }
    const meta: string[] = [];
    if (r.siteName) meta.push(r.siteName);
    if (r.datePublished) meta.push(formatDate(r.datePublished));
    if (meta.length > 0) lines.push(`    ${meta.join(" · ")}`);
    lines.push("");
  }

  return lines.join("\n");
}

export default (async () => {
  return {
    auth: {
      provider: "bocha",
      methods: [{ type: "api" as const, label: "Bocha API Key" }],
    },

    tool: {
      BochaWebSearch: tool({
        description:
          "Search the web using Bocha. For general web searches, news, fact-checking, and retrieving up-to-date online content. Use as a drop-in alternative to WebSearch; supports extra features like site include/exclude filtering and detailed summaries.",
        args: {
          query: tool.schema.string().describe("Search query"),
          count: tool.schema
            .number()
            .optional()
            .describe("Number of results to return (1-50, default 10)"),
          freshness: tool.schema
            .string()
            .optional()
            .describe(
              "Time range filter: noLimit (default), oneDay, oneWeek, oneMonth, oneYear, or custom range like '2024-01-01..2024-12-31'",
            ),
          summary: tool.schema
            .boolean()
            .optional()
            .describe("Include detailed long-text summary for each result"),
          include: tool.schema
            .string()
            .optional()
            .describe(
              "Only include results from these sites. Pipe or comma separated root/sub domains, max 20. e.g. 'qq.com|m.163.com'",
            ),
          exclude: tool.schema
            .string()
            .optional()
            .describe(
              "Exclude results from these sites. Pipe or comma separated root/sub domains, max 20. e.g. 'baidu.com'",
            ),
        },

        async execute(args) {
          const apiKey = getApiKey();
          const count = args.count ?? 10;

          const payload: Record<string, unknown> = {
            query: args.query,
            count: Math.max(1, Math.min(50, count)),
          };
          if (args.freshness) {
            if (
              !VALID_FRESHNESS.has(args.freshness) &&
              !/^\d{4}-\d{2}-\d{2}(\.\.\d{4}-\d{2}-\d{2})?$/.test(args.freshness)
            ) {
              throw new Error(
                `Invalid freshness value: "${args.freshness}". Must be one of: noLimit, oneDay, oneWeek, oneMonth, oneYear, or a date/range like "2024-01-01" or "2024-01-01..2024-12-31"`,
              );
            }
            payload.freshness = args.freshness;
          }
          if (args.summary !== undefined) payload.summary = args.summary;
          if (args.include) payload.include = args.include;
          if (args.exclude) payload.exclude = args.exclude;

          let response: Response;
          try {
            response = await fetch(BOCHA_API_ENDPOINT, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
              signal: AbortSignal.timeout(FETCH_TIMEOUT),
            });
          } catch (err) {
            throw new Error(
              `Network error calling Bocha API: ${err instanceof Error ? err.message : String(err)}`,
            );
          }

          if (!response.ok) {
            const body = await response.json().catch(() => null);
            if (isErrorResponse(body)) {
              throw new Error(`Bocha API error (${body.code}): ${body.message}`);
            }
            throw new Error(`Bocha API responded with ${response.status}`);
          }

          const body: BochaSuccessResponse = await response.json();

          if (body.code !== 200) {
            throw new Error(`Bocha API error (${body.code}): ${body.msg || "Unknown error"}`);
          }

          const pages = body.data.webPages?.value ?? [];
          return formatResults(body.data.queryContext.originalQuery, pages);
        },
      }),
    },
  };
}) satisfies Plugin;
