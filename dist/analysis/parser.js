"use strict";
/**
 * Advanced Coding Tool - 代码解析器
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeParser = void 0;
const tree_sitter_1 = __importDefault(require("tree-sitter"));
class CodeParser {
    parser;
    constructor() {
        this.parser = new tree_sitter_1.default();
    }
    async loadLanguage(language) {
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
    parse(code) {
        return this.parser.parse(code);
    }
    parseFile(filePath, code) {
        const language = this.getLanguageFromPath(filePath);
        this.loadLanguage(language);
        return this.parse(code);
    }
    getLanguageFromPath(filePath) {
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
exports.CodeParser = CodeParser;
//# sourceMappingURL=parser.js.map