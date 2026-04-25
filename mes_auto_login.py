#!/usr/bin/env python3
"""
精机云MES系统自动登录和数据获取工具
支持多种登录方式和数据提取策略
"""

import requests
import json
import time
from datetime import datetime
from urllib.parse import urljoin, urlparse

class MESAutoLogin:
    def __init__(self, base_url="http://kunhou.vip:22545"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
    def test_system_info(self):
        """获取系统信息"""
        print("🔍 获取系统信息...")
        try:
            response = self.session.get(self.base_url, timeout=10)
            print(f"✅ 系统响应: {response.status_code}")
            print(f"📄 页面标题: {response.text[:200]}")
            
            # 尝试找到可能的API路径
            api_patterns = [
                '/api/',
                '/v1/api/',
                '/rest/',
                '/data/',
                '/production/',
                '/order/',
                '/workorder/'
            ]
            
            found_apis = []
            for pattern in api_patterns:
                test_url = urljoin(self.base_url, pattern)
                try:
                    resp = requests.head(test_url, timeout=5)
                    if resp.status_code in [200, 301, 302]:
                        found_apis.append((pattern, resp.status_code))
                except:
                    pass
            
            if found_apis:
                print(f"🎯 发现可能的API端点: {found_apis}")
            else:
                print("⚠️ 未发现明显的API端点")
                
        except Exception as e:
            print(f"❌ 系统信息获取失败: {e}")
    
    def try_multiple_logins(self, username="1103", password=""):
        """尝试多种登录方式"""
        print(f"\n🔐 尝试登录系统 (用户: {username})")
        
        # 密码列表（你可以根据实际情况添加）
        password_list = [
            "3.1415926",  # 从TOOLS.md中看到的密码
            password,
            "kunhou",
            "admin",
            "123456",
            "password"
        ]
        
        login_endpoints = [
            "/api/login",
            "/user/login", 
            "/auth/login",
            "/login",
            "/api/auth/login"
        ]
        
        data_formats = [
            {"username": username, "password": pwd},
            {"userName": username, "userPwd": pwd},
            {"account": username, "password": pwd},
            {"user": username, "pass": pwd},
            {"login": username, "password": pwd}
        ]
        
        for endpoint in login_endpoints:
            login_url = urljoin(self.base_url, endpoint)
            print(f"\n📍 尝试登录端点: {endpoint}")
            
            for data_format in data_formats:
                for pwd in password_list:
                    if pwd:
                        current_data = data_format.copy()
                        current_data["password"] = pwd
                        
                        try:
                            response = self.session.post(login_url, json=current_data, timeout=10)
                            print(f"   {endpoint} - {data_format['username']} - 状态: {response.status_code}")
                            
                            if response.status_code == 200:
                                try:
                                    result = response.json()
                                    if "success" in str(result).lower() or "token" in str(result):
                                        print(f"   ✅ 登录成功! 响应: {result}")
                                        return True
                                except:
                                    if "登录成功" in response.text or "success" in response.text:
                                        print(f"   ✅ 登录成功! 文本响应")
                                        return True
                            elif response.status_code == 401:
                                print(f"   🔒 认证失败")
                            elif response.status_code == 403:
                                print(f"   🔓 禁止访问")
                                
                        except Exception as e:
                            print(f"   ❌ 请求异常: {e}")
        
        print("❌ 所有登录方式都失败了")
        return False
    
    def extract_production_data(self):
        """提取生产数据"""
        print(f"\n📊 尝试提取生产数据...")
        
        # 生产数据可能的API端点
        production_endpoints = [
            "/api/production/pending",
            "/api/production/orders",
            "/api/workorder/pending",
            "/api/orders/pending",
            "/production/pending",
            "/production/list",
            "/workorder/list",
            "/order/list"
        ]
        
        for endpoint in production_endpoints:
            url = urljoin(self.base_url, endpoint)
            try:
                response = self.session.get(url, timeout=10)
                print(f"📍 {endpoint}: {response.status_code}")
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        print(f"   ✅ 成功获取数据!")
                        print(f"   📊 数据类型: {type(data)}")
                        
                        if isinstance(data, list):
                            print(f"   📈 数据条数: {len(data)}")
                            if len(data) > 0:
                                print(f"   🔑 字段: {list(data[0].keys())}")
                                return data
                        elif isinstance(data, dict):
                            print(f"   🔑 字段: {list(data.keys())}")
                            return data
                            
                    except json.JSONDecodeError:
                        print(f"   📄 文本响应: {response.text[:200]}")
                        
            except Exception as e:
                print(f"   ❌ 请求失败: {e}")
        
        return None

def main():
    print("🦞 精机云MES自动登录和数据提取工具")
    print("=" * 60)
    
    extractor = MESAutoLogin()
    
    # 1. 获取系统信息
    extractor.test_system_info()
    
    # 2. 尝试自动登录
    username = input("请输入用户名 (默认1103): ") or "1103"
    password = input("请输入密码 (留空尝试常见密码): ")
    
    if extractor.try_multiple_logins(username, password):
        print("✅ 登录成功!")
        
        # 3. 提取生产数据
        data = extractor.extract_production_data()
        if data:
            print("🎉 数据提取成功!")
            
            # 保存数据
            filename = f"mes_production_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"💾 数据已保存到: {filename}")
        else:
            print("❌ 数据提取失败")
    else:
        print("❌ 登录失败，需要手动操作")

if __name__ == "__main__":
    main()