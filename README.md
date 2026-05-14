# opencode-bocha

[opencode](https://opencode.ai) plugin that provides a `BochaWebSearch` tool powered by [博查 (Bocha)](https://open.bochaai.com) search engine.

## Installation

```bash
npm install opencode-bocha
```

Then add it to your `opencode.json`:

```jsonc
{
  "plugin": ["opencode-bocha"]
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

**Option 2 — opencode auth:**

```bash
opencode auth login other
# Provider name: bocha
# Paste your API key when prompted
```

## BochaWebSearch Tool

Once loaded, opencode's AI will automatically use the `BochaWebSearch` tool when it needs to search the web.

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
BochaWebSearch(query="2024年人工智能发展趋势", count=5, freshness="oneYear", summary=true)
```

## Development

```bash
npm install
npm run build      # compile to dist/
npm run dev        # watch mode
```

To test locally, reference the compiled output in your config:

```jsonc
{
  "plugin": ["./path/to/opencode-bocha/dist/index.js"]
}
```

## License

MIT
