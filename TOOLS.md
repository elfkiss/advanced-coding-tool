# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

---

## 天气查询注意事项

wttr.in 对中文地名识别不稳定，**容易定位错误**：
- ❌ `海宁` → 会识别成丹麦的 **Herning** (+4°C)
- ✅ `Haining,Zhejiang,China` → 正确的浙江海宁 (+17°C)

**常用地址格式：**
- 海宁 → `Haining,Zhejiang,China`
- 嘉兴 → `Jiaxing,Zhejiang,China`
- 杭州 → `Hangzhou,Zhejiang,China`

**cron 任务已更新**，确保自动推送使用正确地址。

---

## 登录凭证

### 精机云 (kunhou.vip)
- URL: http://kunhou.vip:22545
- 账号: 1103
- 密码: 3.1415926
- 浏览器: Chromium (已配置远程调试端口 18800)

---

## 精机云 ERP 系统功能结构

**系统名称**: 精机云 (Jingji Cloud ERP)
**技术栈**: Vue.js 3.x + Element Plus + SpringBoot
**用户信息**: 账号 1103 | 姓名 张涛 | 帐套 EM8

### 功能模块总览 (21个一级菜单)

| 序号 | 菜单名称 | 功能分类 |
|------|----------|----------|
| 1 | OA 系统 | 办公自动化 |
| 2 | 任务管理 | 项目任务 |
| 3 | 业务系统 | 销售与客户 |
| 4 | 工程系统 | 技术与BOM |
| 5 | 产品生管 | 生产计划 |
| 6 | 生产管理 | 生产执行 |
| 7 | 采购系统 | 采购管理 |
| 8 | 委外系统 | 外协加工 |
| 9 | 品质系统 | 质量检验 |
| 10 | 库存系统 | 仓储物流 |
| 11 | 应收应付 | 财务管理 |
| 12 | 车间系统 | 车间管理 |
| 13 | 资产管理 | 设备资产 |
| 14 | 产品进度 | 项目跟踪 |
| 15 | 负荷分析 | 产能分析 |
| 16 | 绩效管理 | 绩效考核 |
| 17 | 产品成本 | 成本核算 |
| 18 | 8D报告 | 质量改进 |
| 19 | 资料设置 | 数据配置 |
| 20 | 系统设置 | 系统管理 |
| 21 | 定制系统 | 个性化配置 |

---

### 详细功能菜单

#### 1. OA 系统
- OA 申请
- 我发起的
- 抄送我的
- 未完成的
- 已完成的
- 审批日志
- 流程设定

#### 2. 任务管理
- 我的任务
- 我创建的
- 已完成的

#### 3. 业务系统
- 业务订单
- 业务送货
- 客户扣款
- 业务退货
- 客户投诉
- 业务确价
- 订单结案
- 交期确认
- 报表中心

#### 4. 工程系统
- 产品料表清单(BOM)
- 线材模具准备完成回馈
- 制程任务变更单
- 报表中心

#### 5. 产品生管
- 工作中心排工
- 报表中心

#### 6. 生产管理
- 生产BOM
- 包装方案
- 生产ARP
- 制令投料单变更单
- 报表中心

#### 7. 采购系统
- 采购申请
- 采购订单
- 采购收货
- 采购库存退货申请
- 采购库存退货出仓
- 采购订单变更单
- 采购单价审批
- 报表中心
- 待审单据清单

#### 8. 委外系统
- 委外申请
- 委外订单
- 委外收货
- 委外确价
- 委外库存退货申请
- 委外库存退货出仓
- 委外核销
- 委外线材反核销
- 报表中心
- 待审单据清单

#### 9. 品质系统
- 品质检验 (来料/过程/成品/出货)
- pad品质检验
- 品检退货申请
- 特采申请
- 供应商扣款
- 品质不良裁示

#### 10. 库存系统
- 入库管理 (采购/生产/委外/其他)
- 出库管理 (销售/生产/委外/其他)
- 库存盘点
- 库存调拨
- 库存报表
- 待审单据清单

#### 11. 应收应付
- 应收账款
- 应付账款
- 核销记录
- 财务报表
- 待审单据清单

#### 12. 车间系统
- 车间排工
- 报工管理
- 工序进度
- 车间报表

#### 13. 资产管理
- 资产台账
- 资产折旧
- 资产维修
- 资产报表

#### 14. 产品进度
- 项目进度
- 订单进度
- 进度报表

#### 15. 负荷分析
- 产能分析
- 负荷报表

#### 16. 绩效管理
- 绩效指标
- 绩效评估
- 绩效报表

#### 17. 产品成本
- 成本核算
- 成本分析
- 成本报表

#### 18. 8D报告
- 8D问题跟踪
- 改善措施
- 效果验证

#### 19. 资料设置
- 基本资料
- 物料设置
- 供应商设置
- 客户设置

#### 20. 系统设置
- 用户管理
- 角色管理
- 菜单管理
- 系统配置

#### 21. 定制系统
- 个性化配置

---

### 常用快捷功能 (首页)

**数据概览:**
- 制程待生产明细
- 加工中订单数: 2,631
- 全部未交: 13,236
- 区间已销: 618
- 接单数量: 800

**快捷入口:**
- OA办公: 待我处理、我发起的、抄送我的
- 任务管理: 我的任务、我创建的、已完成

---

### 页面路由参考
- 登录页: `/#/login`
- 首页: `/#/dashboard`
- 资源管理: `/#/resource`

---

## Docker 权限问题诊断

### 问题描述
定时任务中的模型服务无法启动沙箱环境，错误信息：
`permission denied while trying to connect to the docker API at unix:///var/run/docker.sock`

### 诊断结果
- ✅ Docker 服务运行正常
- ✅ 用户 echo 在 docker 组中
- ✅ /var/run/docker.sock 权限正确 (rw-rw---- root:docker)
- ✅ 用户可以直接执行 docker 命令

### 可能原因
1. **OpenClaw Gateway 进程权限问题**：Gateway 可能以不同用户身份运行
2. **SELinux/AppArmor 限制**：安全模块可能阻止访问
3. **容器内权限问题**：OpenClaw 的沙箱容器可能缺少必要权限

### 解决方案
1. 重启 OpenClaw Gateway 服务
2. 检查系统安全策略
3. 验证 Gateway 进程的用户权限

Add whatever helps you do your job. This is your cheat sheet.
