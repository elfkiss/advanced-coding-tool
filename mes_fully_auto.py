#!/usr/bin/env python3
"""
精机云MES系统全自动数据提取工具
"""

import requests
import json
import time
from datetime import datetime
from urllib.parse import urljoin

class MESFullyAuto:
    def __init__(self, base_url="http://kunhou.vip:22545"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
    def get_system_info(self):
        """获取系统信息"""
        print("🔍 获取系统信息...")
        try:
            response = self.session.get(self.base_url, timeout=10)
            print(f"✅ 系统响应: {response.status_code}")
            
            # 保存页面内容分析
            with open("mes_system_page.html", "w", encoding="utf-8") as f:
                f.write(response.text)
            print("💾 系统页面已保存到: mes_system_page.html")
            
            return response.text
        except Exception as e:
            print(f"❌ 系统信息获取失败: {e}")
            return None
    
    def auto_login(self):
        """自动登录"""
        print(f"\n🔐 尝试自动登录...")
        
        # 配置信息
        username = "1103"
        password = "3.1415926"  # 从TOOLS.md获取
        
        login_configs = [
            {
                "url": "/api/login",
                "data": {"username": username, "password": password}
            },
            {
                "url": "/user/login", 
                "data": {"userName": username, "userPwd": password}
            },
            {
                "url": "/auth/login",
                "data": {"account": username, "password": password}
            },
            {
                "url": "/login",
                "data": {"username": username, "password": password}
            }
        ]
        
        for config in login_configs:
            login_url = urljoin(self.base_url, config["url"])
            try:
                print(f"📍 尝试: {config['url']}")
                response = self.session.post(login_url, json=config["data"], timeout=10)
                print(f"   状态: {response.status_code}")
                
                if response.status_code == 200:
                    try:
                        result = response.json()
                        if "success" in str(result).lower() or "token" in str(result):
                            print(f"   ✅ 登录成功!")
                            return True
                    except:
                        if "登录成功" in response.text or "success" in response.text:
                            print(f"   ✅ 登录成功!")
                            return True
                            
            except Exception as e:
                print(f"   ❌ 失败: {e}")
        
        return False
    
    def extract_all_data(self):
        """提取所有可能的数据"""
        print(f"\n📊 提取生产数据...")
        
        # 数据提取配置
        data_configs = [
            {
                "name": "待生产明细",
                "endpoints": [
                    "/api/production/pending",
                    "/api/production/orders",
                    "/api/workorder/pending",
                    "/production/pending"
                ]
            },
            {
                "name": "订单数据",
                "endpoints": [
                    "/api/orders",
                    "/api/orders/pending",
                    "/api/orders/list",
                    "/order/list"
                ]
            },
            {
                "name": "生产数据",
                "endpoints": [
                    "/api/production",
                    "/api/production/list",
                    "/production/list",
                    "/api/v1/production"
                ]
            }
        ]
        
        all_data = {}
        
        for config in data_configs:
            print(f"\n🔍 查找{config['name']}...")
            config_data = {}
            
            for endpoint in config["endpoints"]:
                url = urljoin(self.base_url, endpoint)
                try:
                    response = self.session.get(url, timeout=10)
                    print(f"   {endpoint}: {response.status_code}")
                    
                    if response.status_code == 200:
                        try:
                            data = response.json()
                            config_data[endpoint] = data
                            print(f"   ✅ 成功获取!")
                            
                            # 如果是列表，显示前几条数据
                            if isinstance(data, list) and len(data) > 0:
                                print(f"   📊 数据条数: {len(data)}")
                                print(f"   🔑 字段: {list(data[0].keys())}")
                                
                        except json.JSONDecodeError:
                            config_data[endpoint] = response.text[:500]
                            print(f"   📄 文本数据")
                            
                except Exception as e:
                    print(f"   ❌ 失败: {e}")
            
            if config_data:
                all_data[config["name"]] = config_data
        
        return all_data if all_data else None

def main():
    print("🦞 精机云MES全自动数据提取工具")
    print("=" * 60)
    
    extractor = MESFullyAuto()
    
    # 1. 获取系统信息
    page_content = extractor.get_system_info()
    
    # 2. 尝试自动登录
    if extractor.auto_login():
        print("✅ 自动登录成功!")
        
        # 3. 提取所有数据
        data = extractor.extract_all_data()
        if data:
            print("🎉 数据提取成功!")
            
            # 保存所有数据
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            # 保存JSON格式
            json_filename = f"mes_data_{timestamp}.json"
            with open(json_filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"💾 JSON数据已保存到: {json_filename}")
            
            # 保存CSV格式（如果是列表数据）
            for category, endpoints in data.items():
                for endpoint, content in endpoints.items():
                    if isinstance(content, list):
                        csv_filename = f"mes_{category}_{timestamp}.csv"
                        import csv
                        with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
                            writer = csv.DictWriter(f, fieldnames=content[0].keys())
                            writer.writeheader()
                            writer.writerows(content)
                        print(f"💾 CSV数据已保存到: {csv_filename}")
            
            print("\n🎯 数据提取完成！")
            print("📋 下一步:")
            print("1. 查看生成的文件")
            print("2. 根据数据格式调整统计系统")
            print("3. 设置定时自动执行")
            
        else:
            print("❌ 数据提取失败")
            print("\n🔧 建议:")
            print("1. 检查登录是否成功")
            print("2. 确认API端点是否正确")
            print("3. 可能需要手动分析Network请求")
    else:
        print("❌ 自动登录失败")
        print("\n🔧 建议:")
        print("1. 检查用户名密码是否正确")
        print("2. 可能需要手动登录并分析API")

if __name__ == "__main__":
    main()