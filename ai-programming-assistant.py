#!/usr/bin/env python3
"""
AI Programming Assistant - 基于Claude Code架构的增强AI编程工具

特性：
- 智能代码理解和索引
- 多模型支持
- 代码生成和修改
- 错误检测和修复
- 代码优化建议
- 文档自动生成
"""

import os
import sys
import json
import time
import asyncio
from typing import Dict, List, Optional, Any, Tuple
from pathlib import Path
import argparse

# 导入我们创建的模块
from enhanced_code_indexer import EnhancedCodeIndexer, CodeSymbol, SearchResult
from multi_model_manager import MultiModelManager, ModelConfig, ModelType, RequestContext, ModelResponse, ModelProvider

class AIProgrammingAssistant:
    """AI编程助手 - 主类"""
    
    def __init__(self, repo_path: str, config_path: Optional[str] = None):
        self.repo_path = Path(repo_path).resolve()
        self.config_path = Path(config_path) if config_path else None
        
        # 核心组件
        self.code_indexer = EnhancedCodeIndexer(str(self.repo_path))
        self.model_manager = MultiModelManager()
        
        # 配置
        self.config = {
            'auto_index': True,
            'default_model': 'gpt-4',
            'enable_caching': True,
            'cache_dir': '.ai_assistant_cache',
            'max_history': 100
        }
        
        # 缓存和历史
        self.cache: Dict[str, Any] = {}
        self.conversation_history: List[Dict[str, Any]] = []
        self.last_index_time = 0
        
        # 加载配置
        if self.config_path and self.config_path.exists():
            self.load_config()
        
        # 初始化模型（需要真实的API key）
        self._initialize_models()
    
    def _initialize_models(self):
        """初始化AI模型（示例配置，需要真实API key）"""
        # 注意：这里需要你提供真实的API key才能使用
        print("警告: 请提供真实的API key来启用AI功能")
        
        # 示例配置（注释掉，需要真实API key才能启用）
        """
        self.model_manager.register_model(ModelConfig(
            name="gpt-4",
            provider=ModelProvider.OPENAI,
            model_type=ModelType.CHAT,
            api_key="your-openai-api-key",
            base_url="https://api.openai.com/v1",
            max_tokens=4096,
            temperature=0.7,
            cost_per_1k_tokens=0.03,
            priority=1,
            supports_streaming=True,
            supports_functions=True
        ))
        
        self.model_manager.register_model(ModelConfig(
            name="claude-3-sonnet",
            provider=ModelProvider.ANTHROPIC,
            model_type=ModelType.CHAT,
            api_key="your-anthropic-api-key",
            base_url="https://api.anthropic.com/v1",
            max_tokens=4096,
            temperature=0.7,
            cost_per_1k_tokens=0.003,
            priority=2,
            supports_streaming=True
        ))
        """
    
    def load_config(self):
        """加载配置"""
        try:
            with open(self.config_path, 'r') as f:
                config_data = json.load(f)
                self.config.update(config_data)
                print(f"配置已加载: {self.config_path}")
        except Exception as e:
            print(f"加载配置失败: {e}")
    
    def save_config(self):
        """保存配置"""
        if self.config_path:
            try:
                with open(self.config_path, 'w') as f:
                    json.dump(self.config, f, indent=2)
                print(f"配置已保存: {self.config_path}")
            except Exception as e:
                print(f"保存配置失败: {e}")
    
    def build_code_index(self, force: bool = False) -> bool:
        """构建代码索引"""
        current_time = time.time()
        
        # 检查是否需要重新构建索引
        if not force and self.last_index_time > 0:
            time_since_last = current_time - self.last_index_time
            if time_since_last < 300:  # 5分钟内不重新构建
                print(f"跳过索引构建（上次构建: {time_since_last:.1f}秒前）")
                return True
        
        print(f"开始构建代码索引: {self.repo_path}")
        print(f"包含文件类型: .py, .js, .ts, .jsx, .tsx")
        
        try:
            stats = self.code_indexer.build_index()
            self.last_index_time = current_time
            
            print("\n索引构建完成!")
            print(f"总文件数: {stats['total_files']}")
            print(f"总符号数: {stats['total_symbols']}")
            print(f"构建时间: {stats['indexing_time']:.2f}秒")
            
            # 导出索引
            cache_file = self.repo_path / self.config['cache_dir'] / 'code_index.json'
            cache_file.parent.mkdir(exist_ok=True)
            self.code_indexer.export_index(str(cache_file))
            
            return True
        
        except Exception as e:
            print(f"索引构建失败: {e}")
            return False
    
    def load_code_index(self) -> bool:
        """加载代码索引"""
        cache_file = self.repo_path / self.config['cache_dir'] / 'code_index.json'
        
        if not cache_file.exists():
            print(f"索引文件不存在: {cache_file}")
            return False
        
        try:
            self.code_indexer.import_index(str(cache_file))
            print(f"索引已加载: {cache_file}")
            return True
        except Exception as e:
            print(f"加载索引失败: {e}")
            return False
    
    async def generate_code(self, prompt: str, context: Optional[str] = None, 
                          output_file: Optional[str] = None) -> Tuple[bool, str]:
        """生成代码"""
        print(f"\n生成代码: {prompt[:50]}...")
        
        # 构建上下文
        full_prompt = f"你是一个专业的程序员。请根据以下要求生成代码：\n\n{prompt}\n\n"
        
        if context:
            full_prompt += f"相关上下文：\n{context}\n\n"
        
        full_prompt += "请只输出代码，不要包含额外的解释。如果必须解释，请在代码注释中说明。"
        
        # 创建请求上下文
        request_context = RequestContext(
            prompt=full_prompt,
            model_type=ModelType.CODE,
            max_tokens=2048,
            temperature=0.3,
            require_code=True
        )
        
        # 生成代码
        response = await self.model_manager.generate_with_fallback(request_context, max_attempts=3)
        
        if response.success:
            code_content = response.content
            
            # 保存到文件（如果指定）
            if output_file:
                output_path = self.repo_path / output_file
                output_path.parent.mkdir(parents=True, exist_ok=True)
                
                with open(output_path, 'w') as f:
                    f.write(code_content)
                
                print(f"代码已保存: {output_path}")
                print(f"生成统计: {response.tokens_used} tokens, ${response.cost:.4f}")
            
            # 添加到历史
            self.conversation_history.append({
                'type': 'generate',
                'prompt': prompt,
                'response': code_content,
                'timestamp': time.time()
            })
            
            # 限制历史记录
            if len(self.conversation_history) > self.config['max_history']:
                self.conversation_history.pop(0)
            
            return True, code_content
        else:
            print(f"代码生成失败: {response.error}")
            return False, response.error
    
    async def explain_code(self, file_path: str, line_start: Optional[int] = None, 
                         line_end: Optional[int] = None) -> Tuple[bool, str]:
        """解释代码"""
        print(f"\n解释代码: {file_path}")
        
        # 检查文件是否存在
        file_full_path = self.repo_path / file_path
        if not file_full_path.exists():
            print(f"文件不存在: {file_full_path}")
            return False, "文件不存在"
        
        # 读取代码
        with open(file_full_path, 'r') as f:
            lines = f.readlines()
        
        if line_start is not None and line_end is not None:
            code_lines = lines[line_start-1:line_end]
            code_section = f"第{line_start}-{line_end}行:\n" + "".join(code_lines)
        else:
            code_section = "完整文件:\n" + "".join(lines)
        
        # 构建提示
        prompt = f"请详细解释以下代码的功能和实现逻辑：\n\n{code_section}\n\n"
        prompt += "请解释：1) 代码的主要功能；2) 关键算法和逻辑；3) 重要的设计决策；4) 可能的问题或改进建议。"
        
        request_context = RequestContext(
            prompt=prompt,
            model_type=ModelType.TEXT,
            max_tokens=1024,
            temperature=0.5
        )
        
        response = await self.model_manager.generate_with_fallback(request_context, max_attempts=2)
        
        if response.success:
            explanation = response.content
            
            # 添加到历史
            self.conversation_history.append({
                'type': 'explain',
                'file': file_path,
                'response': explanation,
                'timestamp': time.time()
            })
            
            return True, explanation
        else:
            print(f"代码解释失败: {response.error}")
            return False, response.error
    
    async def refactor_code(self, file_path: str, refactor_type: str, 
                          description: str) -> Tuple[bool, str]:
        """重构代码"""
        print(f"\n重构代码: {file_path} ({refactor_type})")
        
        # 读取原始代码
        file_full_path = self.repo_path / file_path
        if not file_full_path.exists():
            print(f"文件不存在: {file_full_path}")
            return False, "文件不存在"
        
        with open(file_full_path, 'r') as f:
            original_code = f.read()
        
        # 构建重构提示
        prompt = f"请对以下代码进行{refactor_type}重构：\n\n原始代码：\n{original_code}\n\n"
        prompt += f"重构要求：{description}\n\n"
        prompt += "请提供：1) 重构后的代码；2) 重构的主要变化；3) 重构的好处；4) 可能的注意事项。"
        
        request_context = RequestContext(
            prompt=prompt,
            model_type=ModelType.CODE,
            max_tokens=2048,
            temperature=0.4
        )
        
        response = await self.model_manager.generate_with_fallback(request_context, max_attempts=3)
        
        if response.success:
            refactored = response.content
            
            # 添加到历史
            self.conversation_history.append({
                'type': 'refactor',
                'file': file_path,
                'refactor_type': refactor_type,
                'response': refactored,
                'timestamp': time.time()
            })
            
            return True, refactored
        else:
            print(f"代码重构失败: {response.error}")
            return False, response.error
    
    def search_code(self, query: str, max_results: int = 10) -> List[SearchResult]:
        """搜索代码"""
        print(f"\n搜索代码: '{query}'")
        
        results = self.code_indexer.search_symbols(query, max_results=max_results)
        
        if results:
            print(f"找到 {len(results)} 个结果:")
            for i, result in enumerate(results, 1):
                file_rel = os.path.relpath(result.symbol.file_path, self.repo_path)
                print(f"{i}. {result.symbol.name} ({result.symbol.type}) - {file_rel}:{result.symbol.line} "
                      f"(分数: {result.score:.2f})")
        else:
            print("未找到匹配结果")
        
        return results
    
    def find_usages(self, symbol_name: str) -> List[str]:
        """查找符号使用位置"""
        print(f"\n查找符号使用: {symbol_name}")
        
        # 先搜索符号
        results = self.code_indexer.search_symbols(symbol_name, max_results=5)
        
        if not results:
            print(f"未找到符号: {symbol_name}")
            return []
        
        # 查找使用位置
        usages = []
        for result in results:
            symbol_id = f"{result.symbol.file_path}:{result.symbol.name}:{result.symbol.type}"
            symbol_usages = self.code_indexer.find_usages(symbol_id)
            usages.extend(symbol_usages)
        
        if usages:
            print(f"找到 {len(usages)} 个使用位置:")
            for usage in usages[:10]:  # 显示前10个
                file_rel = os.path.relpath(usage.split(':')[0], self.repo_path)
                line = usage.split(':')[1] if ':' in usage else '?'
                print(f"  - {file_rel}:{line}")
        else:
            print("未找到使用位置")
        
        return usages
    
    async def generate_documentation(self, file_path: str) -> Tuple[bool, str]:
        """生成文档"""
        print(f"\n生成文档: {file_path}")
        
        # 读取代码
        file_full_path = self.repo_path / file_path
        if not file_full_path.exists():
            print(f"文件不存在: {file_full_path}")
            return False, "文件不存在"
        
        with open(file_full_path, 'r') as f:
            code_content = f.read()
        
        # 获取符号信息
        symbols = self.code_indexer.search_symbols('', max_results=50)
        file_symbols = [s for s in symbols if s.symbol.file_path == str(file_full_path)]
        
        # 构建提示
        prompt = f"请为以下代码生成详细的文档：\n\n代码：\n{code_content}\n\n"
        
        if file_symbols:
            prompt += "代码中包含以下符号：\n"
            for symbol in file_symbols:
                prompt += f"- {symbol.symbol.type}: {symbol.symbol.name} (第{symbol.symbol.line}行)\n"
            prompt += "\n"
        
        prompt += "请生成：1) 模块概述；2) 主要类和函数说明；3) 使用方法示例；4) 参数说明；5) 注意事项。"
        
        request_context = RequestContext(
            prompt=prompt,
            model_type=ModelType.TEXT,
            max_tokens=1500,
            temperature=0.5
        )
        
        response = await self.model_manager.generate_with_fallback(request_context, max_attempts=2)
        
        if response.success:
            documentation = response.content
            
            # 添加到历史
            self.conversation_history.append({
                'type': 'documentation',
                'file': file_path,
                'response': documentation,
                'timestamp': time.time()
            })
            
            return True, documentation
        else:
            print(f"文档生成失败: {response.error}")
            return False, response.error
    
    async def detect_bugs(self, file_path: str) -> Tuple[bool, str]:
        """检测代码中的错误"""
        print(f"\n检测代码错误: {file_path}")
        
        # 读取代码
        file_full_path = self.repo_path / file_path
        if not file_full_path.exists():
            print(f"文件不存在: {file_full_path}")
            return False, "文件不存在"
        
        with open(file_full_path, 'r') as f:
            code_content = f.read()
        
        # 构建提示
        prompt = f"请仔细分析以下代码，检测潜在的问题和错误：\n\n代码：\n{code_content}\n\n"
        prompt += "请检查：1) 语法错误；2) 逻辑错误；3) 潜在的空指针异常；4) 性能问题；5) 安全漏洞；6) 代码风格问题。"
        prompt += "对于每个问题，请提供：问题描述、问题位置、严重程度、修复建议。"
        
        request_context = RequestContext(
            prompt=prompt,
            model_type=ModelType.TEXT,
            max_tokens=1500,
            temperature=0.6
        )
        
        response = await self.model_manager.generate_with_fallback(request_context, max_attempts=2)
        
        if response.success:
            bug_report = response.content
            
            # 添加到历史
            self.conversation_history.append({
                'type': 'bug_detection',
                'file': file_path,
                'response': bug_report,
                'timestamp': time.time()
            })
            
            return True, bug_report
        else:
            print(f"错误检测失败: {response.error}")
            return False, response.error
    
    async def optimize_code(self, file_path: str) -> Tuple[bool, str]:
        """优化代码"""
        print(f"\n优化代码: {file_path}")
        
        # 读取代码
        file_full_path = self.repo_path / file_path
        if not file_full_path.exists():
            print(f"文件不存在: {file_full_path}")
            return False, "文件不存在"
        
        with open(file_full_path, 'r') as f:
            code_content = f.read()
        
        # 构建提示
        prompt = f"请对以下代码进行性能优化：\n\n代码：\n{code_content}\n\n"
        prompt += "请提供：1) 优化后的代码；2) 主要的优化点；3) 性能提升预估；4) 优化前后的对比；5) 注意事项。"
        
        request_context = RequestContext(
            prompt=prompt,
            model_type=ModelType.CODE,
            max_tokens=2048,
            temperature=0.4
        )
        
        response = await self.model_manager.generate_with_fallback(request_context, max_attempts=3)
        
        if response.success:
            optimized = response.content
            
            # 添加到历史
            self.conversation_history.append({
                'type': 'optimize',
                'file': file_path,
                'response': optimized,
                'timestamp': time.time()
            })
            
            return True, optimized
        else:
            print(f"代码优化失败: {response.error}")
            return False, response.error
    
    def show_stats(self):
        """显示统计信息"""
        print("\n" + "="*80)
        print("AI编程助手统计")
        print("="*80)
        
        # 代码索引统计
        if self.last_index_time > 0:
            print(f"\n代码索引:")
            print(f"  仓库路径: {self.repo_path}")
            print(f"  最后索引: {time.time() - self.last_index_time:.1f}秒前")
            print(f"  索引文件: {self.code_indexer.index_stats['total_files']}")
            print(f"  索引符号: {self.code_indexer.index_stats['total_symbols']}")
        else:
            print("\n代码索引: 未构建")
        
        # 模型统计
        model_stats = self.model_manager.get_model_stats()
        if model_stats:
            print(f"\n模型状态:")
            for name, stats in model_stats.items():
                print(f"  {name}: {stats['success_rate']:.1%} 成功率, "
                      f"{stats['average_latency']:.2f}s 平均延迟")
        else:
            print("\n模型状态: 未配置")
        
        # 历史统计
        print(f"\n对话历史:")
        print(f"  总记录数: {len(self.conversation_history)}")
        
        type_counts = {}
        for record in self.conversation_history:
            record_type = record['type']
            type_counts[record_type] = type_counts.get(record_type, 0) + 1
        
        for record_type, count in type_counts.items():
            print(f"  {record_type}: {count} 次")
        
        print("="*80)


async def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="AI Programming Assistant")
    parser.add_argument("repo_path", help="仓库路径")
    parser.add_argument("--config", help="配置文件路径", default=None)
    parser.add_argument("--no-index", action="store_true", help="跳过索引构建")
    parser.add_argument("--load-index", action="store_true", help="从缓存加载索引")
    
    args = parser.parse_args()
    
    # 创建AI编程助手
    assistant = AIProgrammingAssistant(args.repo_path, args.config)
    
    print("="*80)
    print("AI编程助手已启动")
    print("="*80)
    print(f"仓库: {assistant.repo_path}")
    
    # 构建或加载索引
    if args.load_index:
        success = assistant.load_code_index()
        if not success:
            print("从缓存加载索引失败，将重新构建...")
            assistant.build_code_index()
    elif not args.no_index:
        assistant.build_code_index()
    
    # 显示统计
    assistant.show_stats()
    
    print("\n" + "="*80)
    print("可用命令:")
    print("="*80)
    print("1. 生成代码: generate <描述> [输出文件]")
    print("2. 解释代码: explain <文件> [起始行] [结束行]")
    print("3. 重构代码: refactor <文件> <类型> <描述>")
    print("4. 搜索代码: search <关键词>")
    print("5. 查找使用: usage <符号名>")
    print("6. 生成文档: doc <文件>")
    print("7. 检测错误: bugs <文件>")
    print("8. 优化代码: optimize <文件>")
    print("9. 重新索引: index")
    print("10. 显示统计: stats")
    print("11. 退出: exit")
    print("="*80)
    
    # 交互式命令行
    while True:
        try:
            user_input = input("\nai-assistant> ").strip()
            
            if not user_input:
                continue
            
            if user_input.lower() == 'exit':
                break
            
            # 解析命令
            parts = user_input.split()
            command = parts[0].lower()
            
            if command == 'generate' and len(parts) >= 2:
                # 提取描述和输出文件
                if len(parts) >= 3 and not parts[2].startswith('-'):
                    description = ' '.join(parts[1:-1])
                    output_file = parts[-1]
                else:
                    description = ' '.join(parts[1:])
                    output_file = None
                
                success, result = await assistant.generate_code(description, output_file=output_file)
                if success:
                    print(f"\n✓ 代码生成成功")
                    if not output_file:
                        print(result)
                else:
                    print(f"\n✗ 代码生成失败: {result}")
            
            elif command == 'explain' and len(parts) >= 2:
                file_path = parts[1]
                line_start = int(parts[2]) if len(parts) >= 3 else None
                line_end = int(parts[3]) if len(parts) >= 4 else None
                
                success, result = await assistant.explain_code(file_path, line_start, line_end)
                if success:
                    print(f"\n✓ 代码解释完成")
                    print(result)
                else:
                    print(f"\n✗ 代码解释失败: {result}")
            
            elif command == 'refactor' and len(parts) >= 4:
                file_path = parts[1]
                refactor_type = parts[2]
                description = ' '.join(parts[3:])
                
                success, result = await assistant.refactor_code(file_path, refactor_type, description)
                if success:
                    print(f"\n✓ 代码重构完成")
                    print(result)
                else:
                    print(f"\n✗ 代码重构失败: {result}")
            
            elif command == 'search' and len(parts) >= 2:
                query = ' '.join(parts[1:])
                assistant.search_code(query)
            
            elif command == 'usage' and len(parts) >= 2:
                symbol_name = parts[1]
                assistant.find_usages(symbol_name)
            
            elif command == 'doc' and len(parts) >= 2:
                file_path = parts[1]
                success, result = await assistant.generate_documentation(file_path)
                if success:
                    print(f"\n✓ 文档生成完成")
                    print(result)
                else:
                    print(f"\n✗ 文档生成失败: {result}")
            
            elif command == 'bugs' and len(parts) >= 2:
                file_path = parts[1]
                success, result = await assistant.detect_bugs(file_path)
                if success:
                    print(f"\n✓ 错误检测完成")
                    print(result)
                else:
                    print(f"\n✗ 错误检测失败: {result}")
            
            elif command == 'optimize' and len(parts) >= 2:
                file_path = parts[1]
                success, result = await assistant.optimize_code(file_path)
                if success:
                    print(f"\n✓ 代码优化完成")
                    print(result)
                else:
                    print(f"\n✗ 代码优化失败: {result}")
            
            elif command == 'index':
                assistant.build_code_index(force=True)
            
            elif command == 'stats':
                assistant.show_stats()
            
            else:
                print(f"\n未知命令或参数不足: {command}")
                print("使用 help 查看可用命令")
        
        except KeyboardInterrupt:
            print("\n使用 'exit' 退出")
        except Exception as e:
            print(f"\n错误: {e}")


if __name__ == '__main__':
    asyncio.run(main())