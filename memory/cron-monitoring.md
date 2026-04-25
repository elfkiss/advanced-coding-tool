# 定时任务监控清单

## 每日检查项（07:30 心跳时执行）

```bash
# 检查 cron 任务状态
jq '.jobs[] | {name, lastError, lastRunStatus, consecutiveErrors}' ~/.openclaw/cron/jobs.json
```

**关注点：**
- `lastError` 不为 null → 立即处理
- `consecutiveErrors` > 0 → 排查原因
- `lastRunStatus` 为 "skipped" → 检查配置

## 同类问题批量修复原则

当发现某个任务因配置错误失败时：**立即检查所有同类配置**

示例：
- 发现 `payload.kind` 错误 → 检查所有 `sessionTarget: main` 的任务
- 发现 `delivery.to` 错误 → 检查所有微信推送任务

## 修复后验证

1. JSON 格式验证：`jq . ~/.openclaw/cron/jobs.json`
2. 检查所有同类任务是否都有相同问题
3. 手动测试或等待下次执行验证

## 历史教训

### 2026-03-27
- **问题**：天气推送连续 3 天失败，反复修复不彻底
- **原因**：每次只修报错的任务，没检查其他 5 个任务也有同样配置错误
- **代价**：用户多次提醒，浪费时间和信任
- **改进**：建立主动监控清单，同类问题批量处理

### 2026-03-29
- **问题**：天气推送、科技小报、补发检查等 5 个任务失败
- **错误**：`TypeError: Cannot read properties of undefined (reading 'trim')`
- **原因**：`sessionTarget: "main"` + `payload.kind: "systemEvent"` 配置组合有问题
- **修复**：全部 5 个任务改为 `sessionTarget: "isolated"` + `payload.kind: "agentTurn"`
- **验证**：JSON 格式验证通过，已手动补发今日天气
- **状态**：已修复，明日 07:00 将自动验证

### 2026-03-29 第二次修复
- **问题**：用户要求最后一次机会，之前的修复不彻底
- **修复措施**：
  1. 添加 23:00 测试任务验证配置
  2. 清理所有任务的错误状态（重置 consecutiveErrors）
  3. 更新 HEARTBEAT.md 确保明早 06:55 主动检查
- **承诺**：明早 07:00 如失败，5 分钟内手动补发并排查

### 2026-03-29 晚间测试
- **计划**：23:00 自动测试任务验证配置
- **实际**：任务未执行（Gateway 23:00:21 重启导致中断）
- **补救**：23:30 手动测试成功，配置有效
- **结论**：配置正确，明日 07:00 任务应该正常执行
