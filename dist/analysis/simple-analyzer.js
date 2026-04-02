"use strict";
/**
 * Advanced Coding Tool - 简化版代码分析器
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleCodeAnalyzer = void 0;
class SimpleCodeAnalyzer {
    async analyzeCode(code, language, filePath) {
        const symbols = this.extractSymbols(code, language);
        const dependencies = this.extractDependencies(code, language);
        const complexity = this.calculateComplexity(code, language);
        const issues = this.detectIssues(code, language);
        return {
            symbols,
            dependencies,
            complexity,
            issues
        };
    }
    extractSymbols(code, language) {
        const symbols = [];
        const lines = code.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;
            // 简单的正则表达式匹配
            if (language === 'javascript' || language === 'typescript') {
                // 函数声明
                const funcMatch = line.match(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
                if (funcMatch) {
                    symbols.push({
                        name: funcMatch[1],
                        type: 'function',
                        line: lineNumber,
                        column: line.indexOf(funcMatch[1])
                    });
                }
                // 类声明
                const classMatch = line.match(/class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
                if (classMatch) {
                    symbols.push({
                        name: classMatch[1],
                        type: 'class',
                        line: lineNumber,
                        column: line.indexOf(classMatch[1])
                    });
                }
                // 变量声明
                const varMatch = line.match(/(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
                if (varMatch) {
                    symbols.push({
                        name: varMatch[1],
                        type: 'variable',
                        line: lineNumber,
                        column: line.indexOf(varMatch[1])
                    });
                }
            }
            else if (language === 'python') {
                // 函数定义
                const funcMatch = line.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
                if (funcMatch) {
                    symbols.push({
                        name: funcMatch[1],
                        type: 'function',
                        line: lineNumber,
                        column: line.indexOf(funcMatch[1])
                    });
                }
                // 类定义
                const classMatch = line.match(/class\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
                if (classMatch) {
                    symbols.push({
                        name: classMatch[1],
                        type: 'class',
                        line: lineNumber,
                        column: line.indexOf(classMatch[1])
                    });
                }
            }
            else if (language === 'java') {
                // 方法定义
                const methodMatch = line.match(/(?:public|private|protected)?\s*(?:static)?\s*(?:[a-zA-Z_][a-zA-Z0-9_<>,\s]*\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
                if (methodMatch) {
                    symbols.push({
                        name: methodMatch[1],
                        type: 'method',
                        line: lineNumber,
                        column: line.indexOf(methodMatch[1])
                    });
                }
                // 类定义
                const classMatch = line.match(/class\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
                if (classMatch) {
                    symbols.push({
                        name: classMatch[1],
                        type: 'class',
                        line: lineNumber,
                        column: line.indexOf(classMatch[1])
                    });
                }
            }
        }
        return symbols;
    }
    extractDependencies(code, language) {
        const dependencies = [];
        const lines = code.split('\n');
        for (const line of lines) {
            if (language === 'javascript' || language === 'typescript') {
                const importMatch = line.match(/import.*from\s+['"]([^'"]+)['"]/);
                if (importMatch) {
                    dependencies.push(importMatch[1]);
                }
                const requireMatch = line.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
                if (requireMatch) {
                    dependencies.push(requireMatch[1]);
                }
            }
            else if (language === 'python') {
                const importMatch = line.match(/import\s+([a-zA-Z_][a-zA-Z0-9_.]*)/);
                if (importMatch) {
                    dependencies.push(importMatch[1]);
                }
                const fromMatch = line.match(/from\s+([a-zA-Z_][a-zA-Z0-9_.]*)/);
                if (fromMatch) {
                    dependencies.push(fromMatch[1]);
                }
            }
            else if (language === 'java') {
                const importMatch = line.match(/import\s+([a-zA-Z_][a-zA-Z0-9_.]*)/);
                if (importMatch) {
                    dependencies.push(importMatch[1]);
                }
            }
        }
        return dependencies;
    }
    calculateComplexity(code, language) {
        let complexity = 1; // 基础复杂度
        const lines = code.split('\n');
        for (const line of lines) {
            // 计算控制流语句
            const controlFlowPatterns = [
                /\bif\s*\(/,
                /\belse\s+if\s*\(/,
                /\bfor\s*\(/,
                /\bwhile\s*\(/,
                /\bswitch\s*\(/,
                /\bcase\s+/,
                /\bcatch\s*\(/,
                /\btry\s*\{/,
                /\bthrow\b/,
                /\breturn\b/,
                /\bbreak\b/,
                /\bcontinue\b/
            ];
            for (const pattern of controlFlowPatterns) {
                if (pattern.test(line)) {
                    complexity++;
                }
            }
            // 计算嵌套深度
            const openBraces = (line.match(/\{/g) || []).length;
            const closeBraces = (line.match(/\}/g) || []).length;
            complexity += Math.max(0, openBraces - closeBraces);
        }
        return complexity;
    }
    detectIssues(code, language) {
        const issues = [];
        const lines = code.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;
            // 检查过长的行
            if (line.length > 100) {
                issues.push({
                    type: 'warning',
                    message: `行过长 (${line.length} 字符)，建议换行`,
                    line: lineNumber,
                    column: 100
                });
            }
            // 检查TODO注释
            if (line.includes('TODO') || line.includes('FIXME')) {
                issues.push({
                    type: 'info',
                    message: '发现TODO/FIXME注释',
                    line: lineNumber,
                    column: line.indexOf('TODO') || line.indexOf('FIXME')
                });
            }
            // 检查未使用的变量（简单检查）
            if (language === 'javascript' || language === 'typescript') {
                if (line.includes('console.log') && line.trim().startsWith('//')) {
                    issues.push({
                        type: 'info',
                        message: '发现被注释的console.log语句',
                        line: lineNumber,
                        column: line.indexOf('console')
                    });
                }
            }
        }
        return issues;
    }
}
exports.SimpleCodeAnalyzer = SimpleCodeAnalyzer;
//# sourceMappingURL=simple-analyzer.js.map