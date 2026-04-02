/**
 * Advanced Coding Tool - AI提供者接口
 */
import { ToolConfig, AIResponse } from '../core/types';
export interface AIProviderInterface {
    initialize(config: ToolConfig): Promise<void>;
    complete(systemPrompt: string, userPrompt: string): Promise<AIResponse>;
    streamComplete(systemPrompt: string, userPrompt: string, onChunk: (chunk: string) => void): Promise<AIResponse>;
}
export declare class AIProvider {
    private provider;
    private config;
    constructor();
    initialize(config: ToolConfig): Promise<void>;
    complete(systemPrompt: string, userPrompt: string): Promise<AIResponse>;
    streamComplete(systemPrompt: string, userPrompt: string, onChunk: (chunk: string) => void): Promise<AIResponse>;
}
//# sourceMappingURL=provider.d.ts.map