# opencode-bocha

[opencode](https://opencode.ai) **v2** 插件，接入 [博查 (Bocha)](https://open.bochaai.com) 网页搜索：

- 注册 **`bocha` WebSearch provider** —— opencode 内置的 `websearch` 工具可以选择博查作为搜索引擎（与内置的 Exa、Tavily 等并列），
- 注册 **`bochawebsearch` 自定义工具**，暴露博查的完整参数（count / freshness / summary / include / exclude）。

> 仅支持 opencode v2。插件就是单个纯 TypeScript 源文件（`index.ts`），由 opencode 直接加载 —— **无需构建、不走 npm 仓库、零运行时依赖**。（0.1.x 是 opencode v1 的 npm 包，0.2.x 是 git/npm 包，均已废弃。）

## 安装

### 方式 1 —— `.opencode/plugins/`（推荐）

把本仓库克隆（或复制）到项目的 `.opencode/plugins/` 目录下，opencode 会自动发现：

```bash
cd /path/to/your-project
git clone https://github.com/ixtWuko/opencode-bocha .opencode/plugins/opencode-bocha
```

以后更新：

```bash
git -C .opencode/plugins/opencode-bocha pull
```

### 方式 2 —— 任意本地目录

在 `opencode.json(c)` 的 `plugins` 中指向本地克隆（绝对路径，或相对于配置文件的路径）：

```jsonc
{
  "plugins": ["/绝对路径/opencode-bocha"]
}
```

### 全局安装

克隆到全局插件目录即可在所有项目中生效：

```bash
git clone https://github.com/ixtWuko/opencode-bocha ~/.config/opencode/plugins/opencode-bocha
```

> 不要安装 npm 包 `opencode-bocha` —— 那是废弃的 v1 插件，在 opencode v2 上会加载失败。如果之前装过，请先移除（`opencode plugin remove opencode-bocha`，或从配置的 `plugins` 中删掉）。

## 配置

### API Key

在 [open.bochaai.com](https://open.bochaai.com) → API KEY 管理 获取你的 API Key。

**方式 1 — 环境变量（推荐）：**

```bash
export BOCHA_API_KEY="sk-your-key-here"
```

PowerShell：

```powershell
$env:BOCHA_API_KEY = "sk-your-key-here"
```

**方式 2 — opencode 凭证库：**

插件会向 opencode 注册 `bocha` integration，因此 API Key 也可以存入 opencode 的凭证库（如 `opencode auth login`），会被自动读取。

## Bocha WebSearch provider

插件加载后，博查会出现在 opencode 的网页搜索 provider 列表中，内置 `websearch` 工具即可通过博查执行搜索。

## bochawebsearch 工具

`bochawebsearch` 工具向模型暴露博查的完整参数集。

### 参数

| 参数 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| `query` | string | 是 | - | 搜索关键词 |
| `count` | number | 否 | `10` | 返回结果数 (1-50) |
| `freshness` | string | 否 | `noLimit` | 时间范围：`noLimit`、`oneDay`、`oneWeek`、`oneMonth`、`oneYear`，或自定义 `YYYY-MM-DD..YYYY-MM-DD` |
| `summary` | boolean | 否 | `false` | 是否返回详细长文本摘要 |
| `include` | string | 否 | - | 限定搜索的网站，`\|` 或 `,` 分隔，最多 20 个域名 |
| `exclude` | string | 否 | - | 排除的网站，`\|` 或 `,` 分隔，最多 20 个域名 |

### 示例

```
bochawebsearch(query="2024年人工智能发展趋势", count=5, freshness="oneYear", summary=true)
```

## 开发

没有构建步骤。入口就是 `index.ts`，由 opencode 原样加载。

```bash
npm install
npm run check      # 仅类型检查 (tsc --noEmit)
```

测试时，把测试项目的 `opencode.jsonc` 指向本仓库（方式 2），或克隆到该项目的 `.opencode/plugins/` 下即可。

## 许可

MIT
