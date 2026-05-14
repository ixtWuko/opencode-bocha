# opencode-bocha

[opencode](https://opencode.ai) 插件，提供基于 [博查](https://open.bochaai.com) 搜索引擎的 `BochaWebSearch` 工具。

## 安装

```bash
npm install opencode-bocha
```

然后在 `opencode.json` 中添加：

```jsonc
{
  "plugin": ["opencode-bocha"]
}
```

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

**方式 2 — opencode auth：**

```bash
opencode auth login other
# Provider name: bocha
# 按提示粘贴 API Key
```

## BochaWebSearch 工具

插件加载后，opencode 的 AI 会在需要搜索网页时自动调用 `BochaWebSearch` 工具。

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
BochaWebSearch(query="2024年人工智能发展趋势", count=5, freshness="oneYear", summary=true)
```

## 开发

```bash
npm install
npm run build      # 编译到 dist/
npm run dev        # 监听模式
```

本地测试：

```jsonc
{
  "plugin": ["./path/to/opencode-bocha/dist/index.js"]
}
```

## 许可

MIT
