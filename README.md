# opencode-bocha

[opencode](https://opencode.ai) **v2** plugin that adds [博查 (Bocha)](https://open.bochaai.com) web search:

- a **`bocha` WebSearch provider** — opencode's built-in `websearch` tool can use Bocha alongside the built-in providers (Exa, Tavily, …),
- a **`bochawebsearch` custom tool** with the full Bocha parameter set (count / freshness / summary / include / exclude).

> Version 0.1.x supported opencode v1 (`@opencode-ai/plugin` hooks API). Version 0.2.x targets opencode v2 (`@opencode/plugin`, `{ id, setup }` plugin format).

## Installation

```bash
npm install opencode-bocha
```

Then add it to your `opencode.json`:

```jsonc
{
  "plugins": ["opencode-bocha"]
}
```

Or reference a local checkout directly (v2 loads local plugin **directories**):

```jsonc
{
  "plugins": ["/absolute/path/to/opencode-bocha"]
}
```

## Configuration

### API Key

Get your API key at [open.bochaai.com](https://open.bochaai.com) → API KEY 管理。

**Option 1 — Environment variable (recommended):**

```bash
export BOCHA_API_KEY="sk-your-key-here"
```

PowerShell:

```powershell
$env:BOCHA_API_KEY = "sk-your-key-here"
```

**Option 2 — opencode credential store:**

The plugin registers a `bocha` integration with opencode, so the key can be stored in opencode's credential store (e.g. `opencode auth login`) and is picked up automatically.

## Bocha WebSearch provider

Once loaded, Bocha appears in opencode's web search provider list and the built-in `websearch` tool can route searches through it.

## bochawebsearch tool

The `bochawebsearch` tool exposes Bocha's full parameter set to the model.

### Parameters

| Parameter   | Type    | Required | Default    | Description |
|-------------|---------|----------|------------|-------------|
| `query`     | string  | yes      | —          | Search query |
| `count`     | number  | no       | `10`       | Number of results (1–50) |
| `freshness` | string  | no       | `noLimit`  | Time range: `noLimit`, `oneDay`, `oneWeek`, `oneMonth`, `oneYear`, or custom `YYYY-MM-DD..YYYY-MM-DD` |
| `summary`   | boolean | no       | `false`    | Include detailed long-text summary per result |
| `include`   | string  | no       | —          | Only include results from these sites. Pipe or comma separated, max 20 domains |
| `exclude`   | string  | no       | —          | Exclude results from these sites. Pipe or comma separated, max 20 domains |

### Example

```
bochawebsearch(query="2024年人工智能发展趋势", count=5, freshness="oneYear", summary=true)
```

## Development

```bash
npm install
npm run build      # compile to dist/
npm run dev        # watch mode
```

To test locally, point opencode at the repository (the root `server.ts` is the local-dev entry, no build required):

```jsonc
{
  "plugins": ["/absolute/path/to/opencode-bocha"]
}
```

## License

MIT
