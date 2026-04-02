/**
 * Advanced Coding Tool - OpenAI提供者
 */
import { ToolConfig, AIResponse } from '../core/types';
import { AIProviderInterface } from './provider';
export declare class OpenAIProvider implements AIProviderInterface {
    private client;
    private config;
    constructor();
    initialize(config: ToolConfig): Promise<void>;
    complete(systemPrompt: string, userPrompt: string): Promise<AIResponse>;
    streamComplete(systemPrompt: string, userPrompt: string, onChunk: (chunk: string) => void): Promise<AIResponse>;
}
//# sourceMappingURL=openai.d.ts.map