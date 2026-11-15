# axp-plugin-memory · 简单记忆系统（AXP 测试插件仓库）

> 一个用 [AXP（Agent eXtension Package）](https://github.com/abysssnare/axp) 规范编写的第三方插件测试仓库：
> 给 Agent 一个**简单记忆系统**——写入 / 读取 / 检索 / 遗忘 / 统计五件套，
> 全部组件 **L0 纯沙箱**、零 Android 权限，声明等级覆盖到 AXP-2（含 `ui{}`）。

![Spec](https://img.shields.io/badge/AXP-1.0-10b981)
![Level](https://img.shields.io/badge/host-AXP--2-f59e0b)
![Privilege](https://img.shields.io/badge/privilege-L0-3ddc84)
![Checks](https://img.shields.io/badge/demo-27%20assertions-brightgreen)

---

## 这个仓库是什么

`plugin/` 是一个符合 AXP v1.0 规范的完整插件包（`axp.json` 清单 + 实现体 + 知识体 + UI）：

| 组件 | 内容 |
|---|---|
| `tools[]` | `memory.write` / `read` / `search` / `forget` / `stats` |
| `surfaces[]` | `axp://x/io.github.abysssnare.memory/entries`（watchable，可订阅记忆库增量） |
| `knowledge[]` | `memory-policy` skill（渐进披露，只读工具白名单）+ `memory-recall` prompt |
| `agents[]` | `memory-curator`：只读巡检子代理，输出「建议遗忘清单」，privilege L0 |
| `events[]` | Surface 变化审计 + `lifecycle/tool.after(memory.write)` 写入钩子 |
| `ui{}` | DSL 面板：绑定 entries 流；动作 = 写入 / 检索 / 统计 |

`test/demo.mjs` 用 **AXP 参考运行时**（规范仓库里的 AXP-3 可运行宿主）做端到端验证：
校验器全绿 → 九步装载 → 工具调用 → Surface 增量 → UI 绑定更新 → 事件触发 → 动作回填 → 审计轨迹，
**27 条断言全绿**。

## 快速开始

```bash
# 1. 把 AXP 规范仓库克隆到同级目录（零依赖，Node 20+）
git clone https://github.com/abysssnare/axp.git ../axp

# 注意：规范项目本体在仓库根下的 axp/ 子目录（validator / runtime / cli 都在那里）
# 2. 校验插件清单（schema / 引用 / 权限 / UI / 事件一次跑完）
node ../axp/axp/validator/src/validate.mjs plugin
# → ALL CHECKS PASSED

# 3. 端到端演示（装载 + 工具 + Surface + UI + 事件 + 审计）
node test/demo.mjs
# → 27 passed, 0 failed

# 4. 打包成 .axp 分发物（发布前需 apksigner --v3 签名）
node ../axp/axp/cli/bin/axp.mjs pack plugin -o memory.axp

# 也可以用任意路径：AXP_REPO=<规范仓库根>/axp node test/demo.mjs
```

CI（`.github/workflows/ci.yml`）在 GitHub Actions 上复刻同样的流程：检出两个仓库 → 校验 → 演示 → 打包上传产物。

## 状态与持久化（诚实说明）

AXP 参考运行时的 T1 `js` 沙箱**没有**宿主存储 API（无 fs、无跨调用全局），
因此本插件采用**函数式内核**设计：

- `memory.write` 只生成并返回完整记录（含 id / 时间戳 / 标签 / 重要度）；
- `memory.read / search / stats` 对宿主注入的 `records` 快照做纯过滤；
- `test/demo.mjs` 代持状态：每次调用注入快照、把返回记录写回——这演示的是
  **宿主侧状态层**的职责，而非把状态塞进插件实现体。

真机宿主落地方式（见 `plugin/README.md`）：记忆写入插件私有目录（`axp://fs` 私有区，
`fs.write:app` 声明、对用户零权限弹窗），写入 / 遗忘后向 `entries` Surface 推送
`full → delta` 增量，面板与事件自动联动。

## 目录

```
.
├── plugin/                  ← AXP 插件包（可 validate / pack）
│   ├── axp.json             ← 清单：六类组件齐全，privilege L0
│   ├── main.js              ← T1 entry（init）
│   ├── tools/*.js           ← 五件套实现（函数式内核）
│   ├── surfaces/entries.js   ← subscribe(emit) 初始全量快照
│   ├── events/*.js          ← Surface 审计 + 写入后钩子
│   ├── skills/…             ← memory-policy SKILL.md + recall prompt
│   ├── agents/curator.md    ← 只读巡检子代理 prompt
│   ├── ui/panel.json        ← DSL 面板（bind + actions + lifecycle）
│   └── README.md            ← 插件级文档
├── test/demo.mjs            ← 27 条端到端断言（参考运行时）
└── .github/workflows/ci.yml ← 校验 + 演示 + 打包产物
```

## 与规范的关系

- 清单字段与语义遵循 [AXP v1.0 规范](https://github.com/abysssnare/axp)（`axp: "1.0"`）；
- 本仓库**不修改**规范，只是它的第一个第三方消费样本；
- 自定义 Surface 域遵循 `axp://x/<插件 id>/…` 约定（`05-domains.md`）；
- `publisher` 为开发占位指纹（64 个 `0`），生产分发需替换为真实 APK v3 证书指纹（`12-security.md`）。

## License

MIT（见 [LICENSE](LICENSE)）。
