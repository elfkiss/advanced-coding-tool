# 🦞 MES数据获取工具使用说明

## 📋 工具功能
自动从精机云MES系统获取待生产明细数据并导出为Excel文件

## 🔧 使用方法

### 方法1：直接运行Python脚本

1. **安装依赖**：
   ```bash
   pip install requests pandas openpyxl
   ```

2. **运行脚本**：
   ```bash
   python mes_data_extractor.py
   ```

3. **输入登录信息**：
   - 用户名：1103（默认）
   - 密码：你的密码

### 方法2：手动分析API（推荐）

1. **打开浏览器**，访问：http://kunhou.vip:22545
2. **登录系统**（账号1103）
3. **进入待生产明细页面**
4. **按F12打开开发者工具**
5. **切换到Network选项卡**
6. **刷新页面或点击查询**
7. **找到XHR请求**，右键 → "Copy as cURL"
8. **把cURL命令发给我**，我帮你定制脚本

### 方法3：使用浏览器控制台脚本

1. **登录系统后**，按F12
2. **切换到Console选项卡**
3. **粘贴以下脚本**：

```javascript
// 记录所有API调用
(function() {
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        console.log('API:', args[0], args[1]);
        if (!window.apiCalls) window.apiCalls = [];
        window.apiCalls.push({url: args[0], method: args[1]?.method || 'GET'});
        return originalFetch.apply(this, args);
    };
    console.log('脚本已激活！刷新页面查看API调用');
})();
```

## 🎯 预期结果

- ✅ 自动登录系统
- ✅ 获取待生产明细数据
- ✅ 导出Excel文件
- ✅ 支持定时自动执行

## 📊 数据格式
导出的Excel文件包含：
- 订单号
- 产品名称
- 数量
- 交期
- 状态
- 其他相关信息

## 🔒 安全说明
- 密码输入时不会显示
- 数据保存在本地
- 不会上传到任何服务器

## ❓ 遇到问题？

1. **登录失败**：检查用户名密码是否正确
2. **API访问失败**：可能是接口路径不对，需要手动分析
3. **数据格式错误**：联系系统管理员确认数据结构

---

**提示**：最好的方式是先用方法2手动分析API，然后我帮你定制精确的脚本！