"use strict";
/**
 * Advanced Coding Tool - 代码分析器
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeAnalyzer = void 0;
const tree_sitter_1 = __importDefault(require("tree-sitter"));
const tree_sitter_javascript_1 = __importDefault(require("tree-sitter-javascript"));
const tree_sitter_typescript_1 = __importDefault(require("tree-sitter-typescript"));
const tree_sitter_python_1 = __importDefault(require("tree-sitter-python"));
const tree_sitter_java_1 = __importDefault(require("tree-sitter-java"));
const project_1 = require("./project");
class CodeAnalyzer {
    parser;
    projectAnalyzer;
    languageParsers;
    constructor() {
        this.parser = new tree_sitter_1.default();
        this.projectAnalyzer = new project_1.ProjectAnalyzer();
        this.languageParsers = new Map([
            ['javascript', tree_sitter_javascript_1.default],
            ['typescript', tree_sitter_typescript_1.default.tsx],
            ['python', tree_sitter_python_1.default],
            ['java', tree_sitter_java_1.default],
        ]);
    }
    async initialize() {
        // 加载语言解析器
        for (const [lang, langModule] of this.languageParsers) {
            try {
                this.parser.setLanguage(langModule);
                console.log(`✓ Loaded parser for ${lang}`);
            }
            catch (error) {
                console.warn(`Failed to load parser for ${lang}:`, error);
            }
        }
    }
    async analyzeContext(context) {
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
    async analyzeProject(rootPath) {
        return await this.projectAnalyzer.analyzeProject(rootPath);
    }
    getLanguageParser(language) {
        // 标准化语言名称
        const normalizedLang = language.toLowerCase();
        const langMap = {
            'js': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'jsx': 'javascript',
        };
        const parserKey = langMap[normalizedLang] || normalizedLang;
        return this.languageParsers.get(parserKey);
    }
    extractSymbols(tree, language) {
        const symbols = [];
        const cursor = tree.walk();
        const visitNode = (node) => {
            const nodeType = node.type;
            // 根据语言提取不同的符号类型
            if (language === 'javascript' || language === 'typescript') {
                this.extractJavaScriptSymbols(node, symbols);
            }
            else if (language === 'python') {
                this.extractPythonSymbols(node, symbols);
            }
            else if (language === 'java') {
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
    extractJavaScriptSymbols(node, symbols) {
        const nodeType = node.type;
        if (nodeType === 'function_declaration' || nodeType === 'method_definition') {
            const nameNode = node.childForFieldName('name');
            if (nameNode) {
                symbols.push({
                    name: nameNode.text.toString(),
                    type: nodeType === 'function_declaration' ? 'function' : 'method',
                    line: nameNode.startPosition.row + 1,
                    column: nameNode.startPosition.column + 1,
                });
            }
        }
        else if (nodeType === 'class_declaration') {
            const nameNode = node.childForFieldName('name');
            if (nameNode) {
                symbols.push({
                    name: nameNode.text.toString(),
                    type: 'class',
                    line: nameNode.startPosition.row + 1,
                    column: nameNode.startPosition.column + 1,
                });
            }
        }
        else if (nodeType === 'variable_declarator') {
            const nameNode = node.childForFieldName('name');
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
    extractPythonSymbols(node, symbols) {
        const nodeType = node.type;
        if (nodeType === 'function_definition') {
            const nameNode = node.childForFieldName('name');
            if (nameNode) {
                symbols.push({
                    name: nameNode.text.toString(),
                    type: 'function',
                    line: nameNode.startPosition.row + 1,
                    column: nameNode.startPosition.column + 1,
                });
            }
        }
        else if (nodeType === 'class_definition') {
            const nameNode = node.childForFieldName('name');
            if (nameNode) {
                symbols.push({
                    name: nameNode.text.toString(),
                    type: 'class',
                    line: nameNode.startPosition.row + 1,
                    column: nameNode.startPosition.column + 1,
                });
            }
        }
        else if (nodeType === 'assignment') {
            const leftSide = node.childForFieldName('left');
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
    extractJavaSymbols(node, symbols) {
        const nodeType = node.type;
        if (nodeType === 'method_declaration') {
            const nameNode = node.childForFieldName('name');
            if (nameNode) {
                symbols.push({
                    name: nameNode.text.toString(),
                    type: 'method',
                    line: nameNode.startPosition.row + 1,
                    column: nameNode.startPosition.column + 1,
                });
            }
        }
        else if (nodeType === 'class_declaration') {
            const nameNode = node.childForFieldName('name');
            if (nameNode) {
                symbols.push({
                    name: nameNode.text.toString(),
                    type: 'class',
                    line: nameNode.startPosition.row + 1,
                    column: nameNode.startPosition.column + 1,
                });
            }
        }
        else if (nodeType === 'field_declaration') {
            const declarator = node.childForFieldName('declarator');
            if (declarator) {
                const nameNode = declarator.childForFieldName('name');
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
    extractDependencies(tree, language) {
        const dependencies = [];
        const cursor = tree.walk();
        const visitNode = (node) => {
            if (language === 'javascript' || language === 'typescript') {
                if (node.type === 'import_statement') {
                    const sourceNode = node.childForFieldName('source');
                    if (sourceNode) {
                        const importPath = sourceNode.text.toString().replace(/['"]/g, '');
                        if (!importPath.startsWith('.')) {
                            dependencies.push(importPath);
                        }
                    }
                }
            }
            else if (language === 'python') {
                if (node.type === 'import_statement' || node.type === 'import_from_statement') {
                    const moduleNode = node.childForFieldName('module');
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
    calculateComplexity(tree) {
        let complexity = 1; // 基础复杂度
        const visitNode = (node) => {
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
    detectIssues(tree, language) {
        const issues = [];
        // 检查语法错误
        const visitNode = (node) => {
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
exports.CodeAnalyzer = CodeAnalyzer;
//# sourceMappingURL=analyzer.js.map