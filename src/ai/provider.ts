/**
 * Advanced Coding Tool - AI提供者接口
 */

import { ToolConfig, AIResponse } from '../core/types';
import { ClaudeProvider } from './claude';
import { OpenAIProvider } from './openai';

export interface AIProviderInterface {
  initialize(config: ToolConfig): Promise<void>;
  complete(systemPrompt: string, userPrompt: string): Promise<AIResponse>;
  streamComplete(systemPrompt: string, userPrompt: string, onChunk: (chunk: string) => void): Promise<AIResponse>;
}

export class AIProvider {
  private provider: AIProviderInterface;
  private config: ToolConfig;

  constructor() {
    this.provider = new ClaudeProvider(); // 默认使用Claude
    this.config = {} as ToolConfig;
  }

  async initialize(config: ToolConfig): Promise<void> {
    this.config = config;
    
    // 根据配置选择AI提供者
    switch (config.aiProvider) {
      case 'claude':
        this.provider = new ClaudeProvider();
        break;
      case 'openai':
        this.provider = new OpenAIProvider();
        break;
      default:
        throw new Error(`Unsupported AI provider: ${config.aiProvider}`);
    }
    
    await this.provider.initialize(config);
  }

  async complete(systemPrompt: string, userPrompt: string): Promise<AIResponse> {
    return await this.provider.complete(systemPrompt, userPrompt);
  }

  async streamComplete(systemPrompt: string, userPrompt: string, onChunk: (chunk: string) => void): Promise<AIResponse> {
    return await this.provider.streamComplete(systemPrompt, userPrompt, onChunk);
  }
}