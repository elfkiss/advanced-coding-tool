/**
 * Advanced Coding Tool - OpenAI提供者
 */

import OpenAI from 'openai';
import { ToolConfig, AIResponse } from '../core/types';
import { AIProviderInterface } from './provider';

export class OpenAIProvider implements AIProviderInterface {
  private client: OpenAI;
  private config: ToolConfig;

  constructor() {
    this.client = new OpenAI({ apiKey: '' });
    this.config = {} as ToolConfig;
  }

  async initialize(config: ToolConfig): Promise<void> {
    this.config = config;
    
    if (config.apiKey) {
      this.client = new OpenAI({ apiKey: config.apiKey });
    } else {
      // 从环境变量获取API密钥
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is required');
      }
      this.client = new OpenAI({ apiKey });
    }
  }

  async complete(systemPrompt: string, userPrompt: string): Promise<AIResponse> {
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
    } catch (error) {
      throw new Error(`OpenAI API error: ${error}`);
    }
  }

  async streamComplete(systemPrompt: string, userPrompt: string, onChunk: (chunk: string) => void): Promise<AIResponse> {
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
    } catch (error) {
      throw new Error(`OpenAI streaming error: ${error}`);
    }
  }
}