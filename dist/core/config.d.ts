/**
 * Advanced Coding Tool - 配置管理
 */
import { ToolConfig } from './types';
export declare class ConfigManager {
    private config;
    private explorer;
    constructor();
    private getDefaultConfig;
    loadConfig(): Promise<ToolConfig>;
    saveConfig(config: Partial<ToolConfig>): Promise<void>;
    getConfig(): ToolConfig;
    updateConfig(updates: Partial<ToolConfig>): void;
    getApiKey(): string;
}
//# sourceMappingURL=config.d.ts.map