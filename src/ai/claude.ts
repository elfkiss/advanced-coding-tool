/**
 * Advanced Coding Tool - Claude AI提供者
 */

import Anthropic from '@anthropic-ai/sdk';
import { ToolConfig, AIResponse } from '../core/types';
import { AIProviderInterface } from './provider';

export class ClaudeProvider implements AIProviderInterface {
  private client: Anthropic;
  private config: ToolConfig;

  constructor() {
    this.client = new Anthropic({ apiKey: '' });
    this.config = {} as ToolConfig;
  }

  async initialize(config: ToolConfig): Promise<void> {
    this.config = config;
    
    if (config.apiKey) {
      this.client = new Anthropic({ apiKey: config.apiKey });
    } else {
      // 从环境变量获取API密钥
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY environment variable is required');
      }
      this.client = new Anthropic({ apiKey });
    }
  }

  async complete(systemPrompt: string, userPrompt: string): Promise<AIResponse> {
    try {
      const response = await this.client.messages.create({
        model: this.config.model || 'claude-3-sonnet-20240229',
        max_tokens: this.config.maxTokens || 4000,
        temperature: this.config.temperature || 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const content = response.content
        .filter(block => block.type === 'text')
        .map(block => (block as any).text)
        .join('\n');

      return {
        content,
        tokens: {
          prompt: response.usage.input_tokens,
          completion: response.usage.output_tokens,
          total: response.usage.input_tokens + response.usage.output_tokens,
        },
        model: response.model,
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`Claude API error: ${error}`);
    }
  }

  async streamComplete(systemPrompt: string, userPrompt: string, onChunk: (chunk: string) => void): Promise<AIResponse> {
    try {
      const stream = await this.client.messages.create({
        model: this.config.model || 'claude-3-sonnet-20240229',
        max_tokens: this.config.maxTokens || 4000,
        temperature: this.config.temperature || 0.7,
        system: systemPrompt,
        messages: [
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
        if (chunk.type === 'content_block_delta') {
          const delta = (chunk as any).delta;
          if (delta.type === 'text_delta' && delta.text) {
            fullContent += delta.text;
            onChunk(delta.text);
          }
        } else if (chunk.type === 'message_start') {
          const message = (chunk as any).message;
          inputTokens = message.usage.input_tokens;
        } else if (chunk.type === 'message_delta') {
          const delta = (chunk as any).usage;
          if (delta) {
            outputTokens = delta.output_tokens || 0;
          }
        }
      }

      return {
        content: fullContent,
        tokens: {
          prompt: inputTokens,
          completion: outputTokens,
          total: inputTokens + outputTokens,
        },
        model: this.config.model || 'claude-3-sonnet-20240229',
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`Claude streaming error: ${error}`);
    }
  }
}