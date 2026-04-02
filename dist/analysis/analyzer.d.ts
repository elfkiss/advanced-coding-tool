/**
 * Advanced Coding Tool - 代码分析器
 */
import Parser from 'tree-sitter';
import { CodeContext, ProjectInfo } from '../core/types';
export interface CodeAnalysis {
    ast: Parser.Tree;
    symbols: SymbolInfo[];
    dependencies: string[];
    complexity: number;
    issues: AnalysisIssue[];
}
export interface SymbolInfo {
    name: string;
    type: 'function' | 'class' | 'variable' | 'method' | 'property';
    line: number;
    column: number;
    scope?: string;
    documentation?: string;
}
export interface AnalysisIssue {
    type: 'error' | 'warning' | 'info';
    message: string;
    line: number;
    column: number;
    rule: string;
}
export declare class CodeAnalyzer {
    private parser;
    private projectAnalyzer;
    private languageParsers;
    constructor();
    initialize(): Promise<void>;
    analyzeContext(context: CodeContext): Promise<CodeAnalysis>;
    analyzeProject(rootPath: string): Promise<ProjectInfo>;
    private getLanguageParser;
    private extractSymbols;
    private extractJavaScriptSymbols;
    private extractPythonSymbols;
    private extractJavaSymbols;
    private extractDependencies;
    private calculateComplexity;
    private detectIssues;
}
//# sourceMappingURL=analyzer.d.ts.map