# GeoChat — AI GEO 内容优化分析助手

基于 **Claude Agent SDK** 的 GEO（Generative Engine Optimization）内容优化分析平台。用户输入 URL，系统自动调用 `geo-content-optimizer` 技能，执行 6 阶段分析流水线，最终生成中文内容优化建议报告。

## 架构

```
用户浏览器 ←WebSocket→ Express Server ←→ Claude Agent SDK ←→ geo-content-optimizer
                          ↓                              ↓
                    geo_reports/               WebSearch + Playwright MCP
                    (分析报告)                  + web_reader MCP
```

## 核心技能：geo-content-optimizer

### 6 阶段分析流水线

```
URL → 抓取标题 → 查询扩展研究 → 提取主查询
                                    ↓
              优化报告 ← 对比分析 ← 获取 AI 概览 + 搜索摘要
```

| 阶段 | 说明 | 使用工具 |
|------|------|----------|
| Phase 0 | 输出目录初始化 | Bash |
| Phase 1 | 抓取页面标题（H1/title） | web_reader / Playwright 回退 |
| Phase 2 | 查询扩展研究（多角度搜索） | WebSearch |
| Phase 3 | 提取主 Google 查询词 | Claude 推理 |
| Phase 4 | 获取 Google AI Overview | WebSearch + Playwright 回退 |
| Phase 5 | 搜索结果结构化摘要 | Claude 推理 |
| Phase 6 | 对比分析 + 优化建议报告 | Claude 推理 |

## 产出物结构

```
geo_reports/<domain-slug>/
├── report.md              # 最终优化报告（对比表 + 行动建议）
├── query_fanout.md         # 多角度搜索原始结果
├── ai_overview.md          # Google AI 概览内容
└── query_fanout_summary.md # 搜索结果结构化摘要
```

## 快速开始

### 1. 环境要求

- Node.js >= 18

### 2. 配置环境变量

```env
ANTHROPIC_API_KEY=your-key
ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic
MODEL=deepseek-v4-flash
PORT=3013
```

### 3. 安装依赖

```bash
npm install
```

### 4. 启动开发模式

```bash
npm run dev
```

访问 `http://localhost:5173`。

### 5. 生产构建

```bash
npm run build
npm start
```

访问 `http://localhost:3013`。

## 使用方式

1. **GEO 分析** — 输入 URL，"帮我分析这个页面的 GEO 优化"
2. **内容优化** — "帮我优化这个页面的 AI 搜索表现"
3. **竞品对比** — "帮我对比分析这些竞品页面"
4. **SEO 洞察** — "帮我分析这个页面的搜索引擎优化"
5. **查看报告** — 左侧「GEO 分析报告」面板实时展示

## MCP 配置

Playwright MCP 用于动态网页渲染和 Google AI Overview 抓取（`.claude/settings.json`）：

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@anthropic-ai/mcp-playwright"]
    }
  }
}
```

## 技术栈

- **Claude Agent SDK** — AI Agent 调度、技能系统
- **Playwright MCP** — 动态网页渲染 + Google AI Overview 抓取
- **WebSearch** — Google 查询扩展
- **Express** — HTTP + WebSocket 服务器
- **React 18** — 前端 UI（三栏绿色主题）
- **Tailwind CSS 4** — 样式
- **Vite 6** — 构建工具
- **TypeScript** — 类型安全

## 感谢和参考
https://linux.do/  感谢佬友，

https://github.com/liangdabiao/claudesdk-skill  AI生成claude-agent-sdk 项目
