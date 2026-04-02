"use strict";
/**
 * Advanced Coding Tool - 配置管理
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = void 0;
const cosmiconfig_1 = require("cosmiconfig");
const zod_1 = require("zod");
const ConfigSchema = zod_1.z.object({
    aiProvider: zod_1.z.enum(['claude', 'openai', 'local']).default('claude'),
    apiKey: zod_1.z.string().optional(),
    model: zod_1.z.string().default('claude-3-sonnet-20240229'),
    maxTokens: zod_1.z.number().default(4000),
    temperature: zod_1.z.number().default(0.7),
    enableAutoComplete: zod_1.z.boolean().default(true),
    enableCodeReview: zod_1.z.boolean().default(true),
    enableDebug: zod_1.z.boolean().default(true),
    excludedPaths: zod_1.z.array(zod_1.z.string()).default(['node_modules', '.git', 'dist']),
    customPrompts: zod_1.z.record(zod_1.z.string()).optional(),
});
class ConfigManager {
    config;
    explorer;
    constructor() {
        this.explorer = (0, cosmiconfig_1.cosmiconfig)('act');
        this.config = this.getDefaultConfig();
    }
    getDefaultConfig() {
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
    async loadConfig() {
        try {
            const result = await this.explorer.search();
            if (result && result.config) {
                const validatedConfig = ConfigSchema.parse({
                    ...this.getDefaultConfig(),
                    ...result.config,
                });
                this.config = validatedConfig;
            }
        }
        catch (error) {
            console.warn('Failed to load config, using defaults:', error);
        }
        return this.config;
    }
    async saveConfig(config) {
        const newConfig = { ...this.config, ...config };
        const validatedConfig = ConfigSchema.parse(newConfig);
        try {
            // 保存到 .actrc 文件
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            const configPath = process.cwd() + '/.actrc.json';
            await fs.writeFile(configPath, JSON.stringify(validatedConfig, null, 2));
            this.config = validatedConfig;
        }
        catch (error) {
            throw new Error(`Failed to save config: ${error}`);
        }
    }
    getConfig() {
        return { ...this.config };
    }
    updateConfig(updates) {
        this.config = { ...this.config, ...updates };
    }
    getApiKey() {
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
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=config.js.map