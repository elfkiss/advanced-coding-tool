#!/usr/bin/env python3
"""
测试各个Python模块的可用性
"""

import sys
import os

# 添加当前目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_enhanced_code_indexer():
    """测试代码索引器"""
    print("🔍 测试 enhanced_code_indexer...")
    try:
        from enhanced_code_indexer import EnhancedCodeIndexer
        
        # 创建索引器实例
        indexer = EnhancedCodeIndexer()
        
        # 测试索引一个简单的目录
        test_dir = "/home/echo/.openclaw/workspace/advanced-coding-tool/src"
        if os.path.exists(test_dir):
            print(f"  📁 索引目录: {test_dir}")
            indexer.index_repository(test_dir)
            print(f"  ✅ 索引完成: {len(indexer.symbols)} 个符号")
        else:
            print(f"  ⚠️  目录不存在: {test_dir}")
            
        return True
    except Exception as e:
        print(f"  ❌ 错误: {e}")
        return False

def test_multi_model_manager():
    """测试多模型管理器"""
    print("🤖 测试 multi_model_manager...")
    try:
        from multi_model_manager import MultiModelManager
        
        # 创建管理器实例
        manager = MultiModelManager()
        print("  ✅ 多模型管理器初始化成功")
        
        # 检查可用模型
        if hasattr(manager, 'available_models'):
            print(f"  📋 可用模型: {list(manager.available_models.keys())}")
        
        return True
    except Exception as e:
        print(f"  ❌ 错误: {e}")
        return False

def test_ai_programming_assistant():
    """测试AI编程助手"""
    print("🧠 测试 ai_programming_assistant...")
    try:
        # 首先导入依赖模块
        from enhanced_code_indexer import EnhancedCodeIndexer, CodeSymbol, SearchResult
        from multi_model_manager import MultiModelManager
        
        # 然后导入主模块
        from ai_programming_assistant import AIProgrammingAssistant
        
        # 创建助手实例
        assistant = AIProgrammingAssistant()
        print("  ✅ AI编程助手初始化成功")
        
        return True
    except Exception as e:
        print(f"  ❌ 错误: {e}")
        return False

def main():
    """主测试函数"""
    print("🚀 开始测试Python模块...\n")
    
    results = {
        'enhanced_code_indexer': test_enhanced_code_indexer(),
        'multi_model_manager': test_multi_model_manager(),
        'ai_programming_assistant': test_ai_programming_assistant(),
    }
    
    print(f"\n📊 测试结果汇总:")
    for module, success in results.items():
        status = "✅ 成功" if success else "❌ 失败"
        print(f"  {module}: {status}")
    
    total_tests = len(results)
    passed_tests = sum(results.values())
    print(f"\n🎯 总计: {passed_tests}/{total_tests} 个模块测试通过")
    
    if passed_tests == total_tests:
        print("🎉 所有模块测试成功！")
    else:
        print("⚠️  部分模块存在问题，需要进一步调试")

if __name__ == "__main__":
    main()