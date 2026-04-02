/**
 * Advanced Coding Tool - 核心类型定义
 */

export interface CodeContext {
  filePath: string;
  content: string;
  language: string;
  cursorPosition: {
    line: number;
    character: number;
  };
  selection?: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
}

export interface CompletionSuggestion {
  text: string;
  type: 'function' | 'variable' | 'class' | 'method' | 'property' | 'keyword';
  description?: string;
  documentation?: string;
  confidence: number;
}

export interface CodeReviewResult {
  type: 'error' | 'warning' | 'suggestion';
  message: string;
  line: number;
  column?: number;
  severity: 'high' | 'medium' | 'low';
  suggestion?: string;
  autoFix?: string;
}

export interface DebugInfo {
  errorType: string;
  message: string;
  stackTrace?: string;
  context: CodeContext;
  suggestions: string[];
}

export interface ProjectInfo {
  name: string;
  type: 'node' | 'python' | 'java' | 'typescript' | 'javascript' | 'other';
  dependencies: string[];
  files: string[];
  config: Record<string, any>;
}

export interface AIResponse {
  content: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  model: string;
  timestamp: number;
}

export interface ToolConfig {
  aiProvider: 'claude' | 'openai' | 'local';
  apiKey?: string;
  model: string;
  maxTokens: number;
  temperature: number;
  enableAutoComplete: boolean;
  enableCodeReview: boolean;
  enableDebug: boolean;
  excludedPaths: string[];
  customPrompts?: Record<string, string>;
}

export interface GenerationOptions {
  language: string;
  framework?: string;
  style: 'functional' | 'class' | 'mixed';
  testFramework?: string;
  documentation: boolean;
  comments: boolean;
}