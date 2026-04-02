/**
 * Advanced Coding Tool - 核心引擎
 */
import { ToolConfig, CodeContext, CompletionSuggestion, CodeReviewResult, DebugInfo, ProjectInfo, AIResponse } from './types';
export declare class AdvancedCodingEngine {
    private logger;
    private configManager;
    private aiProvider;
    private codeAnalyzer;
    private config;
    constructor();
    initialize(): Promise<void>;
    generateCode(context: CodeContext, prompt: string): Promise<AIResponse>;
    getCompletions(context: CodeContext): Promise<CompletionSuggestion[]>;
    reviewCode(context: CodeContext): Promise<CodeReviewResult[]>;
    debugCode(errorInfo: DebugInfo): Promise<string[]>;
    analyzeProject(rootPath: string): Promise<ProjectInfo>;
    private buildSystemPrompt;
    private buildCodeGenerationPrompt;
    private buildCompletionPrompt;
    private buildCodeReviewPrompt;
    private buildDebugPrompt;
    private getContextAroundCursor;
    private parseCompletions;
    private parseCodeReview;
    private parseDebugSuggestions;
    getConfig(): ToolConfig;
    updateConfig(updates: Partial<ToolConfig>): void;
    saveConfig(updates: Partial<ToolConfig>): Promise<void>;
}
//# sourceMappingURL=engine.d.ts.map