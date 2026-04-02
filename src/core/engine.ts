/**
 * Advanced Coding Tool - 核心引擎
 */

import { Logger } from './logger';
import { ConfigManager } from './config';
import { ToolConfig, CodeContext, CompletionSuggestion, CodeReviewResult, DebugInfo, ProjectInfo, AIResponse } from './types';
import { AIProvider } from '../ai';
import { SimpleCodeAnalyzer } from '../analysis/simple-analyzer';

export class AdvancedCodingEngine {
  private logger: Logger;
  private configManager: ConfigManager;
  private aiProvider: AIProvider;
  private codeAnalyzer: SimpleCodeAnalyzer;
  private config: ToolConfig;

  constructor() {
    this.logger = new Logger('Engine');
    this.configManager = new ConfigManager();
    this.aiProvider = new AIProvider();
    this.codeAnalyzer = new SimpleCodeAnalyzer();
    this.config = this.configManager.getConfig();
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Advanced Coding Engine...');
    
    // 加载配置
    this.config = await this.configManager.loadConfig();
    this.logger.info('Configuration loaded');

    // 初始化AI提供者
    await this.aiProvider.initialize(this.config);
    this.logger.info('AI Provider initialized');

    // 代码分析器不需要显式初始化
    this.logger.info('Code Analyzer initialized');

    this.logger.success('Engine initialized successfully');
  }

  async generateCode(context: CodeContext, prompt: string): Promise<AIResponse> {
    this.logger.info('Generating code...', { filePath: context.filePath });
    
    const systemPrompt = this.buildSystemPrompt('code_generation');
    const userPrompt = this.buildCodeGenerationPrompt(context, prompt);
    
    const response = await this.aiProvider.complete(systemPrompt, userPrompt);
    
    this.logger.debug('Code generation completed', { tokens: response.tokens });
    return response;
  }

  async getCompletions(context: CodeContext): Promise<CompletionSuggestion[]> {
    if (!this.config.enableAutoComplete) {
      this.logger.debug('Auto-complete is disabled');
      return [];
    }

    this.logger.debug('Getting code completions...', { filePath: context.filePath });
    
    // 分析当前代码上下文
    const analysis = await this.codeAnalyzer.analyzeCode(
      context.content, 
      context.language, 
      context.filePath
    );
    
    const systemPrompt = this.buildSystemPrompt('completion');
    const userPrompt = this.buildCompletionPrompt(context, analysis);
    
    const response = await this.aiProvider.complete(systemPrompt, userPrompt);
    
    return this.parseCompletions(response.content);
  }

  async reviewCode(context: CodeContext): Promise<CodeReviewResult[]> {
    if (!this.config.enableCodeReview) {
      this.logger.debug('Code review is disabled');
      return [];
    }

    this.logger.info('Reviewing code...', { filePath: context.filePath });
    
    const systemPrompt = this.buildSystemPrompt('code_review');
    const userPrompt = this.buildCodeReviewPrompt(context);
    
    const response = await this.aiProvider.complete(systemPrompt, userPrompt);
    
    return this.parseCodeReview(response.content);
  }

  async debugCode(errorInfo: DebugInfo): Promise<string[]> {
    if (!this.config.enableDebug) {
      this.logger.debug('Debug assistance is disabled');
      return [];
    }

    this.logger.info('Debugging code...', { errorType: errorInfo.errorType });
    
    const systemPrompt = this.buildSystemPrompt('debugging');
    const userPrompt = this.buildDebugPrompt(errorInfo);
    
    const response = await this.aiProvider.complete(systemPrompt, userPrompt);
    
    return this.parseDebugSuggestions(response.content);
  }

  async analyzeProject(rootPath: string): Promise<ProjectInfo> {
    this.logger.info('Analyzing project...', { rootPath });
    
    // 简化项目分析 - 暂时返回基本信息
    const projectInfo: ProjectInfo = {
      name: rootPath.split('/').pop() || 'unknown',
      type: 'other',
      files: [],
      dependencies: [],
      config: {}
    };
    
    this.logger.debug('Project analysis completed', { 
      name: projectInfo.name, 
      type: projectInfo.type,
      files: projectInfo.files.length 
    });
    
    return projectInfo;
  }

  private buildSystemPrompt(type: string): string {
    const basePrompt = `You are an expert software engineer and coding assistant. You are helping with ${type}.`;
    
    const customPrompt = this.config.customPrompts?.[type];
    if (customPrompt) {
      return `${basePrompt} ${customPrompt}`;
    }
    
    const defaultPrompts: Record<string, string> = {
      code_generation: `${basePrompt} Generate high-quality, production-ready code. Follow best practices and include proper error handling.`,
      completion: `${basePrompt} Provide relevant code completions based on the current context.`,
      code_review: `${basePrompt} Review the code for quality, performance, security issues, and best practices.`,
      debugging: `${basePrompt} Help debug the issue by providing clear explanations and solutions.`,
    };
    
    return defaultPrompts[type] || basePrompt;
  }

  private buildCodeGenerationPrompt(context: CodeContext, prompt: string): string {
    return `
Current file: ${context.filePath}
Language: ${context.language}

Existing code:
${context.content}

Cursor position: Line ${context.cursorPosition.line + 1}, Character ${context.cursorPosition.character + 1}

User request: ${prompt}

Please generate the requested code following these guidelines:
1. Follow the existing code style and patterns
2. Include proper error handling
3. Add meaningful comments
4. Ensure compatibility with the existing codebase
5. Use modern best practices

Generated code:
`;
  }

  private buildCompletionPrompt(context: CodeContext, analysis: any): string {
    return `
Current file: ${context.filePath}
Language: ${context.language}

Context analysis: ${JSON.stringify(analysis, null, 2)}

Current code around cursor:
${this.getContextAroundCursor(context)}

Please suggest relevant code completions for the current cursor position.
Return suggestions in a structured format with type, text, and description.
`;
  }

  private buildCodeReviewPrompt(context: CodeContext): string {
    return `
Please review the following code for quality, performance, security, and best practices:

File: ${context.filePath}
Language: ${context.language}

Code:
${context.content}

Provide a detailed review with:
1. Issues found (with line numbers)
2. Severity levels (high/medium/low)
3. Suggested fixes
4. Best practice recommendations

Format your response as JSON with the following structure:
{
  "issues": [
    {
      "type": "error|warning|suggestion",
      "message": "description",
      "line": line_number,
      "severity": "high|medium|low",
      "suggestion": "fix_suggestion"
    }
  ]
}
`;
  }

  private buildDebugPrompt(errorInfo: DebugInfo): string {
    return `
I need help debugging the following issue:

Error type: ${errorInfo.errorType}
Error message: ${errorInfo.message}

Stack trace:
${errorInfo.stackTrace || 'Not available'}

Code context:
File: ${errorInfo.context.filePath}
Language: ${errorInfo.context.language}

Code:
${errorInfo.context.content}

Please provide:
1. Analysis of the root cause
2. Step-by-step debugging approach
3. Potential solutions
4. Prevention strategies

Debug suggestions:
`;
  }

  private getContextAroundCursor(context: CodeContext): string {
    const lines = context.content.split('\n');
    const cursorLine = context.cursorPosition.line;
    const startLine = Math.max(0, cursorLine - 5);
    const endLine = Math.min(lines.length - 1, cursorLine + 5);
    
    return lines.slice(startLine, endLine + 1)
      .map((line, index) => {
        const lineNumber = startLine + index + 1;
        const marker = lineNumber === cursorLine + 1 ? ' -> ' : '    ';
        return `${marker}${lineNumber}: ${line}`;
      })
      .join('\n');
  }

  private parseCompletions(content: string): CompletionSuggestion[] {
    try {
      // 尝试解析JSON格式的补全建议
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // 如果不是JSON，尝试解析文本格式
    }
    
    // 简单的文本解析逻辑
    const suggestions: CompletionSuggestion[] = [];
    const lines = content.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      if (line.includes(':') || line.includes('-')) {
        const [text, description] = line.split(/[:|-]/).map(s => s.trim());
        suggestions.push({
          text: text.replace(/^[*\s]+/, ''),
          type: 'function',
          description: description || '',
          confidence: 0.8,
        });
      }
    }
    
    return suggestions;
  }

  private parseCodeReview(content: string): CodeReviewResult[] {
    try {
      const parsed = JSON.parse(content);
      if (parsed.issues && Array.isArray(parsed.issues)) {
        return parsed.issues;
      }
    } catch (error) {
      this.logger.debug('Failed to parse code review as JSON, using text parsing');
    }
    
    // 简单的文本解析
    const results: CodeReviewResult[] = [];
    const lines = content.split('\n').filter(line => line.trim());
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.toLowerCase().includes('error') || line.toLowerCase().includes('warning')) {
        results.push({
          type: line.toLowerCase().includes('error') ? 'error' : 'warning',
          message: line,
          line: i + 1,
          severity: 'medium',
        });
      }
    }
    
    return results;
  }

  private parseDebugSuggestions(content: string): string[] {
    return content
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^[*\-\d\.\s]+/, '').trim())
      .filter(line => line.length > 0);
  }

  // 公共API方法
  getConfig(): ToolConfig {
    return this.configManager.getConfig();
  }

  updateConfig(updates: Partial<ToolConfig>): void {
    this.configManager.updateConfig(updates);
    this.config = this.configManager.getConfig();
  }

  async saveConfig(updates: Partial<ToolConfig>): Promise<void> {
    await this.configManager.saveConfig(updates);
    this.config = this.configManager.getConfig();
  }
}