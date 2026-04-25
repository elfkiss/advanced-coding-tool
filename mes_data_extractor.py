#!/usr/bin/env python3
"""
精机云MES系统数据提取工具
适用于：Vue3 + SpringBoot 架构的ERP系统
"""

import requests
import json
import pandas as pd
from datetime import datetime
import time
import getpass
from urllib.parse import urljoin

class MESDataExtractor:
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
                if response.status_code == 200:
                    print(f"✅ 登录成功: {login_url}")
                    return True
            except Exception as e:
                print(f"❌ 登录失败 {login_url}: {e}")
                
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
                return None
        except Exception as e:
            print(f"❌ 请求失败: {e}")
            return None
    
    def export_to_excel(self, data, filename=None):
        """导出到Excel"""
        if not filename:
            filename = f"production_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        
        try:
            df = pd.DataFrame(data)
            df.to_excel(filename, index=False)
            print(f"✅ 数据已导出到: {filename}")
            return filename
        except Exception as e:
            print(f"❌ 导出失败: {e}")
            return None

def main():
    print("🦞 精机云MES数据提取工具")
    print("=" * 50)
    
    # 初始化
    extractor = MESDataExtractor()
    
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
        "/order/pending"
    ]
    
    for endpoint in endpoints:
        print(f"尝试: {endpoint}")
        data = extractor.get_production_data(endpoint)
        if data:
            print(f"✅ 成功获取数据: {len(data) if isinstance(data, list) else 'object'}")
            
            # 导出数据
            filename = extractor.export_to_excel(data if isinstance(data, list) else [data])
            if filename:
                print(f"\n🎉 数据提取完成！文件: {filename}")
            break
    else:
        print("❌ 所有API端点都失败，请手动检查正确的接口")

if __name__ == "__main__":
    main()