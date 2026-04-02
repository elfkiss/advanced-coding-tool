"use strict";
/**
 * Advanced Coding Tool - OpenAI提供者
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
const openai_1 = __importDefault(require("openai"));
class OpenAIProvider {
    client;
    config;
    constructor() {
        this.client = new openai_1.default({ apiKey: '' });
        this.config = {};
    }
    async initialize(config) {
        this.config = config;
        if (config.apiKey) {
            this.client = new openai_1.default({ apiKey: config.apiKey });
        }
        else {
            // 从环境变量获取API密钥
            const apiKey = process.env.OPENAI_API_KEY;
            if (!apiKey) {
                throw new Error('OPENAI_API_KEY environment variable is required');
            }
            this.client = new openai_1.default({ apiKey });
        }
    }
    async complete(systemPrompt, userPrompt) {
        try {
            const response = await this.client.chat.completions.create({
                model: this.config.model || 'gpt-4',
                max_tokens: this.config.maxTokens || 4000,
                temperature: this.config.temperature || 0.7,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt,
                    },
                    {
                        role: 'user',
                        content: userPrompt,
                    },
                ],
            });
            const choice = response.choices[0];
            const content = choice?.message?.content || '';
            return {
                content,
                tokens: {
                    prompt: response.usage?.prompt_tokens || 0,
                    completion: response.usage?.completion_tokens || 0,
                    total: response.usage?.total_tokens || 0,
                },
                model: response.model,
                timestamp: Date.now(),
            };
        }
        catch (error) {
            throw new Error(`OpenAI API error: ${error}`);
        }
    }
    async streamComplete(systemPrompt, userPrompt, onChunk) {
        try {
            const stream = await this.client.chat.completions.create({
                model: this.config.model || 'gpt-4',
                max_tokens: this.config.maxTokens || 4000,
                temperature: this.config.temperature || 0.7,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt,
                    },
                    {
                        role: 'user',
                        content: userPrompt,
                    },
                ],
                stream: true,
            });
            let fullContent = '';
            let inputTokens = 0;
            let outputTokens = 0;
            for await (const chunk of stream) {
                const delta = chunk.choices[0]?.delta?.content;
                if (delta) {
                    fullContent += delta;
                    onChunk(delta);
                }
                if (chunk.usage) {
                    inputTokens = chunk.usage.prompt_tokens;
                    outputTokens = chunk.usage.completion_tokens;
                }
            }
            return {
                content: fullContent,
                tokens: {
                    prompt: inputTokens,
                    completion: outputTokens,
                    total: inputTokens + outputTokens,
                },
                model: this.config.model || 'gpt-4',
                timestamp: Date.now(),
            };
        }
        catch (error) {
            throw new Error(`OpenAI streaming error: ${error}`);
        }
    }
}
exports.OpenAIProvider = OpenAIProvider;
//# sourceMappingURL=openai.js.map