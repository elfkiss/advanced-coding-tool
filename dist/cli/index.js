#!/usr/bin/env node
"use strict";
/**
 * Advanced Coding Tool - CLI入口
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const core_1 = require("../core");
const logger_1 = require("../core/logger");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const inquirer_1 = __importDefault(require("inquirer"));
const fastGlob = __importStar(require("fast-glob"));
const program = new commander_1.Command();
const logger = new logger_1.Logger('CLI');
const engine = new core_1.AdvancedCodingEngine();
// 版本信息
program
    .name('act')
    .description('Advanced Coding Tool - 基于AI的编程助手')
    .version('0.1.0');
// 初始化项目
program
    .command('init')
    .description('初始化项目配置')
    .option('-f, --force', '强制重新初始化')
    .action(async (options) => {
    try {
        await engine.initialize();
        const configExists = await fileExists('.actrc.json');
        if (configExists && !options.force) {
            const { overwrite } = await inquirer_1.default.prompt([{
                    type: 'confirm',
                    name: 'overwrite',
                    message: '配置文件已存在，是否覆盖？',
                    default: false,
                }]);
            if (!overwrite) {
                logger.info('初始化已取消');
                return;
            }
        }
        // 交互式配置
        const answers = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'aiProvider',
                message: '选择AI提供商',
                choices: ['claude', 'openai'],
                default: 'claude',
            },
            {
                type: 'input',
                name: 'model',
                message: '选择模型',
                default: (answers) => answers.aiProvider === 'claude' ? 'claude-3-sonnet-20240229' : 'gpt-4',
            },
            {
                type: 'number',
                name: 'maxTokens',
                message: '最大token数',
                default: 4000,
            },
            {
                type: 'number',
                name: 'temperature',
                message: '温度 (0-1)',
                default: 0.7,
            },
            {
                type: 'confirm',
                name: 'enableAutoComplete',
                message: '启用智能补全',
                default: true,
            },
            {
                type: 'confirm',
                name: 'enableCodeReview',
                message: '启用代码审查',
                default: true,
            },
            {
                type: 'confirm',
                name: 'enableDebug',
                message: '启用调试辅助',
                default: true,
            },
        ]);
        await engine.saveConfig(answers);
        logger.success('项目初始化完成！');
        logger.info('配置文件已保存到 .actrc.json');
    }
    catch (error) {
        logger.error('初始化失败:', error);
        process.exit(1);
    }
});
// 生成代码
program
    .command('generate')
    .description('生成代码')
    .argument('[file]', '目标文件路径')
    .option('-p, --prompt <text>', '生成代码的提示')
    .option('-l, --language <lang>', '代码语言')
    .action(async (file, options) => {
    try {
        await engine.initialize();
        let filePath = file;
        if (!filePath) {
            const { inputFile } = await inquirer_1.default.prompt([{
                    type: 'input',
                    name: 'inputFile',
                    message: '请输入目标文件路径:',
                    validate: (input) => input.length > 0 || '文件路径不能为空',
                }]);
            filePath = inputFile;
        }
        let prompt = options.prompt;
        if (!prompt) {
            const { codePrompt } = await inquirer_1.default.prompt([{
                    type: 'editor',
                    name: 'codePrompt',
                    message: '请输入生成代码的提示:',
                    default: '生成一个函数来实现...',
                }]);
            prompt = codePrompt;
        }
        const spinner = (0, ora_1.default)('正在生成代码...').start();
        try {
            // 读取文件内容
            let content = '';
            let language = options.language || path.extname(filePath).slice(1) || 'javascript';
            try {
                content = await fs.readFile(filePath, 'utf-8');
            }
            catch (error) {
                // 文件不存在，创建新文件
                logger.info(`创建新文件: ${filePath}`);
            }
            const context = {
                filePath,
                content,
                language,
                cursorPosition: { line: 0, character: 0 },
            };
            const response = await engine.generateCode(context, prompt);
            // 写入文件
            await fs.writeFile(filePath, response.content, 'utf-8');
            spinner.succeed('代码生成完成！');
            logger.info(`文件已保存: ${filePath}`);
            logger.info(`使用token: ${response.tokens.total}`);
        }
        catch (error) {
            spinner.fail('代码生成失败');
            throw error;
        }
    }
    catch (error) {
        logger.error('生成失败:', error);
        process.exit(1);
    }
});
// 代码审查
program
    .command('review')
    .description('代码审查')
    .argument('[file]', '要审查的文件')
    .option('-a, --auto-fix', '自动修复问题')
    .action(async (file, options) => {
    try {
        await engine.initialize();
        let filePath = file;
        if (!filePath) {
            const files = await getProjectFiles();
            const { selectedFile } = await inquirer_1.default.prompt([{
                    type: 'list',
                    name: 'selectedFile',
                    message: '选择要审查的文件:',
                    choices: files.slice(0, 20), // 限制显示数量
                }]);
            filePath = selectedFile;
        }
        const spinner = (0, ora_1.default)('正在审查代码...').start();
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const language = path.extname(filePath).slice(1) || 'javascript';
            const context = {
                filePath,
                content,
                language,
                cursorPosition: { line: 0, character: 0 },
            };
            const issues = await engine.reviewCode(context);
            spinner.stop();
            if (issues.length === 0) {
                logger.success('🎉 代码审查通过，没有发现问题！');
                return;
            }
            logger.info(`发现 ${issues.length} 个问题:`);
            const groupedIssues = groupIssuesBySeverity(issues);
            for (const [severity, issueList] of Object.entries(groupedIssues)) {
                const color = severity === 'high' ? chalk_1.default.red :
                    severity === 'medium' ? chalk_1.default.yellow : chalk_1.default.blue;
                console.log(color(`\n${severity.toUpperCase()} 优先级问题:`));
                for (const issue of issueList) {
                    console.log(color(`  ${issue.line}:${issue.column || 0} - ${issue.message}`));
                    if (issue.suggestion) {
                        console.log(chalk_1.default.gray(`    建议: ${issue.suggestion}`));
                    }
                    // 自动修复
                    if (options.autoFix && issue.autoFix) {
                        await applyAutoFix(filePath, issue);
                    }
                }
            }
        }
        catch (error) {
            spinner.fail('代码审查失败');
            throw error;
        }
    }
    catch (error) {
        logger.error('审查失败:', error);
        process.exit(1);
    }
});
// 调试辅助
program
    .command('debug')
    .description('调试辅助')
    .argument('[file]', '包含错误的文件')
    .option('-e, --error <text>', '错误信息')
    .option('-s, --stack <text>', '堆栈信息')
    .action(async (file, options) => {
    try {
        await engine.initialize();
        let filePath = file;
        if (!filePath) {
            const { debugFile } = await inquirer_1.default.prompt([{
                    type: 'input',
                    name: 'debugFile',
                    message: '请输入包含错误的文件路径:',
                }]);
            filePath = debugFile;
        }
        let errorInfo = options.error;
        if (!errorInfo) {
            const { errorMessage } = await inquirer_1.default.prompt([{
                    type: 'editor',
                    name: 'errorMessage',
                    message: '请输入错误信息:',
                    default: 'TypeError: Cannot read property...',
                }]);
            errorInfo = errorMessage;
        }
        const spinner = (0, ora_1.default)('正在分析错误...').start();
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const language = path.extname(filePath).slice(1) || 'javascript';
            const context = {
                filePath,
                content,
                language,
                cursorPosition: { line: 0, character: 0 },
            };
            const debugInfo = {
                errorType: 'Error',
                message: errorInfo,
                stackTrace: options.stack,
                context,
                suggestions: [],
            };
            const suggestions = await engine.debugCode(debugInfo);
            spinner.stop();
            logger.info('调试建议:');
            suggestions.forEach((suggestion, index) => {
                console.log(chalk_1.default.cyan(`${index + 1}. ${suggestion}`));
            });
        }
        catch (error) {
            spinner.fail('调试分析失败');
            throw error;
        }
    }
    catch (error) {
        logger.error('调试失败:', error);
        process.exit(1);
    }
});
// 项目分析
program
    .command('analyze')
    .description('分析项目')
    .action(async () => {
    try {
        await engine.initialize();
        const spinner = (0, ora_1.default)('正在分析项目...').start();
        try {
            const projectInfo = await engine.analyzeProject(process.cwd());
            spinner.stop();
            logger.success('项目分析完成！');
            console.log(chalk_1.default.bold('\n项目信息:'));
            console.log(`  名称: ${projectInfo.name}`);
            console.log(`  类型: ${projectInfo.type}`);
            console.log(`  文件数: ${projectInfo.files.length}`);
            console.log(`  依赖数: ${projectInfo.dependencies.length}`);
            if (projectInfo.dependencies.length > 0) {
                console.log(chalk_1.default.bold('\n主要依赖:'));
                projectInfo.dependencies.slice(0, 10).forEach(dep => {
                    console.log(`  - ${dep}`);
                });
                if (projectInfo.dependencies.length > 10) {
                    console.log(`  ... 还有 ${projectInfo.dependencies.length - 10} 个依赖`);
                }
            }
        }
        catch (error) {
            spinner.fail('项目分析失败');
            throw error;
        }
    }
    catch (error) {
        logger.error('分析失败:', error);
        process.exit(1);
    }
});
// 配置管理
program
    .command('config')
    .description('配置管理')
    .option('-s, --show', '显示当前配置')
    .option('-u, --update <key=value>', '更新配置项')
    .action(async (options) => {
    try {
        await engine.initialize();
        if (options.show) {
            const config = engine.getConfig();
            console.log(chalk_1.default.bold('当前配置:'));
            console.log(JSON.stringify(config, null, 2));
            return;
        }
        if (options.update) {
            const [key, value] = options.update.split('=');
            if (!key || !value) {
                logger.error('配置更新格式错误，应为 key=value');
                return;
            }
            const updates = {};
            updates[key] = isNaN(Number(value)) ? value : Number(value);
            await engine.saveConfig(updates);
            logger.success('配置已更新');
            return;
        }
        // 交互式配置
        const currentConfig = engine.getConfig();
        const answers = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'aiProvider',
                message: 'AI提供商:',
                choices: ['claude', 'openai'],
                default: currentConfig.aiProvider,
            },
            {
                type: 'number',
                name: 'maxTokens',
                message: '最大token数:',
                default: currentConfig.maxTokens,
            },
            {
                type: 'number',
                name: 'temperature',
                message: '温度 (0-1):',
                default: currentConfig.temperature,
            },
        ]);
        await engine.saveConfig(answers);
        logger.success('配置已保存');
    }
    catch (error) {
        logger.error('配置操作失败:', error);
        process.exit(1);
    }
});
// 帮助信息
program
    .command('help')
    .description('显示详细帮助信息')
    .action(() => {
    console.log(chalk_1.default.bold.blue('\n🚀 Advanced Coding Tool'));
    console.log(chalk_1.default.gray('基于AI的智能编程助手\n'));
    console.log(chalk_1.default.bold('基本用法:'));
    console.log('  act init              # 初始化项目');
    console.log('  act generate          # 生成代码');
    console.log('  act review            # 代码审查');
    console.log('  act debug             # 调试辅助');
    console.log('  act analyze           # 项目分析');
    console.log('  act config            # 配置管理\n');
    console.log(chalk_1.default.bold('示例:'));
    console.log('  act generate src/utils.js -p "创建一个数组工具函数"');
    console.log('  act review src/index.js --auto-fix');
    console.log('  act debug app.js -e "TypeError: undefined is not a function"\n');
    console.log(chalk_1.default.bold('快捷键:'));
    console.log('  --help    显示帮助');
    console.log('  --version 显示版本\n');
});
// 辅助函数
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
async function getProjectFiles() {
    try {
        return await fastGlob('**/*.{js,ts,jsx,tsx,py,java}', {
            ignore: ['node_modules', '.git'],
            onlyFiles: true,
        });
    }
    catch (error) {
        return [];
    }
}
function groupIssuesBySeverity(issues) {
    return issues.reduce((groups, issue) => {
        const severity = issue.severity || 'low';
        if (!groups[severity]) {
            groups[severity] = [];
        }
        groups[severity].push(issue);
        return groups;
    }, {});
}
async function applyAutoFix(filePath, issue) {
    if (issue.autoFix) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n');
            lines[issue.line - 1] = issue.autoFix;
            await fs.writeFile(filePath, lines.join('\n'), 'utf-8');
            logger.success(`已自动修复第 ${issue.line} 行`);
        }
        catch (error) {
            logger.warn(`自动修复失败: ${error}`);
        }
    }
}
// 错误处理
process.on('unhandledRejection', (error) => {
    logger.error('未处理的Promise拒绝:', error);
    process.exit(1);
});
process.on('uncaughtException', (error) => {
    logger.error('未捕获的异常:', error);
    process.exit(1);
});
// 启动CLI
program.parseAsync().catch((error) => {
    logger.error('程序执行失败:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map