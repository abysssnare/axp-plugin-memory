# Memory Policy（渐进披露 skill）

> 本文件是 `memory-policy` 知识体的 entry。宿主在渐进披露模式下先读这一页，
> 需要细则时再读 `../` 下面的展开章节（当前为单页示例）。

## 何时写入记忆

- 用户明确说「记住 …」「以后 …」→ `memory.write`，importance 至少 `normal`。
- 推理过程中出现**可复用**的项目事实（路径、端口、偏好、决策）→ `memory.write`，打标签。
- 临时计算中间量 **不写入**——记忆是给未来的，不是给本次回答的草稿纸。

## 何时读取记忆

- 回答与「偏好 / 约定 / 之前做过什么」相关的问题前，先 `memory.search` 关键词。
- 会话开始时可 `memory.stats` 判断记忆库规模，超过阈值时考虑收敛。

## 何时遗忘

- 用户明确要求遗忘，或记录被证伪 → `memory.forget`。
- **不要**批量遗忘；一次一条，幂等重试安全。

## 检索技巧

- 中文关键词按词检索；`q` 同时匹配内容与标签。
- 标签是过滤的第一入口：`memory.read` + `tag` 比 `search` 更精确。

## 工具白名单

本 skill 允许调用：`memory.read` · `memory.search` · `memory.stats`（写与遗忘由主对话决定，不经本 skill）。
