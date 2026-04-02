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
    
    // 优先使用配置中的API密钥，其次使用环境变量
    const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    
    if (apiKey && apiKey !== 'test-key') {
      try {
        this.client = new Anthropic({ apiKey });
        console.log('✅ Claude API initialized successfully');
      } catch (error) {
        console.warn('⚠️ Claude API初始化失败，使用模拟模式:', error);
      }
    } else {
      // 创建模拟客户端用于开发和测试
      this.client = {
        messages: {
          create: async () => {
            return {
              content: [{ type: 'text', text: '// Generated code\nfunction example() {\n  return "Hello, World!";\n}' }],
              usage: { input_tokens: 100, output_tokens: 50 },
              model: config.model || 'claude-3-sonnet-20240229'
            };
          }
        }
      } as any;
      console.warn('⚠️ 使用模拟Claude客户端 - 未配置ANTHROPIC_API_KEY');
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