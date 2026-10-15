# opencode-bocha

[opencode](https://opencode.ai) **v2** 插件，接入 [博查 (Bocha)](https://open.bochaai.com) 网页搜索：

- 注册 **`bocha` WebSearch provider** —— opencode 内置的 `websearch` 工具可以选择博查作为搜索引擎（与内置的 Exa、Tavily 等并列），
- 注册 **`bochawebsearch` 自定义工具**，暴露博查的完整参数（count / freshness / summary / include / exclude）。

> 0.1.x 版本支持 opencode v1（`@opencode-ai/plugin` hooks API），通过 npm 分发。0.2.x 版本面向 opencode v2（`@opencode/plugin`，`{ id, setup }` 插件格式），改为从本 git 仓库分发。

## 安装

在 `opencode.json` 中添加 git 来源：

```jsonc
{
  "plugins": ["github:ixtWuko/opencode-bocha"]
}
```

或使用命令行：

```bash
opencode plugin add github:ixtWuko/opencode-bocha
```

opencode 启动时会自动从 GitHub 安装，并在仓库更新后自动重载。

### 本地开发

开发时直接把配置指向本地克隆（v2 的本地插件路径必须是**目录**；根目录的 `server.ts` 是入口，无需构建）：

```jsonc
{
  "plugins": ["/绝对路径/opencode-bocha"]
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

```bash
npm install
npm run build      # 编译 src/ → dist/
npm run dev        # 监听模式
```

### 发布流程

`dist/` 直接提交在仓库中（不再通过 npm 发布）。修改 `src/` 后：

```bash
npm run build
git add dist
git commit -m "rebuild dist"
git push
```

opencode 在下次更新检查时会拉取新版本。

## 许可

MIT
