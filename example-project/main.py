#!/usr/bin/env python3
"""
一个简单的数据处理脚本示例
"""

import json
import os
from typing import Dict, List, Optional
from datetime import datetime


def load_data(file_path: str) -> Optional[List[Dict]]:
    """从JSON文件加载数据"""
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"加载数据失败: {e}")
        return None


def save_data(data: List[Dict], file_path: str) -> bool:
    """保存数据到JSON文件"""
    try:
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        print(f"保存数据失败: {e}")
        return False


def process_data(data: List[Dict]) -> List[Dict]:
    """处理数据"""
    result = []
    for item in data:
        processed = {}
        for key, value in item.items():
            if isinstance(value, str):
                processed[key] = value.upper()
            elif isinstance(value, (int, float)):
                processed[key] = value * 2
            else:
                processed[key] = value
        result.append(processed)
    return result


def filter_data(data: List[Dict], condition: Dict) -> List[Dict]:
    """根据条件过滤数据"""
    result = []
    for item in data:
        match = True
        for key, value in condition.items():
            if item.get(key) != value:
                match = False
                break
        if match:
            result.append(item)
    return result


def main():
    """主函数"""
    print("开始数据处理...")
    
    # 加载数据
    data = load_data('input.json')
    if not data:
        print("无法加载数据，退出")
        return
    
    # 处理数据
    processed_data = process_data(data)
    
    # 过滤数据
    condition = {'status': 'active'}
    filtered_data = filter_data(processed_data, condition)
    
    # 保存结果
    save_data(filtered_data, 'output.json')
    
    print(f"处理完成! 共处理 {len(filtered_data)} 条数据")


if __name__ == '__main__':
    main()