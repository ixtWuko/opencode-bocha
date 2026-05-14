import { type Plugin, tool } from "@opencode-ai/plugin";

const BOCHA_API_ENDPOINT = "https://api.bochaai.com/v1/web-search";

function getApiKey(): string {
  const key = process.env.BOCHA_API_KEY;
  if (!key) {
    throw new Error(
      [
        "Bocha API Key not found.",
        "",
        "Set the BOCHA_API_KEY environment variable:",
        "  export BOCHA_API_KEY=sk-your-key-here",
        "",
        "Or run `opencode auth login bocha` to store it via the auth system.",
      ].join("\n"),
    );
  }
  return key;
}

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

function isErrorResponse(body: unknown): body is BochaErrorResponse {
  if (typeof body !== "object" || body === null) return false;
  const r = body as Record<string, unknown>;
  return typeof r.code === "number" && r.code !== 200 && typeof r.message === "string";
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
    if (r.datePublished) meta.push(r.datePublished);
    if (meta.length > 0) lines.push(`    ${meta.join(" · ")}`);
    lines.push("");
  }

  return lines.join("\n");
}

export default (async () => {
  return {
    auth: {
      provider: "bocha",
      methods: [{ type: "api", label: "Bocha API Key" }],
    },

    tool: {
      WebSearch: tool({
        description: [
          "Search the web using Bocha (博查) search engine.",
          "Best for Chinese-language web searches, news, and general web content.",
          "Supports time range filtering, site inclusion/exclusion, and detailed summaries.",
        ].join(" "),

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
          if (args.freshness) payload.freshness = args.freshness;
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
