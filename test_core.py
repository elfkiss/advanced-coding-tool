#!/usr/bin/env python3
"""
测试Python模块核心功能
"""

import sys
import os

# 临时修改Python脚本来测试核心类
def test_enhanced_code_indexer():
    """测试代码索引器核心功能"""
    print("🔍 测试代码索引器...")
    
    # 读取并修改脚本以移除main检查
    with open('enhanced-code-indexer.py', 'r') as f:
        content = f.read()
    
    # 移除 if __name__ == '__main__' 部分
    lines = content.split('\n')
    filtered_lines = []
    in_main_block = False
    
    for line in lines:
        if line.strip().startswith('if __name__ == "__main__":'):
            in_main_block = True
            continue
        if in_main_block and line and not line.startswith('    ') and not line.startswith('\t'):
            in_main_block = False
        
        if not in_main_block:
            filtered_lines.append(line)
    
    clean_content = '\n'.join(filtered_lines)
    
    # 执行清理后的代码
    exec(clean_content)
    print("  ✅ 代码索引器类加载成功")
    
    # 测试实例化
    indexer = EnhancedCodeIndexer()
    print(f"  ✅ 实例创建成功: {type(indexer).__name__}")
    
    return True

def test_multi_model_manager():
    """测试多模型管理器核心功能"""
    print("🤖 测试多模型管理器...")
    
    # 读取脚本
    with open('multi-model-manager.py', 'r') as f:
        content = f.read()
    
    # 移除main部分
    lines = content.split('\n')
    filtered_lines = []
    in_main_block = False
    
    for line in lines:
        if line.strip().startswith('if __name__ == "__main__":'):
            in_main_block = True
            continue
        if in_main_block and line and not line.startswith('    ') and not line.startswith('\t'):
            in_main_block = False
        
        if not in_main_block:
            filtered_lines.append(line)
    
    clean_content = '\n'.join(filtered_lines)
    
    # 执行代码
    exec(clean_content)
    print("  ✅ 多模型管理器类加载成功")
    
    # 测试实例化
    manager = MultiModelManager()
    print(f"  ✅ 实例创建成功: {type(manager).__name__}")
    
    return True

def main():
    """主测试函数"""
    print("🚀 开始测试Python模块核心功能...\n")
    
    results = []
    
    try:
        results.append(('代码索引器', test_enhanced_code_indexer()))
    except Exception as e:
        print(f"  ❌ 代码索引器错误: {e}")
        results.append(('代码索引器', False))
    
    try:
        results.append(('多模型管理器', test_multi_model_manager()))
    except Exception as e:
        print(f"  ❌ 多模型管理器错误: {e}")
        results.append(('多模型管理器', False))
    
    print(f"\n📊 测试结果:")
    for name, success in results:
        status = "✅ 成功" if success else "❌ 失败"
        print(f"  {name}: {status}")
    
    total = len(results)
    passed = sum(1 for _, success in results if success)
    print(f"\n🎯 成功率: {passed}/{total}")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)