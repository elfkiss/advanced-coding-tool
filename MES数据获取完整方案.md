# 🦞 MES待生产明细数据获取完整方案

## 📋 目标
获取精机云MES系统的待生产明细数据，用于第三方统计系统

## 🔧 方案选择

### 方案1：浏览器控制台脚本（最简单）
**操作步骤**：
1. 打开浏览器访问 http://kunhou.vip:22545
2. 用账号1103登录系统
3. 进入"制程待生产明细"页面
4. 按F12打开开发者工具
5. 在Console中粘贴以下代码：

```javascript
// 自动记录所有API调用
(function() {
    const originalFetch = window.fetch;
    const originalXHROpen = window.XMLHttpRequest.prototype.open;
    const originalXHRSend = window.XMLHttpRequest.prototype.send;
    
    // 拦截fetch请求
    window.fetch = function(...args) {
        console.log('🔍 API请求:', args[0], args[1]);
        if (!window.apiCalls) window.apiCalls = [];
        window.apiCalls.push({
            type: 'fetch',
            url: args[0],
            method: args[1]?.method || 'GET',
            timestamp: new Date().toISOString()
        });
        return originalFetch.apply(this, args);
    };
    
    // 拦截XHR请求
    window.XMLHttpRequest.prototype.open = function(method, url) {
        this._url = url;
        this._method = method;
        return originalXHROpen.apply(this, arguments);
    };
    
    window.XMLHttpRequest.prototype.send = function(data) {
        console.log('🔍 XHR请求:', this._method, this._url);
        if (!window.apiCalls) window.apiCalls = [];
        window.apiCalls.push({
            type: 'xhr',
            method: this._method,
            url: this._url,
            timestamp: new Date().toISOString()
        });
        return originalXHRSend.apply(this, arguments);
    };
    
    console.log('✅ API监控脚本已激活！');
    console.log('📋 现在刷新页面或点击查询按钮');
    console.log('📊 所有API调用都会记录在 window.apiCalls 中');
})();
```

6. 刷新页面或点击查询按钮
7. 把API调用信息发给我，我帮你写精确的提取脚本

### 方案2：手动复制API信息
**操作步骤**：
1. 登录精机云系统
2. 进入待生产明细页面
3. 按F12打开开发者工具
4. 在Network选项卡中找到XHR请求
5. 右键点击请求 → "Copy as cURL"
6. 把cURL命令发给我

### 方案3：使用我创建的脚本
我已经创建了3个脚本：
- `mes_test.py` - 基础连接测试
- `mes_simple_extractor.py` - 简化版数据提取
- `mes_fully_auto.py` - 全自动尝试

## 🎯 推荐操作顺序

### 第一步：使用方案1（最简单）
只需要复制粘贴代码，几秒钟就能获得API信息

### 第二步：获得API信息后
我会立即为你创建：
1. **精确的数据提取脚本**
2. **定时自动执行脚本**
3. **数据格式化工具**
4. **集成到统计系统的代码**

## 📊 预期结果

成功后你将获得：
- ✅ 实时的待生产明细数据
- ✅ 自动化数据提取脚本
- ✅ 可配置的定时任务
- ✅ 第三方统计系统集成

## 💡 为什么这个方案更好？

1. **无需密码泄露** - 你自己操作，密码不会离开你的浏览器
2. **精确的API信息** - 直接获取真实的API调用
3. **快速实现** - 几分钟就能完成
4. **可重复使用** - 获得的脚本可以长期使用

---

**现在请选择方案1，复制粘贴JavaScript代码到浏览器控制台，然后告诉我API调用信息！** 🚀