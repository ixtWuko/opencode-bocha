// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------
const BOCHA_API_ENDPOINT = "https://api.bochaai.com/v1/web-search";
const FETCH_TIMEOUT = 30_000;
const VALID_FRESHNESS = new Set(["noLimit", "oneDay", "oneWeek", "oneMonth", "oneYear"]);
function isErrorResponse(body) {
    if (typeof body !== "object" || body === null)
        return false;
    const r = body;
    return typeof r.code === "number" && r.code !== 200 && typeof r.message === "string";
}
async function getApiKey(ctx) {
    const envKey = process.env.BOCHA_API_KEY;
    if (envKey)
        return envKey;
    // v2 stores credentials in its credential store (per integration), so look
    // up the key registered for the "bocha" integration.
    try {
        const connection = await ctx.integration.connection.active("bocha");
        if (connection) {
            const credential = await ctx.integration.connection.resolve(connection);
            if (credential?.type === "key" && typeof credential.key === "string" && credential.key.length > 0) {
                return credential.key;
            }
        }
    }
    catch {
        // fall through to the error below
    }
    throw new Error([
        "Bocha API Key not found.",
        "",
        "Option 1 — Set the BOCHA_API_KEY environment variable.",
        "",
        "Option 2 — Connect the Bocha integration in opencode so the key is",
        "stored in opencode's credential store.",
    ].join("\n"));
}
function parsePublished(dateStr) {
    if (!dateStr)
        return undefined;
    const ms = Date.parse(dateStr);
    return Number.isFinite(ms) ? ms : undefined;
}
function formatDate(dateStr) {
    return dateStr.replace(/T.*$/, "");
}
function validateFreshness(freshness) {
    if (!freshness)
        return undefined;
    if (!VALID_FRESHNESS.has(freshness) && !/^\d{4}-\d{2}-\d{2}(\.\.\d{4}-\d{2}-\d{2})?$/.test(freshness)) {
        throw new Error(`Invalid freshness value: "${freshness}". Must be one of: noLimit, oneDay, oneWeek, oneMonth, oneYear, or a date/range like "2024-01-01" or "2024-01-01..2024-12-31"`);
    }
    return freshness;
}
function buildPayload(options) {
    const payload = {
        query: options.query,
        count: Math.max(1, Math.min(50, options.count ?? 10)),
    };
    const freshness = validateFreshness(options.freshness);
    if (freshness)
        payload.freshness = freshness;
    if (options.summary !== undefined)
        payload.summary = options.summary;
    if (options.include)
        payload.include = options.include;
    if (options.exclude)
        payload.exclude = options.exclude;
    return payload;
}
async function searchBocha(apiKey, options, signal) {
    const timeout = AbortSignal.timeout(FETCH_TIMEOUT);
    let response;
    try {
        response = await fetch(BOCHA_API_ENDPOINT, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(buildPayload(options)),
            signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
        });
    }
    catch (err) {
        throw new Error(`Network error calling Bocha API: ${err instanceof Error ? err.message : String(err)}`);
    }
    if (!response.ok) {
        const body = (await response.json().catch(() => null));
        if (isErrorResponse(body)) {
            throw new Error(`Bocha API error (${body.code}): ${body.message}`);
        }
        throw new Error(`Bocha API responded with ${response.status}`);
    }
    const body = (await response.json());
    if (body.code !== 200) {
        throw new Error(`Bocha API error (${body.code}): ${body.msg || "Unknown error"}`);
    }
    return body.data?.webPages?.value ?? [];
}
function formatResults(query, pages) {
    const lines = [
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
        }
        else if (r.snippet) {
            lines.push(`    Snippet: ${r.snippet}`);
        }
        const meta = [];
        if (r.siteName)
            meta.push(r.siteName);
        if (r.datePublished)
            meta.push(formatDate(r.datePublished));
        if (meta.length > 0)
            lines.push(`    ${meta.join(" · ")}`);
        lines.push("");
    }
    return lines.join("\n");
}
// ---------------------------------------------------------------------------
// Tool input schema (plain JSON Schema; v2 converts it for the LLM)
// ---------------------------------------------------------------------------
const bochaWebSearchInput = {
    type: "object",
    properties: {
        query: { type: "string", description: "Search query" },
        count: { type: "number", description: "Number of results to return (1-50, default 10)" },
        freshness: {
            type: "string",
            description: "Time range filter: noLimit (default), oneDay, oneWeek, oneMonth, oneYear, or custom range like '2024-01-01..2024-12-31'",
        },
        summary: { type: "boolean", description: "Include detailed long-text summary for each result" },
        include: {
            type: "string",
            description: "Only include results from these sites. Pipe or comma separated root/sub domains, max 20. e.g. 'qq.com|m.163.com'",
        },
        exclude: {
            type: "string",
            description: "Exclude results from these sites. Pipe or comma separated root/sub domains, max 20. e.g. 'baidu.com'",
        },
    },
    required: ["query"],
    additionalProperties: false,
};
// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------
const plugin = {
    id: "opencode-bocha",
    async setup(ctx) {
        // 1. Register credential methods for the "bocha" integration so the API
        //    key can be stored in opencode's credential store or read from the
        //    environment.
        await ctx.integration.transform((editor) => {
            editor.update("bocha", (integration) => {
                integration.name = "Bocha";
            });
            editor.method.update({
                integrationID: "bocha",
                method: { type: "key", label: "Bocha API Key" },
            });
            editor.method.update({
                integrationID: "bocha",
                method: { type: "env", names: ["BOCHA_API_KEY"] },
            });
        });
        // 2. Register Bocha as a WebSearch provider. opencode's built-in
        //    `websearch` tool will offer it alongside the built-in providers.
        await ctx.websearch.transform((editor) => {
            editor.add({
                id: "bocha",
                name: "Bocha",
                execute: async (input, context) => {
                    const apiKey = await getApiKey(ctx);
                    const pages = await searchBocha(apiKey, { query: input.query }, context.signal);
                    return pages.map((page) => {
                        const published = parsePublished(page.datePublished);
                        return {
                            url: page.url,
                            title: page.name,
                            content: page.summary || page.snippet || undefined,
                            time: published === undefined ? {} : { published },
                        };
                    });
                },
            });
        });
        // 3. Register the full-parameter BochaWebSearch tool (v1 parity).
        await ctx.tool.transform((editor) => {
            editor.add({
                name: "bochawebsearch",
                options: { codemode: false },
                description: "Search the web using Bocha. For general web searches, news, fact-checking, and retrieving up-to-date online content. Use as a drop-in alternative to WebSearch; supports extra features like site include/exclude filtering and detailed summaries.",
                input: bochaWebSearchInput,
                execute: async (args) => {
                    const options = (args ?? {});
                    if (typeof options.query !== "string" || options.query.trim() === "") {
                        throw new Error("Argument 'query' is required and must be a non-empty string");
                    }
                    const apiKey = await getApiKey(ctx);
                    const pages = await searchBocha(apiKey, options);
                    return { content: formatResults(options.query, pages) };
                },
            });
        });
    },
};
export default plugin;
