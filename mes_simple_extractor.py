#!/usr/bin/env python3
"""
精机云MES系统数据提取工具 (简化版)
"""

import requests
import json
import csv
from datetime import datetime
import getpass
from urllib.parse import urljoin

class MESSimpleExtractor:
    def __init__(self, base_url="http://kunhou.vip:22545"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
    def login(self, username, password):
        """登录系统"""
        login_url = urljoin(self.base_url, "/api/login")
        
        # 尝试多种登录方式
        login_data_list = [
            {"username": username, "password": password},
            {"userName": username, "userPwd": password},
            {"account": username, "password": password}
        ]
        
        for login_data in login_data_list:
            try:
                response = self.session.post(login_url, json=login_data)
                print(f"尝试登录: {login_url}")
                if response.status_code == 200:
                    print(f"✅ 登录成功")
                    return True
                else:
                    print(f"❌ 登录失败: {response.status_code}")
            except Exception as e:
                print(f"❌ 登录异常: {e}")
                
        return False
    
    def get_production_data(self, endpoint="/api/production/pending"):
        """获取待生产明细"""
        url = urljoin(self.base_url, endpoint)
        
        try:
            response = self.session.get(url)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"❌ 获取数据失败: {response.status_code}")
                print(f"响应内容: {response.text[:200]}")
                return None
        except Exception as e:
            print(f"❌ 请求失败: {e}")
            return None
    
    def export_to_csv(self, data, filename=None):
        """导出到CSV"""
        if not filename:
            filename = f"production_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        try:
            with open(filename, 'w', newline='', encoding='utf-8') as f:
                if isinstance(data, list) and len(data) > 0:
                    writer = csv.DictWriter(f, fieldnames=data[0].keys())
                    writer.writeheader()
                    writer.writerows(data)
                elif isinstance(data, dict):
                    writer = csv.writer(f)
                    writer.writerow(['Key', 'Value'])
                    for key, value in data.items():
                        writer.writerow([key, value])
                else:
                    f.write(str(data))
            
            print(f"✅ 数据已导出到: {filename}")
            return filename
        except Exception as e:
            print(f"❌ 导出失败: {e}")
            return None

def main():
    print("🦞 精机云MES数据提取工具 (简化版)")
    print("=" * 50)
    
    # 初始化
    extractor = MESSimpleExtractor()
    
    # 登录
    username = input("请输入用户名 (默认1103): ") or "1103"
    password = getpass.getpass("请输入密码: ")
    
    if not extractor.login(username, password):
        print("❌ 登录失败，请检查用户名和密码")
        return
    
    # 获取数据
    print("\n📊 正在获取待生产明细...")
    
    # 尝试多个可能的API端点
    endpoints = [
        "/api/production/pending",
        "/api/orders/pending", 
        "/api/production/orders",
        "/production/api/list",
        "/order/pending",
        "/api/workorder/pending"
    ]
    
    for endpoint in endpoints:
        print(f"\n尝试: {endpoint}")
        data = extractor.get_production_data(endpoint)
        if data:
            print(f"✅ 成功获取数据!")
            print(f"数据类型: {type(data)}")
            if isinstance(data, list):
                print(f"数据条数: {len(data)}")
                if len(data) > 0:
                    print(f"字段示例: {list(data[0].keys())}")
            elif isinstance(data, dict):
                print(f"数据字段: {list(data.keys())}")
            
            # 导出数据
            filename = extractor.export_to_csv(data)
            if filename:
                print(f"\n🎉 数据提取完成！文件: {filename}")
                print("\n📋 下一步:")
                print("1. 检查CSV文件内容")
                print("2. 根据实际数据结构调整脚本")
                print("3. 集成到你的统计系统中")
            break
    else:
        print("\n❌ 所有API端点都失败")
        print("\n🔧 建议:")
        print("1. 手动登录系统，检查Network中的API请求")
        print("2. 告诉我具体的API URL")
        print("3. 我可以帮你定制精确的数据提取脚本")

if __name__ == "__main__":
    main()