/**
 * Advanced Coding Tool - 简化版代码分析器
 */
export interface CodeAnalysis {
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
}
export declare class SimpleCodeAnalyzer {
    analyzeCode(code: string, language: string, filePath: string): Promise<CodeAnalysis>;
    private extractSymbols;
    private extractDependencies;
    private calculateComplexity;
    private detectIssues;
}
//# sourceMappingURL=simple-analyzer.d.ts.map