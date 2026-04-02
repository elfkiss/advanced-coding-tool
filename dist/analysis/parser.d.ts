/**
 * Advanced Coding Tool - 代码解析器
 */
import Parser from 'tree-sitter';
export declare class CodeParser {
    private parser;
    constructor();
    loadLanguage(language: string): Promise<void>;
    parse(code: string): Parser.Tree;
    parseFile(filePath: string, code: string): Parser.Tree;
    private getLanguageFromPath;
}
//# sourceMappingURL=parser.d.ts.map