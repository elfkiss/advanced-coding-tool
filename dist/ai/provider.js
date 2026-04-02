"use strict";
/**
 * Advanced Coding Tool - AI提供者接口
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIProvider = void 0;
const claude_1 = require("./claude");
const openai_1 = require("./openai");
class AIProvider {
    provider;
    config;
    constructor() {
        this.provider = new claude_1.ClaudeProvider(); // 默认使用Claude
        this.config = {};
    }
    async initialize(config) {
        this.config = config;
        // 根据配置选择AI提供者
        switch (config.aiProvider) {
            case 'claude':
                this.provider = new claude_1.ClaudeProvider();
                break;
            case 'openai':
                this.provider = new openai_1.OpenAIProvider();
                break;
            default:
                throw new Error(`Unsupported AI provider: ${config.aiProvider}`);
        }
        await this.provider.initialize(config);
    }
    async complete(systemPrompt, userPrompt) {
        return await this.provider.complete(systemPrompt, userPrompt);
    }
    async streamComplete(systemPrompt, userPrompt, onChunk) {
        return await this.provider.streamComplete(systemPrompt, userPrompt, onChunk);
    }
}
exports.AIProvider = AIProvider;
//# sourceMappingURL=provider.js.map