# io.github.abysssnare.memory

> AXP v1.0 · privilege L0 · host AXP-2 · 一个简单的记忆系统

## 做什么

给 Agent 一个持久记忆库：**写入 / 读取 / 检索 / 遗忘 / 统计** 五件套，配一条可订阅的
`axp://x/io.github.abysssnare.memory/entries` Surface、一个渐进披露的 memory-policy skill、
一个只读的记忆管理员子代理和一块声明式面板。全部组件 L0 纯沙箱，零 Android 权限。

## 组件

| 类型 | id | 说明 |
|---|---|---|
| tool | `memory.write` | 内容必填；返回含 id / 时间戳的完整记录 |
| tool | `memory.read` | 按 ids / tag 过滤，支持 limit |
| tool | `memory.search` | 内容与标签子串匹配（大小写不敏感） |
| tool | `memory.forget` | 按 id 幂等遗忘 |
| tool | `memory.stats` | 总数 / 按标签 / 按重要度分布 |
| surface | `axp://x/…/entries` | watchable，anchor=uri，views=list/json |
| knowledge | `memory-policy`（skill，渐进披露） | 何时写 / 读 / 遗忘；工具白名单=只读三件套 |
| knowledge | `memory-recall`（prompt） | 回答前先检索、无命中不编造 |
| agent | `memory-curator` | 只读巡检，输出「建议遗忘清单」，privilege L0 |
| event | `on: entries surface` | 记忆库变化审计 |
| event | `on: lifecycle/tool.after(memory.write)` | 写入后审计钩子（参考宿主跳过生命周期事件） |
| ui | `panel`（DSL） | 绑定 entries 流；动作=写 / 检索 / 统计 |

## 权限

- privilege: `L0`（纯计算与私有状态）
- requests: 无

## 状态与持久化（重要）

AXP 参考运行时的 T1 `js` 沙箱**没有**宿主存储 API（无 fs、无跨调用全局），
因此本插件采用「函数式内核」设计：

- `memory.write` 返回完整记录，`memory.read / search / stats` 接收宿主注入的
  `records` 快照做纯过滤——插件实现体本身可重放、可测试；
- **宿主持有状态**：参考运行时由驱动脚本（`test/demo.mjs`）代持；真机宿主应落在
  插件私有目录（`axp://fs/{path}` 私有区，声明 `fs.write:app`，对用户零权限弹窗），
  并在写入 / 遗忘后向 `entries` Surface 推送增量（`full → delta`，见 `05-domains.md`）。

## 热加载

未启用（保持简单；接入见 `spec/08-hot-reload.md`）。

## 安装

```bash
# 用规范仓库的 CLI 打包（发布前需 apksigner --v3 签名）
node axp/cli/bin/axp.mjs pack plugin -o memory.axp
# 校验
node axp/validator/src/validate.mjs plugin
```

`publisher` 是 64 个 `0` 的开发占位指纹（dev 策略）；生产分发必须换成真实证书指纹。
