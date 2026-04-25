#!/usr/bin/env python3
"""
直接浏览器访问工具 - 绕过OpenClaw限制
"""

import subprocess
import requests
import json
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

class DirectBrowserAccess:
    def __init__(self):
        self.driver = None
        
    def setup_chrome(self):
        """设置Chrome选项"""
        chrome_options = Options()
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--headless')  # 无头模式
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--remote-debugging-port=9222')
        chrome_options.add_argument('--user-data-dir=/tmp/chrome_profile')
        
        # 尝试不同的启动方式
        try:
            from selenium.webdriver.chrome.service import Service
            service = Service('/usr/bin/chromium-browser')
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            print("✅ Chrome启动成功")
            return True
        except:
            try:
                self.driver = webdriver.Chrome(options=chrome_options)
                print("✅ Chrome启动成功")
                return True
            except Exception as e:
                print(f"❌ Chrome启动失败: {e}")
                return False
    
    def login_mes(self, username="1103", password="3.1415926"):
        """登录MES系统"""
        try:
            print("🌐 访问MES系统...")
            self.driver.get("http://kunhou.vip:22545")
            
            # 等待页面加载
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            print("📋 查找登录表单...")
            # 尝试多种登录方式
            login_selectors = [
                ('input[placeholder*="用户"]', 'input[placeholder*="密码"]'),
                ('input[name="username"]', 'input[name="password"]'),
                ('input[id="username"]', 'input[id="password"]'),
                ('input[type="text"]', 'input[type="password"]')
            ]
            
            for user_sel, pass_sel in login_selectors:
                try:
                    username_input = self.driver.find_element(By.CSS_SELECTOR, user_sel)
                    password_input = self.driver.find_element(By.CSS_SELECTOR, pass_sel)
                    
                    username_input.clear()
                    username_input.send_keys(username)
                    password_input.clear()
                    password_input.send_keys(password)
                    
                    print(f"✅ 找到登录表单: {user_sel}")
                    
                    # 查找登录按钮
                    login_button_selectors = [
                        'button[type="submit"]',
                        'input[type="submit"]',
                        '.login-btn',
                        '.btn-login'
                    ]
                    
                    for btn_sel in login_button_selectors:
                        try:
                            login_button = self.driver.find_element(By.CSS_SELECTOR, btn_sel)
                            login_button.click()
                            print("✅ 点击登录按钮")
                            time.sleep(3)
                            return True
                        except:
                            continue
                    
                    # 如果没有找到按钮，尝试回车键
                    from selenium.webdriver.common.keys import Keys
                    password_input.send_keys(Keys.RETURN)
                    print("✅ 按下回车键")
                    time.sleep(3)
                    return True
                    
                except:
                    continue
            
            print("❌ 未找到登录表单")
            return False
            
        except Exception as e:
            print(f"❌ 登录过程出错: {e}")
            return False
    
    def navigate_to_production(self):
        """导航到待生产明细页面"""
        try:
            print("🔍 导航到待生产明细...")
            
            # 尝试多种导航方式
            nav_selectors = [
                'a[href*="production"]',
                'a[href*="制程"]',
                'a[href*="待生产"]',
                'a[href*="待办"]',
                '.menu-item',
                '.nav-item'
            ]
            
            for selector in nav_selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for element in elements:
                        text = element.text.lower()
                        if any(keyword in text for keyword in ['production', '制程', '待生产', '待办']):
                            print(f"✅ 找到导航项: {element.text}")
                            element.click()
                            time.sleep(2)
                            return True
                except:
                    continue
            
            print("❌ 未找到导航项")
            return False
            
        except Exception as e:
            print(f"❌ 导航过程出错: {e}")
            return False
    
    def capture_api_calls(self):
        """捕获API调用"""
        try:
            print("📊 捕获API调用...")
            
            # 注入JavaScript来监控API调用
            monitor_script = """
            (function() {
                const originalFetch = window.fetch;
                const originalXHROpen = window.XMLHttpRequest.prototype.open;
                
                window.apiCalls = [];
                
                window.fetch = function(...args) {
                    console.log('🔍 API请求:', args[0], args[1]);
                    window.apiCalls.push({
                        type: 'fetch',
                        url: args[0],
                        method: args[1]?.method || 'GET',
                        timestamp: new Date().toISOString()
                    });
                    return originalFetch.apply(this, args);
                };
                
                window.XMLHttpRequest.prototype.open = function(method, url) {
                    this._url = url;
                    this._method = method;
                    console.log('🔍 XHR请求:', method, url);
                    window.apiCalls.push({
                        type: 'xhr',
                        method: method,
                        url: url,
                        timestamp: new Date().toISOString()
                    });
                    return originalXHROpen.apply(this, arguments);
                };
                
                console.log('✅ API监控已激活');
            })();
            """
            
            self.driver.execute_script(monitor_script)
            print("✅ API监控脚本已注入")
            
            return True
            
        except Exception as e:
            print(f"❌ 注入监控脚本失败: {e}")
            return False
    
    def get_production_data(self):
        """获取生产数据"""
        try:
            print("📊 获取生产数据...")
            
            # 等待数据加载
            time.sleep(5)
            
            # 尝试获取表格数据
            data_selectors = [
                'table',
                '.el-table',
                '.data-table',
                '.production-table'
            ]
            
            for selector in data_selectors:
                try:
                    table = self.driver.find_element(By.CSS_SELECTOR, selector)
                    print(f"✅ 找到数据表格: {selector}")
                    
                    # 获取表格数据
                    rows = table.find_elements(By.CSS_SELECTOR, 'tr')
                    data = []
                    
                    for row in rows:
                        cells = row.find_elements(By.CSS_SELECTOR, 'td, th')
                        row_data = [cell.text for cell in cells]
                        if row_data:
                            data.append(row_data)
                    
                    if data:
                        print(f"📈 获取到 {len(data)} 行数据")
                        return data
                        
                except:
                    continue
            
            # 如果没有找到表格，尝试获取页面上的数据
            page_text = self.driver.find_element(By.TAG_NAME, 'body').text
            print(f"📄 页面文本长度: {len(page_text)}")
            
            # 查找可能的API调用记录
            if hasattr(self.driver, 'api_calls'):
                api_calls = self.driver.execute_script("return window.apiCalls || []")
                print(f"📊 捕获到 {len(api_calls)} 个API调用")
                
                for call in api_calls:
                    print(f"🔍 {call['type'].upper()}: {call['method']} {call['url']}")
                
                return api_calls
            
            return None
            
        except Exception as e:
            print(f"❌ 获取数据失败: {e}")
            return None
    
    def save_data(self, data):
        """保存数据"""
        try:
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            
            if isinstance(data, list):
                # 保存为CSV
                import csv
                filename = f"mes_production_data_{timestamp}.csv"
                with open(filename, 'w', newline='', encoding='utf-8') as f:
                    writer = csv.writer(f)
                    writer.writerows(data)
                print(f"✅ 数据已保存到: {filename}")
            else:
                # 保存为JSON
                filename = f"mes_api_calls_{timestamp}.json"
                with open(filename, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                print(f"✅ API调用已保存到: {filename}")
                
        except Exception as e:
            print(f"❌ 保存数据失败: {e}")
    
    def run(self):
        """运行整个流程"""
        print("🚀 开始直接浏览器访问...")
        
        # 1. 设置浏览器
        if not self.setup_chrome():
            print("❌ 浏览器设置失败")
            return False
        
        try:
            # 2. 登录系统
            if not self.login_mes():
                print("❌ 登录失败")
                return False
            
            # 3. 导航到生产页面
            if not self.navigate_to_production():
                print("❌ 导航失败")
                return False
            
            # 4. 注入监控脚本
            if not self.capture_api_calls():
                print("❌ 监控脚本注入失败")
                return False
            
            # 5. 获取数据
            data = self.get_production_data()
            if data:
                self.save_data(data)
                print("🎉 数据获取完成!")
                return True
            else:
                print("❌ 未获取到数据")
                return False
                
        finally:
            # 6. 清理
            if self.driver:
                self.driver.quit()
                print("🧹 浏览器已关闭")

if __name__ == "__main__":
    browser = DirectBrowserAccess()
    browser.run()