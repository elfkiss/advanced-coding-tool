# 🚀 Advanced Coding Tool (ClaudeCraft) 快速开始指南

## 🎯 项目简介

Advanced Coding Tool (简称 ACT) 是一个基于AI的编程助手，专为现代开发者设计。它提供了智能代码生成、代码审查、调试辅助等功能，能够显著提高开发效率。

## 📦 安装

### 前提条件
- Node.js >= 18.0.0
- npm >= 8.0.0

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/elfkiss/advanced-coding-tool.git
cd advanced-coding-tool
```

2. **安装依赖**
```bash
cd vscode-advanced-coding-tool.PAUSED/node_modules/advanced-coding-tool
npm install
```

3. **配置环境变量**
```bash
# 设置Anthropic API密钥（必需）
export ANTHROPIC_API_KEY="your-api-key-here"

# 可选：设置其他配置
export ACT_LOG_LEVEL="info"
export ACT_CONFIG_PATH="~/.act/config.json"
```

## 🚀 快速开始

### 基本用法

```bash
# 显示帮助信息
node dist/cli/index.js --help

# 显示版本信息
node dist/cli/index.js --version
```

### 核心命令

#### 1. 初始化项目
```bash
# 初始化新项目配置
node dist/cli/index.js init

# 使用自定义配置
node dist/cli/index.js init --config my-config.json
```

#### 2. 代码生成
```bash
# 生成代码
node dist/cli/index.js generate myfile.js

# 生成代码并指定类型
node dist/cli/index.js generate --type function myfile.js

# 生成测试用例
node dist/cli/index.js generate --type test myfile.js
```

#### 3. 代码审查
```bash
# 审查单个文件
node dist/cli/index.js review myfile.js

# 审查整个项目
node dist/cli/index.js review .

# 生成详细报告
node dist/cli/index.js review --format html myfile.js
```

#### 4. 调试辅助
```bash
# 分析错误
node dist/cli/index.js debug error.log

# 性能分析
node dist/cli/index.js debug --type performance myfile.js

# 内存分析
node dist/cli/index.js debug --type memory myfile.js
```

#### 5. 项目分析
```bash
# 分析当前项目
node dist/cli/index.js analyze

# 生成详细报告
node dist/cli/index.js analyze --format json

# 分析特定目录
node dist/cli/index.js analyze src/
```

#### 6. 配置管理
```bash
# 显示当前配置
node dist/cli/index.js config --show

# 更新配置项
node dist/cli/index.js config --update "aiProvider=claude"

# 重置配置
node dist/cli/index.js config --reset
```

## 🔧 配置说明

### 环境变量

| 变量名 | 描述 | 默认值 | 是否必需 |
|--------|------|--------|----------|
| `ANTHROPIC_API_KEY` | Anthropic API密钥 | 无 | ✅ 必需 |
| `ACT_LOG_LEVEL` | 日志级别 | info | ❌ 可选 |
| `ACT_CONFIG_PATH` | 配置文件路径 | ~/.act/config.json | ❌ 可选 |

### 配置文件

创建 `~/.act/config.json`：

```json
{
  "aiProvider": "claude",
  "apiKey": "your-api-key",
  "logLevel": "info",
  "maxFileSize": 1048576,
  "enableRealTimeAnalysis": true,
  "webUiPort": 3000
}
```

## 📊 输出格式

ACT支持多种输出格式：

### 文本格式 (默认)
```bash
node dist/cli/index.js analyze
```

### JSON格式
```bash
node dist/cli/index.js analyze --format json
```

### HTML格式
```bash
node dist/cli/index.js analyze --format html
```

### Markdown格式
```bash
node dist/cli/index.js analyze --format markdown
```

## 🎯 使用示例

### 示例1: 分析项目代码质量

```bash
# 分析当前目录
node dist/cli/index.js analyze

# 输出结果示例：
# [Engine] INFO: Initializing Advanced Coding Engine...
# [Engine] INFO: Configuration loaded
# [Analyzer] INFO: Analyzing project structure...
# [Analyzer] INFO: Found 15 files to analyze
# [Analyzer] INFO: Code analysis complete
# ✅ 项目分析完成
# 📊 代码质量评分: 85/100
# 🐛 发现问题: 3个
# 💡 优化建议: 5个
```

### 示例2: 生成代码

```bash
# 生成一个函数
node dist/cli/index.js generate --type function myfunction.js

# AI会基于上下文生成合适的代码
# 输出示例：
# [Engine] INFO: Initializing Advanced Coding Engine...
# [AI] INFO: Generating code for myfunction.js
# [AI] INFO: Code generation complete
# ✅ 代码生成成功
# 📝 生成文件: myfunction.js
# 📊 代码行数: 25行
```

### 示例3: 代码审查

```bash
# 审查特定文件
node dist/cli/index.js review src/index.js

# 输出示例：
# [Engine] INFO: Initializing Advanced Coding Engine...
# [Reviewer] INFO: Starting code review...
# [Reviewer] INFO: Checking code quality...
# [Reviewer] INFO: Review complete
# ✅ 代码审查完成
# 📊 质量评分: 92/100
# ⚠️  发现问题: 2个
# 💡 改进建议:
#   - 添加错误处理
#   - 优化变量命名
```

## 🐛 常见问题

### Q: 如何获取Anthropic API密钥？

A: 访问 [Anthropic Console](https://console.anthropic.com/) 创建账户并获取API密钥。

### Q: CLI工具报错 "ANTHROPIC_API_KEY environment variable is required"？

A: 需要设置环境变量：
```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

### Q: 如何更新配置？

A: 使用config命令：
```bash
node dist/cli/index.js config --update "aiProvider=claude"
```

### Q: 如何查看详细帮助？

A: 使用help命令：
```bash
node dist/cli/index.js --help
node dist/cli/index.js analyze --help
```

## 📈 性能优化

### 大型项目分析

对于大型项目，可以使用以下选项提高性能：

```bash
# 限制分析文件数量
node dist/cli/index.js analyze --max-files 100

# 忽略特定目录
node dist/cli/index.js analyze --ignore "node_modules,dist"

# 并行处理
node dist/cli/index.js analyze --parallel 4
```

### 缓存配置

```bash
# 启用缓存
node dist/cli/index.js analyze --cache

# 清除缓存
node dist/cli/index.js config --clear-cache
```

## 🔒 安全建议

1. **保护API密钥**
   - 不要将API密钥提交到版本控制
   - 使用环境变量或配置文件
   - 定期轮换API密钥

2. **文件权限**
   - 确保配置文件权限正确
   - 避免在公共目录存储敏感信息

3. **网络安全**
   - 仅在可信网络中使用
   - 监控API使用情况

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 创建Pull Request

## 📄 许可证

MIT License - 详见 LICENSE 文件

## 📞 支持

- **GitHub Issues**: https://github.com/elfkiss/advanced-coding-tool/issues
- **文档**: https://github.com/elfkiss/advanced-coding-tool#readme
- **项目状态**: 实时更新在项目README中

---

**🎉 恭喜！您已成功安装Advanced Coding Tool。开始您的AI编程之旅吧！**

**提示**: 运行 `node dist/cli/index.js --help` 查看所有可用命令。