/**
 * Advanced Coding Tool - 代码分析器
 */

import Parser from 'tree-sitter';
import JavaScript from 'tree-sitter-javascript';
import TypeScript from 'tree-sitter-typescript';
import Python from 'tree-sitter-python';
import Java from 'tree-sitter-java';
import { CodeContext, ProjectInfo } from '../core/types';
import { ProjectAnalyzer } from './project';

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

export class CodeAnalyzer {
  private parser: Parser;
  private projectAnalyzer: ProjectAnalyzer;
  private languageParsers: Map<string, any>;

  constructor() {
    this.parser = new Parser();
    this.projectAnalyzer = new ProjectAnalyzer();
    this.languageParsers = new Map([
      ['javascript', JavaScript],
      ['typescript', TypeScript.tsx],
      ['python', Python],
      ['java', Java],
    ]);
  }

  async initialize(): Promise<void> {
    // 加载语言解析器
    for (const [lang, langModule] of this.languageParsers) {
      try {
        this.parser.setLanguage(langModule);
        console.log(`✓ Loaded parser for ${lang}`);
      } catch (error) {
        console.warn(`Failed to load parser for ${lang}:`, error);
      }
    }
  }

  async analyzeContext(context: CodeContext): Promise<CodeAnalysis> {
    const language = this.getLanguageParser(context.language);
    if (!language) {
      throw new Error(`Unsupported language: ${context.language}`);
    }

    this.parser.setLanguage(language);
    const tree = this.parser.parse(context.content);

    return {
      ast: tree,
      symbols: this.extractSymbols(tree, context.language),
      dependencies: this.extractDependencies(tree, context.language),
      complexity: this.calculateComplexity(tree),
      issues: this.detectIssues(tree, context.language),
    };
  }

  async analyzeProject(rootPath: string): Promise<ProjectInfo> {
    return await this.projectAnalyzer.analyzeProject(rootPath);
  }

  private getLanguageParser(language: string): any {
    // 标准化语言名称
    const normalizedLang = language.toLowerCase();
    
    const langMap: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'jsx': 'javascript',
    };
    
    const parserKey = langMap[normalizedLang] || normalizedLang;
    return this.languageParsers.get(parserKey);
  }

  private extractSymbols(tree: Parser.Tree, language: string): SymbolInfo[] {
    const symbols: SymbolInfo[] = [];
    const cursor = tree.walk();

    const visitNode = (node: Parser.SyntaxNode) => {
      const nodeType = node.type;
      
      // 根据语言提取不同的符号类型
      if (language === 'javascript' || language === 'typescript') {
        this.extractJavaScriptSymbols(node, symbols);
      } else if (language === 'python') {
        this.extractPythonSymbols(node, symbols);
      } else if (language === 'java') {
        this.extractJavaSymbols(node, symbols);
      }

      // 递归访问子节点
      for (const child of node.children) {
        visitNode(child);
      }
    };

    visitNode(tree.rootNode);
    return symbols;
  }

  private extractJavaScriptSymbols(node: Parser.SyntaxNode, symbols: SymbolInfo[]): void {
    const nodeType = node.type;
    
    if (nodeType === 'function_declaration' || nodeType === 'method_definition') {
      const nameNode = (node as any).childForFieldName('name');
      if (nameNode) {
        symbols.push({
          name: nameNode.text.toString(),
          type: nodeType === 'function_declaration' ? 'function' : 'method',
          line: nameNode.startPosition.row + 1,
          column: nameNode.startPosition.column + 1,
        });
      }
    } else if (nodeType === 'class_declaration') {
      const nameNode = (node as any).childForFieldName('name');
      if (nameNode) {
        symbols.push({
          name: nameNode.text.toString(),
          type: 'class',
          line: nameNode.startPosition.row + 1,
          column: nameNode.startPosition.column + 1,
        });
      }
    } else if (nodeType === 'variable_declarator') {
      const nameNode = (node as any).childForFieldName('name');
      if (nameNode && nameNode.type === 'identifier') {
        symbols.push({
          name: nameNode.text.toString(),
          type: 'variable',
          line: nameNode.startPosition.row + 1,
          column: nameNode.startPosition.column + 1,
        });
      }
    }
  }

  private extractPythonSymbols(node: Parser.SyntaxNode, symbols: SymbolInfo[]): void {
    const nodeType = node.type;
    
    if (nodeType === 'function_definition') {
      const nameNode = (node as any).childForFieldName('name');
      if (nameNode) {
        symbols.push({
          name: nameNode.text.toString(),
          type: 'function',
          line: nameNode.startPosition.row + 1,
          column: nameNode.startPosition.column + 1,
        });
      }
    } else if (nodeType === 'class_definition') {
      const nameNode = (node as any).childForFieldName('name');
      if (nameNode) {
        symbols.push({
          name: nameNode.text.toString(),
          type: 'class',
          line: nameNode.startPosition.row + 1,
          column: nameNode.startPosition.column + 1,
        });
      }
    } else if (nodeType === 'assignment') {
      const leftSide = (node as any).childForFieldName('left');
      if (leftSide && leftSide.type === 'identifier') {
        symbols.push({
          name: leftSide.text.toString(),
          type: 'variable',
          line: leftSide.startPosition.row + 1,
          column: leftSide.startPosition.column + 1,
        });
      }
    }
  }

  private extractJavaSymbols(node: Parser.SyntaxNode, symbols: SymbolInfo[]): void {
    const nodeType = node.type;
    
    if (nodeType === 'method_declaration') {
      const nameNode = (node as any).childForFieldName('name');
      if (nameNode) {
        symbols.push({
          name: nameNode.text.toString(),
          type: 'method',
          line: nameNode.startPosition.row + 1,
          column: nameNode.startPosition.column + 1,
        });
      }
    } else if (nodeType === 'class_declaration') {
      const nameNode = (node as any).childForFieldName('name');
      if (nameNode) {
        symbols.push({
          name: nameNode.text.toString(),
          type: 'class',
          line: nameNode.startPosition.row + 1,
          column: nameNode.startPosition.column + 1,
        });
      }
    } else if (nodeType === 'field_declaration') {
      const declarator = (node as any).childForFieldName('declarator');
      if (declarator) {
        const nameNode = (declarator as any).childForFieldName('name');
        if (nameNode) {
          symbols.push({
            name: nameNode.text.toString(),
            type: 'property',
            line: nameNode.startPosition.row + 1,
            column: nameNode.startPosition.column + 1,
          });
        }
      }
    }
  }

  private extractDependencies(tree: Parser.Tree, language: string): string[] {
    const dependencies: string[] = [];
    const cursor = tree.walk();

    const visitNode = (node: Parser.SyntaxNode) => {
      if (language === 'javascript' || language === 'typescript') {
        if (node.type === 'import_statement') {
          const sourceNode = (node as any).childForFieldName('source');
          if (sourceNode) {
            const importPath = sourceNode.text.toString().replace(/['"]/g, '');
            if (!importPath.startsWith('.')) {
              dependencies.push(importPath);
            }
          }
        }
      } else if (language === 'python') {
        if (node.type === 'import_statement' || node.type === 'import_from_statement') {
          const moduleNode = (node as any).childForFieldName('module');
          if (moduleNode) {
            dependencies.push(moduleNode.text.toString());
          }
        }
      }

      for (const child of node.children) {
        visitNode(child);
      }
    };

    visitNode(tree.rootNode);
    return [...new Set(dependencies)]; // 去重
  }

  private calculateComplexity(tree: Parser.Tree): number {
    let complexity = 1; // 基础复杂度
    
    const visitNode = (node: Parser.SyntaxNode) => {
      // 增加控制流语句的复杂度
      if (['if_statement', 'while_statement', 'for_statement', 'switch_statement', 
           'catch_clause', '&&', '||', 'conditional_expression'].includes(node.type)) {
        complexity++;
      }
      
      for (const child of node.children) {
        visitNode(child);
      }
    };
    
    visitNode(tree.rootNode);
    return complexity;
  }

  private detectIssues(tree: Parser.Tree, language: string): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];
    
    // 检查语法错误
    const visitNode = (node: Parser.SyntaxNode) => {
      if (node.hasError()) {
        issues.push({
          type: 'error',
          message: 'Syntax error',
          line: node.startPosition.row + 1,
          column: node.startPosition.column + 1,
          rule: 'syntax-error',
        });
      }
      
      // 检查过长的行
      if (node.type === 'program') {
        const lines = node.text?.toString().split('\n') || [];
        lines.forEach((line, index) => {
          if (line.length > 120) {
            issues.push({
              type: 'warning',
              message: `Line too long (${line.length} > 120 characters)`,
              line: index + 1,
              column: 120,
              rule: 'line-length',
            });
          }
        });
      }
      
      for (const child of node.children) {
        visitNode(child);
      }
    };
    
    visitNode(tree.rootNode);
    return issues;
  }
}