/**
 * Advanced Coding Tool - 代码解析器
 */

import Parser from 'tree-sitter';

export class CodeParser {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
  }

  async loadLanguage(language: string): Promise<void> {
    switch (language) {
      case 'javascript':
        this.parser.setLanguage(require('tree-sitter-javascript'));
        break;
      case 'typescript':
        this.parser.setLanguage(require('tree-sitter-typescript'));
        break;
      case 'python':
        this.parser.setLanguage(require('tree-sitter-python'));
        break;
      case 'java':
        this.parser.setLanguage(require('tree-sitter-java'));
        break;
      default:
        throw new Error(`不支持的语言: ${language}`);
    }
  }

  parse(code: string): Parser.Tree {
    return this.parser.parse(code);
  }

  parseFile(filePath: string, code: string): Parser.Tree {
    const language = this.getLanguageFromPath(filePath);
    this.loadLanguage(language);
    return this.parse(code);
  }

  private getLanguageFromPath(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'py':
        return 'python';
      case 'java':
        return 'java';
      default:
        return 'javascript';
    }
  }
}