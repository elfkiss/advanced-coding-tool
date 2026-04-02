/**
 * Advanced Coding Tool - Claude AI提供者
 */
import { ToolConfig, AIResponse } from '../core/types';
import { AIProviderInterface } from './provider';
export declare class ClaudeProvider implements AIProviderInterface {
    private client;
    private config;
    constructor();
    initialize(config: ToolConfig): Promise<void>;
    complete(systemPrompt: string, userPrompt: string): Promise<AIResponse>;
    streamComplete(systemPrompt: string, userPrompt: string, onChunk: (chunk: string) => void): Promise<AIResponse>;
}
//# sourceMappingURL=claude.d.ts.map