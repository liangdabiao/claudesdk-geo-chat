import { query } from "@anthropic-ai/claude-agent-sdk";
import path from "path";
import dotenv from "dotenv";
import { MessageQueue } from "./message-queue.js";
import { fileLog } from "./logger.js";
dotenv.config({ override: true });
export class AgentSession {
    constructor() {
        this.outputIterator = null;
        this.sdkSessionId = null;
        this.started = false;
        this.queue = new MessageQueue();
    }
    ensureStarted() {
        if (this.started)
            return;
        this.started = true;
        fileLog("Agent", "Starting SDK | MODEL:", process.env.MODEL || "sonnet", "| BASE_URL:", process.env.ANTHROPIC_BASE_URL || "(default)");
        try {
            const stream = query({
                prompt: this.queue,
                options: {
                    cwd: path.resolve(process.cwd()),
                    settingSources: ["project"],
                    allowedTools: [
                        "Skill", "Task", "TodoWrite",
                        "WebSearch",
                        "Bash",
                        "Read", "Write", "Glob", "Grep",
                        "mcp__web_reader__webReader",
                        "mcp__playwright__browser_navigate",
                        "mcp__playwright__browser_snapshot",
                        "mcp__playwright__browser_take_screenshot",
                        "mcp__playwright__browser_click",
                        "mcp__playwright__browser_close",
                    ],
                    systemPrompt: `你是 GeoChat，一个专业的 AI GEO 内容优化分析助手。

你拥有 1 个核心技能：

geo-content-optimizer — AI 驱动的网页内容优化分析工具
- 6阶段自动化分析流水线
- Phase 0: 创建输出目录
- Phase 1: web_reader 抓取页面标题（Playwright 回退）
- Phase 2: WebSearch 多角度查询扩展（3-5个子主题）
- Phase 3: 提取核心 Google 查询词
- Phase 4: 获取 Google AI Overview（Playwright 回退）
- Phase 5: 搜索结果结构化摘要
- Phase 6: 对比分析 + 优化建议报告

工具使用规则：
1. 始终调用 geo-content-optimizer 技能来执行完整分析
2. 使用 web_reader MCP 抓取网页内容
3. 使用 WebSearch 进行查询扩展和搜索
4. 动态网页和 Google AI Overview 使用 Playwright MCP 回退
5. 所有输出文件使用中文（简体）

文件输出规则：
- 分析报告 → geo_reports/<domain-slug>/
  ├── report.md              # 最终优化报告
  ├── query_fanout.md         # 搜索扩展原始结果
  ├── ai_overview.md          # Google AI 概览
  └── query_fanout_summary.md # 搜索摘要

用中文回复用户。`,
                    model: process.env.MODEL || "sonnet",
                    permissionMode: "bypassPermissions",
                    maxTurns: 80,
                    stderr: process.stderr,
                    env: {
                        ...process.env,
                        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
                        ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
                    },
                },
            });
            this.outputIterator = stream[Symbol.asyncIterator]();
        }
        catch (e) {
            fileLog("Agent", "FAILED to start:", e);
            this.started = false;
        }
    }
    sendMessage(content) {
        fileLog("UserMsg", content);
        this.ensureStarted();
        this.queue.push(content);
    }
    async *getOutputStream() {
        while (!this.outputIterator) {
            await new Promise((r) => setTimeout(r, 50));
        }
        while (true) {
            try {
                const { value, done } = await this.outputIterator.next();
                if (done)
                    break;
                if (value?.type === "system" && value?.subtype === "init") {
                    this.sdkSessionId = value.session_id ?? null;
                    fileLog("Agent", "Session init:", this.sdkSessionId);
                }
                else {
                    this.logSDKMessage(value);
                }
                yield value;
            }
            catch (e) {
                fileLog("Agent", "Stream error:", e);
                break;
            }
        }
    }
    logSDKMessage(msg) {
        if (msg.type === "assistant" && msg.message) {
            for (const block of msg.message.content) {
                if (block.type === "text" && block.text)
                    fileLog("AI", block.text.substring(0, 200));
                if (block.type === "tool_use")
                    fileLog("ToolCall", block.name, JSON.stringify(block.input));
            }
        }
        if (msg.type === "result") {
            fileLog("Result", msg.subtype || "", "cost:", msg.total_cost_usd, "duration:", msg.duration_ms + "ms");
        }
    }
    close() {
        this.queue.close();
    }
}
