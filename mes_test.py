#!/usr/bin/env python3
"""
精机云MES系统数据提取工具 (测试版)
"""

import requests
import json
from datetime import datetime
from urllib.parse import urljoin

class MESTestExtractor:
    def __init__(self, base_url="http://kunhou.vip:22545"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
    def test_connection(self):
        """测试基础连接"""
        try:
            response = requests.get(self.base_url, timeout=10)
            print(f"✅ 基础连接测试: {response.status_code}")
            return response.status_code == 200
        except Exception as e:
            print(f"❌ 连接失败: {e}")
            return False
    
    def test_endpoints(self):
        """测试可能的API端点"""
        endpoints = [
            "/api/production/pending",
            "/api/orders/pending", 
            "/api/production/orders",
            "/production/api/list",
            "/order/pending",
            "/api/workorder/pending",
            "/api/v1/production/pending",
            "/production/pending"
        ]
        
        for endpoint in endpoints:
            url = urljoin(self.base_url, endpoint)
            try:
                response = requests.get(url, timeout=5)
                print(f"测试 {endpoint}: {response.status_code}")
                if response.status_code == 200:
                    print(f"  ✅ 成功! 响应长度: {len(response.text)}")
                    try:
                        data = response.json()
                        print(f"  📊 JSON数据: {type(data)}")
                        if isinstance(data, list):
                            print(f"  📈 数据条数: {len(data)}")
                        elif isinstance(data, dict):
                            print(f"  🔑 数据字段: {list(data.keys())[:5]}")
                    except:
                        print(f"  📄 文本响应: {response.text[:100]}")
                elif response.status_code == 401:
                    print(f"  🔒 需要认证")
                elif response.status_code == 404:
                    print(f"  ❌ 接口不存在")
                else:
                    print(f"  ⚠️ 其他状态码")
            except Exception as e:
                print(f"  ❌ 请求失败: {e}")

def main():
    print("🦞 精机云MES接口测试工具")
    print("=" * 50)
    
    extractor = MESTestExtractor()
    
    print("\n🌐 测试基础连接...")
    extractor.test_connection()
    
    print("\n🔍 测试可能的API端点...")
    extractor.test_endpoints()
    
    print("\n📋 测试完成！")
    print("\n🎯 下一步建议:")
    print("1. 查看200状态码的接口")
    print("2. 手动登录系统，在浏览器开发者工具中查看实际API")
    print("3. 告诉我正确的API URL，我帮你写精确的提取脚本")

if __name__ == "__main__":
    main()