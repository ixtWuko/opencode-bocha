# opencode-bocha

[opencode](https://opencode.ai) **v2** plugin that adds [博查 (Bocha)](https://open.bochaai.com) web search:

- a **`bocha` WebSearch provider** — opencode's built-in `websearch` tool can use Bocha alongside the built-in providers (Exa, Tavily, …),
- a **`bochawebsearch` custom tool** with the full Bocha parameter set (count / freshness / summary / include / exclude).

> v2 only. The plugin is a single plain-TypeScript file (`index.ts`) that opencode loads directly — **no build step, no npm registry, no runtime dependencies**. (0.1.x was an opencode v1 npm package and 0.2.x was a git/npm package; both are obsolete.)

## Installation

### Option 1 — Auto-install from GitHub (recommended)

Add the git source to your `opencode.json(c)`:

```jsonc
{
  "plugins": ["github:ixtWuko/opencode-bocha"]
}
```

or via the CLI:

```bash
opencode plugin add github:ixtWuko/opencode-bocha
```

opencode clones the repository into its plugin cache on first startup (no build, no npm registry — the package is pure TypeScript) and periodically checks GitHub for updates. Pin a branch or commit with `github:ixtWuko/opencode-bocha#main`.

> Configure **one** source only. Listing both `github:ixtWuko/opencode-bocha` and a local path loads the same plugin ID twice and one of them will fail with `Duplicate plugin ID`.

### Option 2 — `.opencode/plugins/` directory

Clone (or copy) this repository into the `.opencode/plugins/` directory of your project. opencode discovers it automatically:

```bash
cd /path/to/your-project
git clone https://github.com/ixtWuko/opencode-bocha .opencode/plugins/opencode-bocha
```

To update later:

```bash
git -C .opencode/plugins/opencode-bocha pull
```

### Option 3 — any local directory

Point `plugins` in `opencode.json(c)` at a local clone (absolute path or path relative to the config file):

```jsonc
{
  "plugins": ["/absolute/path/to/opencode-bocha"]
}
```

### Global install

Clone into the global plugins directory to enable it in every project:

```bash
git clone https://github.com/ixtWuko/opencode-bocha ~/.config/opencode/plugins/opencode-bocha
```

> Do **not** install the npm package `opencode-bocha` — that is the obsolete v1 plugin and will fail to load on opencode v2. If you installed it before, remove it (`opencode plugin remove opencode-bocha`, or delete it from `plugins` in your config).

## Configuration

### API Key

Get your API key at [open.bochaai.com](https://open.bochaai.com) → API KEY 管理.

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

There is nothing to build. The entry point is `index.ts`, loaded as-is by opencode.

```bash
npm install
npm run check      # type-check only (tsc --noEmit)
```

To test, point a test project's `opencode.jsonc` at this checkout (Option 2 above) or clone it into that project's `.opencode/plugins/`.

## License

MIT
