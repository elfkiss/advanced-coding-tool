#!/usr/bin/env python3
"""
Enhanced Code Indexer - 基于Claude Code索引系统的增强实现

特性：
- 快速代码解析和索引
- 语义化搜索能力
- 代码关系分析
- 实时更新机制
- 多语言支持
"""

import os
import re
import json
import time
import hashlib
from typing import Dict, List, Optional, Set, Tuple, Any
from dataclasses import dataclass, field
from pathlib import Path
import ast
import builtins

@dataclass
class CodeSymbol:
    """代码符号表示"""
    name: str
    type: str  # function, class, method, variable, import, etc.
    file_path: str
    line: int
    column: int
    scope: str
    parent: Optional[str] = None
    docstring: Optional[str] = None
    signature: Optional[str] = None
    references: List[str] = field(default_factory=list)
    usages: List[str] = field(default_factory=list)

@dataclass
class CodeFile:
    """代码文件表示"""
    path: str
    content: str
    hash: str
    symbols: List[CodeSymbol] = field(default_factory=list)
    imports: List[str] = field(default_factory=list)
    dependencies: List[str] = field(default_factory=list)
    last_modified: float = 0

@dataclass
class SearchResult:
    """搜索结果"""
    symbol: CodeSymbol
    score: float
    context: str
    match_type: str  # exact, fuzzy, semantic

class EnhancedCodeIndexer:
    """增强版代码索引器"""
    
    def __init__(self, repo_path: str, exclude_patterns: List[str] = None):
        self.repo_path = Path(repo_path).resolve()
        self.exclude_patterns = exclude_patterns or [
            r'.git', r'__pycache__', r'\.pyc', r'\.pyo',
            r'node_modules', r'\.pytest_cache', r'venv',
            r'\.vscode', r'\.idea', r'\.DS_Store'
        ]
        
        self.files: Dict[str, CodeFile] = {}
        self.symbols: Dict[str, CodeSymbol] = {}
        self.symbol_index: Dict[str, Set[str]] = {}
        self.file_index: Dict[str, Set[str]] = {}
        self.dependency_graph: Dict[str, Set[str]] = {}
        
        # 文件监控
        self.file_hashes: Dict[str, str] = {}
        self.index_stats = {
            'total_files': 0,
            'total_symbols': 0,
            'indexing_time': 0,
            'last_update': 0
        }
    
    def _should_exclude(self, path: str) -> bool:
        """检查是否应该排除该路径"""
        for pattern in self.exclude_patterns:
            if re.search(pattern, path):
                return True
        return False
    
    def _calculate_file_hash(self, content: str) -> str:
        """计算文件内容的哈希值"""
        return hashlib.md5(content.encode('utf-8')).hexdigest()
    
    def _get_all_files(self) -> List[str]:
        """获取仓库中所有需要索引的文件"""
        files = []
        for root, dirs, filenames in os.walk(self.repo_path):
            # 排除不需要的目录
            dirs[:] = [d for d in dirs if not self._should_exclude(os.path.join(root, d))]
            
            for filename in filenames:
                file_path = os.path.join(root, filename)
                if not self._should_exclude(file_path) and filename.endswith(('.py', '.js', '.ts', '.jsx', '.tsx')):
                    files.append(file_path)
        return files
    
    def _extract_python_symbols(self, content: str, file_path: str) -> List[CodeSymbol]:
        """提取Python代码中的符号"""
        symbols = []
        try:
            tree = ast.parse(content)
            
            for node in ast.walk(tree):
                # 函数定义
                if isinstance(node, ast.FunctionDef):
                    symbol = CodeSymbol(
                        name=node.name,
                        type='function',
                        file_path=file_path,
                        line=node.lineno,
                        column=node.col_offset,
                        scope=self._get_scope(node),
                        docstring=ast.get_docstring(node)
                    )
                    symbols.append(symbol)
                
                # 类定义
                elif isinstance(node, ast.ClassDef):
                    symbol = CodeSymbol(
                        name=node.name,
                        type='class',
                        file_path=file_path,
                        line=node.lineno,
                        column=node.col_offset,
                        scope=self._get_scope(node),
                        docstring=ast.get_docstring(node)
                    )
                    symbols.append(symbol)
                    
                    # 类方法
                    for item in node.body:
                        if isinstance(item, ast.FunctionDef):
                            method_symbol = CodeSymbol(
                                name=item.name,
                                type='method',
                                file_path=file_path,
                                line=item.lineno,
                                column=item.col_offset,
                                scope=f"{node.name}.{self._get_scope(item)}",
                                parent=node.name,
                                docstring=ast.get_docstring(item)
                            )
                            symbols.append(method_symbol)
                
                # 变量定义
                elif isinstance(node, ast.Assign):
                    for target in node.targets:
                        if isinstance(target, ast.Name):
                            symbol = CodeSymbol(
                                name=target.id,
                                type='variable',
                                file_path=file_path,
                                line=node.lineno,
                                column=node.col_offset,
                                scope=self._get_scope(node)
                            )
                            symbols.append(symbol)
        
        except SyntaxError as e:
            print(f"语法错误 {file_path}: {e}")
        
        return symbols
    
    def _get_scope(self, node) -> str:
        """获取节点的作用域"""
        scope = []
        parent = getattr(node, 'parent', None)
        while parent:
            if hasattr(parent, 'name'):
                scope.insert(0, parent.name)
            parent = getattr(parent, 'parent', None)
        return '.'.join(scope) if scope else 'global'
    
    def _extract_imports(self, content: str, file_path: str) -> List[str]:
        """提取导入语句"""
        imports = []
        try:
            tree = ast.parse(content)
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.append(alias.name)
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        imports.append(node.module)
        except SyntaxError:
            pass
        return imports
    
    def _extract_dependencies(self, file_path: str, imports: List[str]) -> List[str]:
        """提取文件依赖"""
        dependencies = []
        file_dir = os.path.dirname(file_path)
        
        for import_name in imports:
            # 尝试解析导入路径
            parts = import_name.split('.')
            for i in range(len(parts), 0, -1):
                module_path = os.path.join(file_dir, *parts[:i])
                
                # 检查.py文件
                py_file = f"{module_path}.py"
                if os.path.exists(py_file) and py_file in self.files:
                    dependencies.append(py_file)
                    break
                
                # 检查__init__.py
                init_file = os.path.join(module_path, '__init__.py')
                if os.path.exists(init_file) and init_file in self.files:
                    dependencies.append(init_file)
                    break
        
        return dependencies
    
    def _index_file_symbols(self, file_path: str, symbols: List[CodeSymbol]):
        """索引文件中的符号"""
        for symbol in symbols:
            # 添加到符号表
            symbol_id = f"{file_path}:{symbol.name}:{symbol.type}"
            self.symbols[symbol_id] = symbol
            
            # 添加到符号索引
            if symbol.name not in self.symbol_index:
                self.symbol_index[symbol_name] = set()
            self.symbol_index[symbol.name].add(symbol_id)
            
            # 添加到文件索引
            if file_path not in self.file_index:
                self.file_index[file_path] = set()
            self.file_index[file_path].add(symbol_id)
    
    def build_index(self) -> Dict[str, Any]:
        """构建完整的代码索引"""
        start_time = time.time()
        
        files_to_index = self._get_all_files()
        self.index_stats['total_files'] = len(files_to_index)
        
        print(f"开始索引 {len(files_to_index)} 个文件...")
        
        for i, file_path in enumerate(files_to_index, 1):
            if i % 10 == 0:
                print(f"进度: {i}/{len(files_to_index)}")
            
            try:
                # 读取文件内容
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 计算文件哈希
                file_hash = self._calculate_file_hash(content)
                
                # 创建文件对象
                code_file = CodeFile(
                    path=file_path,
                    content=content,
                    hash=file_hash,
                    last_modified=os.path.getmtime(file_path)
                )
                
                # 提取符号
                if file_path.endswith('.py'):
                    symbols = self._extract_python_symbols(content, file_path)
                    code_file.symbols = symbols
                    
                    # 提取导入和依赖
                    imports = self._extract_imports(content, file_path)
                    code_file.imports = imports
                    code_file.dependencies = self._extract_dependencies(file_path, imports)
                
                # 保存文件信息
                self.files[file_path] = code_file
                self._index_file_symbols(file_path, symbols)
                
            except Exception as e:
                print(f"索引文件失败 {file_path}: {e}")
        
        # 构建依赖图
        self._build_dependency_graph()
        
        # 更新统计信息
        self.index_stats['total_symbols'] = len(self.symbols)
        self.index_stats['indexing_time'] = time.time() - start_time
        self.index_stats['last_update'] = time.time()
        
        print(f"索引完成! 共索引 {len(self.symbols)} 个符号")
        return self.index_stats
    
    def _build_dependency_graph(self):
        """构建依赖关系图"""
        for file_path, code_file in self.files.items():
            self.dependency_graph[file_path] = set(code_file.dependencies)
    
    def search_symbols(self, query: str, max_results: int = 20) -> List[SearchResult]:
        """搜索符号"""
        results = []
        query_lower = query.lower()
        
        # 精确匹配
        for symbol_id, symbol in self.symbols.items():
            if query_lower in symbol.name.lower():
                score = 1.0 if symbol.name.lower() == query_lower else 0.8
                results.append(SearchResult(
                    symbol=symbol,
                    score=score,
                    context=self._get_symbol_context(symbol),
                    match_type='exact'
                ))
        
        # 模糊匹配
        if len(results) < max_results:
            for symbol_id, symbol in self.symbols.items():
                if query_lower in symbol.name.lower() or self._fuzzy_match(query, symbol.name):
                    if not any(r.symbol.symbol_id == symbol_id for r in results):
                        results.append(SearchResult(
                            symbol=symbol,
                            score=self._calculate_fuzzy_score(query, symbol.name),
                            context=self._get_symbol_context(symbol),
                            match_type='fuzzy'
                        ))
        
        # 按分数排序
        results.sort(key=lambda x: x.score, reverse=True)
        return results[:max_results]
    
    def _fuzzy_match(self, query: str, target: str) -> bool:
        """模糊匹配"""
        query_lower = query.lower()
        target_lower = target.lower()
        
        # 子字符串匹配
        if query_lower in target_lower:
            return True
        
        # 字符顺序匹配（忽略大小写）
        it = iter(target_lower)
        return all(c in it for c in query_lower)
    
    def _calculate_fuzzy_score(self, query: str, target: str) -> float:
        """计算模糊匹配分数"""
        query_lower = query.lower()
        target_lower = target.lower()
        
        if query_lower == target_lower:
            return 1.0
        elif query_lower in target_lower:
            return 0.7
        else:
            # 计算字符匹配度
            matched = sum(1 for c in query_lower if c in target_lower)
            return matched / len(query_lower) * 0.5
    
    def _get_symbol_context(self, symbol: CodeSymbol) -> str:
        """获取符号的上下文信息"""
        file_path = os.path.relpath(symbol.file_path, self.repo_path)
        context = f"文件: {file_path}\n"
        context += f"类型: {symbol.type}\n"
        context += f"位置: 第{symbol.line}行\n"
        
        if symbol.scope:
            context += f"作用域: {symbol.scope}\n"
        
        if symbol.parent:
            context += f"父类: {symbol.parent}\n"
        
        if symbol.docstring:
            doc_preview = symbol.docstring[:100] + "..." if len(symbol.docstring) > 100 else symbol.docstring
            context += f"文档: {doc_preview}\n"
        
        return context
    
    def find_usages(self, symbol_id: str) -> List[str]:
        """查找符号的使用位置"""
        if symbol_id not in self.symbols:
            return []
        
        symbol = self.symbols[symbol_id]
        usages = []
        
        # 在当前文件中查找引用
        file_path = symbol.file_path
        if file_path in self.files:
            content = self.files[file_path].content
            pattern = re.compile(r'\b' + re.escape(symbol.name) + r'\b')
            matches = pattern.finditer(content)
            
            for match in matches:
                line_num = content[:match.start()].count('\n') + 1
                if line_num != symbol.line:  # 排除定义位置
                    usages.append(f"{file_path}:{line_num}")
        
        # 在依赖文件中查找
        for dep_file in self.dependency_graph.get(file_path, []):
            if dep_file in self.files:
                content = self.files[dep_file].content
                if symbol.name in content:
                    usages.append(f"{dep_file}:?")
        
        return usages
    
    def get_file_info(self, file_path: str) -> Optional[CodeFile]:
        """获取文件信息"""
        return self.files.get(file_path)
    
    def get_symbol_info(self, symbol_id: str) -> Optional[CodeSymbol]:
        """获取符号信息"""
        return self.symbols.get(symbol_id)
    
    def watch_for_changes(self, callback=None):
        """监控文件变化"""
        while True:
            changed_files = []
            
            for file_path in self.files:
                if not os.path.exists(file_path):
                    continue
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    current_hash = self._calculate_file_hash(content)
                    if current_hash != self.files[file_path].hash:
                        changed_files.append(file_path)
                except:
                    continue
            
            if changed_files and callback:
                callback(changed_files)
            
            time.sleep(2)  # 每2秒检查一次
    
    def export_index(self, output_path: str):
        """导出索引数据"""
        export_data = {
            'stats': self.index_stats,
            'files': {path: {
                'hash': file.hash,
                'symbols': len(file.symbols),
                'imports': file.imports,
                'dependencies': file.dependencies
            } for path, file in self.files.items()},
            'symbols': {sid: {
                'name': sym.name,
                'type': sym.type,
                'file': sym.file_path,
                'line': sym.line,
                'scope': sym.scope
            } for sid, sym in self.symbols.items()},
            'dependencies': {k: list(v) for k, v in self.dependency_graph.items()}
        }
        
        with open(output_path, 'w') as f:
            json.dump(export_data, f, indent=2)
    
    def import_index(self, input_path: str):
        """导入索引数据"""
        with open(input_path, 'r') as f:
            data = json.load(f)
        
        self.index_stats = data['stats']
        # 注意：这里简化了导入，实际应该重建完整的对象结构


def main():
    """主函数"""
    import sys
    
    if len(sys.argv) < 2:
        print("用法: python enhanced_code_indexer.py <仓库路径> [输出文件]")
        sys.exit(1)
    
    repo_path = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else 'code_index.json'
    
    print(f"开始索引仓库: {repo_path}")
    
    indexer = EnhancedCodeIndexer(repo_path)
    stats = indexer.build_index()
    
    print("\n索引统计:")
    print(f"总文件数: {stats['total_files']}")
    print(f"总符号数: {stats['total_symbols']}")
    print(f"索引时间: {stats['indexing_time']:.2f}秒")
    
    # 导出索引
    indexer.export_index(output_file)
    print(f"\n索引已导出到: {output_file}")
    
    # 测试搜索
    print("\n测试搜索:")
    results = indexer.search_symbols('main')
    for result in results[:5]:
        print(f"- {result.symbol.name} ({result.match_type}, 分数: {result.score:.2f})")


if __name__ == '__main__':
    main()