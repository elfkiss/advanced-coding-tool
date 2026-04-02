"use strict";
/**
 * Advanced Coding Tool - 项目分析器
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
exports.ProjectAnalyzer = void 0;
const fast_glob_1 = __importDefault(require("fast-glob"));
const ignore_1 = __importDefault(require("ignore"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
class ProjectAnalyzer {
    ig;
    constructor() {
        this.ig = ignore_1.default();
    }
    async analyzeProject(rootPath) {
        // 读取.gitignore和其他忽略文件
        await this.loadIgnorePatterns(rootPath);
        // 确定项目类型
        const projectType = await this.detectProjectType(rootPath);
        // 获取所有文件
        const files = await this.getProjectFiles(rootPath);
        // 读取依赖信息
        const dependencies = await this.getDependencies(rootPath, projectType);
        // 读取配置文件
        const config = await this.getProjectConfig(rootPath, projectType);
        return {
            name: path.basename(rootPath),
            type: projectType,
            dependencies,
            files,
            config,
        };
    }
    async loadIgnorePatterns(rootPath) {
        const ignoreFiles = ['.gitignore', '.actignore', '.npmignore'];
        for (const ignoreFile of ignoreFiles) {
            try {
                const content = await fs.readFile(path.join(rootPath, ignoreFile), 'utf-8');
                const patterns = content
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line && !line.startsWith('#'));
                this.ig.add(patterns);
            }
            catch (error) {
                // 文件不存在，继续
            }
        }
        // 添加默认忽略模式
        this.ig.add([
            'node_modules',
            '.git',
            'dist',
            'build',
            '.cache',
            '.next',
            'coverage',
            '.DS_Store',
            '*.log',
            '.env*',
            '!.env.example',
        ]);
    }
    async detectProjectType(rootPath) {
        const files = await fs.readdir(rootPath);
        // 检查package.json
        if (files.includes('package.json')) {
            try {
                const packageJson = JSON.parse(await fs.readFile(path.join(rootPath, 'package.json'), 'utf-8'));
                if (packageJson.dependencies?.typescript || packageJson.devDependencies?.typescript) {
                    return 'typescript';
                }
                if (packageJson.dependencies?.react || packageJson.devDependencies?.react) {
                    return files.some(f => f.endsWith('.ts') || f.endsWith('.tsx')) ? 'typescript' : 'javascript';
                }
                return files.some(f => f.endsWith('.ts') || f.endsWith('.tsx')) ? 'typescript' : 'javascript';
            }
            catch (error) {
                return 'javascript';
            }
        }
        // 检查Python项目
        if (files.includes('requirements.txt') || files.includes('pyproject.toml') || files.includes('setup.py')) {
            return 'python';
        }
        // 检查Java项目
        if (files.includes('pom.xml') || files.includes('build.gradle') || files.some(f => f.endsWith('.java'))) {
            return 'java';
        }
        // 根据文件扩展名推断
        const allFiles = await this.getProjectFiles(rootPath);
        const extensions = new Set(allFiles.map(f => path.extname(f)));
        if (extensions.has('.py'))
            return 'python';
        if (extensions.has('.java'))
            return 'java';
        if (extensions.has('.ts') || extensions.has('.tsx'))
            return 'typescript';
        if (extensions.has('.js') || extensions.has('.jsx'))
            return 'javascript';
        return 'other';
    }
    async getProjectFiles(rootPath) {
        const patterns = ['**/*.{js,ts,jsx,tsx,py,java,json,md,css,scss,html}'];
        const files = await fast_glob_1.default(patterns, {
            cwd: rootPath,
            ignore: ['node_modules', '.git', 'dist', 'build'],
            onlyFiles: true,
        });
        // 应用忽略规则
        return files.filter((file) => !this.ig.ignores(file));
    }
    async getDependencies(rootPath, projectType) {
        const dependencies = [];
        try {
            switch (projectType) {
                case 'javascript':
                case 'typescript':
                    const packageJson = JSON.parse(await fs.readFile(path.join(rootPath, 'package.json'), 'utf-8'));
                    const deps = [
                        ...Object.keys(packageJson.dependencies || {}),
                        ...Object.keys(packageJson.devDependencies || {}),
                    ];
                    dependencies.push(...deps);
                    break;
                case 'python':
                    // 读取requirements.txt
                    try {
                        const requirements = await fs.readFile(path.join(rootPath, 'requirements.txt'), 'utf-8');
                        const deps = requirements
                            .split('\n')
                            .map(line => line.trim().split('==')[0].split('>=')[0].split('<=')[0])
                            .filter(dep => dep && !dep.startsWith('#'));
                        dependencies.push(...deps);
                    }
                    catch (error) {
                        // requirements.txt不存在，尝试pyproject.toml
                    }
                    break;
                case 'java':
                    // 读取pom.xml或build.gradle
                    try {
                        const pomContent = await fs.readFile(path.join(rootPath, 'pom.xml'), 'utf-8');
                        // 简单的XML解析来提取依赖
                        const dependencyMatches = pomContent.matchAll(/<artifactId>([^<]+)<\/artifactId>/g);
                        for (const match of dependencyMatches) {
                            dependencies.push(match[1]);
                        }
                    }
                    catch (error) {
                        // pom.xml不存在，尝试build.gradle
                    }
                    break;
            }
        }
        catch (error) {
            console.warn('Failed to read dependencies:', error);
        }
        return [...new Set(dependencies)]; // 去重
    }
    async getProjectConfig(rootPath, projectType) {
        const config = {};
        try {
            switch (projectType) {
                case 'javascript':
                case 'typescript':
                    const packageJson = JSON.parse(await fs.readFile(path.join(rootPath, 'package.json'), 'utf-8'));
                    config.package = packageJson;
                    // 读取tsconfig.json
                    try {
                        const tsconfig = JSON.parse(await fs.readFile(path.join(rootPath, 'tsconfig.json'), 'utf-8'));
                        config.tsconfig = tsconfig;
                    }
                    catch (error) {
                        // tsconfig.json不存在
                    }
                    break;
                case 'python':
                    // 读取pyproject.toml或setup.py
                    try {
                        const pyproject = await fs.readFile(path.join(rootPath, 'pyproject.toml'), 'utf-8');
                        config.pyproject = pyproject;
                    }
                    catch (error) {
                        // pyproject.toml不存在
                    }
                    break;
                case 'java':
                    // 读取pom.xml
                    try {
                        const pomXml = await fs.readFile(path.join(rootPath, 'pom.xml'), 'utf-8');
                        config.pom = pomXml;
                    }
                    catch (error) {
                        // pom.xml不存在
                    }
                    break;
            }
        }
        catch (error) {
            console.warn('Failed to read project config:', error);
        }
        return config;
    }
}
exports.ProjectAnalyzer = ProjectAnalyzer;
//# sourceMappingURL=project.js.map