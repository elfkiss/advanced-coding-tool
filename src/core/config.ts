/**
 * Advanced Coding Tool - 配置管理
 */

import { ToolConfig } from './types';
import { cosmiconfig } from 'cosmiconfig';
import { z } from 'zod';

const ConfigSchema = z.object({
  aiProvider: z.enum(['claude', 'openai', 'local']).default('claude'),
  apiKey: z.string().optional(),
  model: z.string().default('claude-3-sonnet-20240229'),
  maxTokens: z.number().default(4000),
  temperature: z.number().default(0.7),
  enableAutoComplete: z.boolean().default(true),
  enableCodeReview: z.boolean().default(true),
  enableDebug: z.boolean().default(true),
  excludedPaths: z.array(z.string()).default(['node_modules', '.git', 'dist']),
  customPrompts: z.record(z.string()).optional(),
});

export class ConfigManager {
  private config: ToolConfig;
  private explorer: ReturnType<typeof cosmiconfig>;

  constructor() {
    this.explorer = cosmiconfig('act');
    this.config = this.getDefaultConfig();
  }

  private getDefaultConfig(): ToolConfig {
    return {
      aiProvider: 'claude',
      model: 'claude-3-sonnet-20240229',
      maxTokens: 4000,
      temperature: 0.7,
      enableAutoComplete: true,
      enableCodeReview: true,
      enableDebug: true,
      excludedPaths: ['node_modules', '.git', 'dist', 'build', '.cache'],
    };
  }

  async loadConfig(): Promise<ToolConfig> {
    try {
      const result = await this.explorer.search();
      if (result && result.config) {
        const validatedConfig = ConfigSchema.parse({
          ...this.getDefaultConfig(),
          ...result.config,
        });
        this.config = validatedConfig;
      }
    } catch (error) {
      console.warn('Failed to load config, using defaults:', error);
    }
    return this.config;
  }

  async saveConfig(config: Partial<ToolConfig>): Promise<void> {
    const newConfig = { ...this.config, ...config };
    const validatedConfig = ConfigSchema.parse(newConfig);
    
    try {
      // 保存到 .actrc 文件
      const fs = await import('fs/promises');
      const configPath = process.cwd() + '/.actrc.json';
      await fs.writeFile(configPath, JSON.stringify(validatedConfig, null, 2));
      this.config = validatedConfig;
    } catch (error) {
      throw new Error(`Failed to save config: ${error}`);
    }
  }

  getConfig(): ToolConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<ToolConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getApiKey(): string {
    if (this.config.apiKey) {
      return this.config.apiKey;
    }
    
    const envKey = this.config.aiProvider === 'claude' 
      ? 'ANTHROPIC_API_KEY' 
      : 'OPENAI_API_KEY';
    
    const apiKey = process.env[envKey];
    if (!apiKey) {
      throw new Error(`${envKey} environment variable is required`);
    }
    
    return apiKey;
  }
}