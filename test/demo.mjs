#!/usr/bin/env node
/**
 * 端到端演示：用 AXP 参考运行时（AXP-3）装载并驱动「简单记忆系统」插件。
 *
 * 用法：
 *   AXP_REPO=<规范仓库根>/axp node test/demo.mjs   # 显式指定规范项目目录（仓库内层 axp/）
 *   node test/demo.mjs                              # 依次尝试 ../axp/axp、./axp-src/axp、./axp/axp
 *
 * 环境要求：Node 20+；AXP 仓库（github.com/abysssnare/axp）本体零依赖。
 *
 * 状态模型（函数式内核）：T1 沙箱无宿主存储 API，本脚本代持 records，
 * 每次调用把快照注入 args.records，写入返回值由脚本写回——
 * 这正是真机宿主用「插件私有目录 + entries Surface 增量」承担的角色。
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const pluginDir = path.join(repo, 'plugin');

// 注意：abysssnare/axp 仓库根下还有一个内层 axp/（规范项目本体），
// 所以候选路径一律指向「仓库根/axp」这一层。
const candidates = [
  process.env.AXP_REPO,
  path.resolve(repo, '../axp/axp'),   // git clone … ../axp
  path.resolve(repo, './axp-src/axp'), // CI: checkout path=axp-src
  path.resolve(repo, './axp/axp'),   // checkout path=axp（仓库根同名目录会双层嵌套）
].filter(Boolean);
const axpRoot = candidates.find((p) => fs.existsSync(path.join(p, 'validator/src/validate.mjs')));
if (!axpRoot) {
  console.error('找不到 AXP 规范仓库。设置 AXP_REPO=<axp 仓库路径> 后重试。');
  process.exit(2);
}
console.log(`AXP repo: ${path.relative(repo, axpRoot) || axpRoot}`);

const require_ = createRequire(import.meta.url);
const { validate } = require_(path.join(axpRoot, 'validator/src/validate.mjs'));
const { AxpHost } = require_(path.join(axpRoot, 'runtime/src/host.mjs'));

const PLUGIN_ID = 'io.github.abysssnare.memory';
const SURFACE = 'axp://x/io.github.abysssnare.memory/entries';

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log(`  ✔ ${name}`); }
  else { fail++; console.error(`  ✖ ${name}  ${JSON.stringify(detail) ?? ''}`); }
}

/* ---------- 1. 校验器 ---------- */
console.log('[1] validator');
const v = validate(pluginDir);
ok('manifest ALL CHECKS PASSED', v.ok === true, v.errors);
ok('components 5/1/2/1/2', v.summary.tools === 5 && v.summary.surfaces === 1
  && v.summary.knowledge === 2 && v.summary.agents === 1 && v.summary.events === 2, v.summary);

/* ---------- 2. 九步装载 ---------- */
console.log('[2] load (9-step pipeline)');
const host = new AxpHost({ privileges: ['L0', 'L1', 'L2', 'L3'] });
const plugin = host.load(pluginDir);
ok('plugin loaded & registered', host.plugins.has(PLUGIN_ID));
ok('surface registered', host.surfaces.streams.has(SURFACE));
ok('initial full snapshot primed', host.audit.of('surface-publish').some((a) => a.type === 'full'));
ok('panel mounted with 7 nodes / 1 bind', plugin.ui.nodeIds.size === 7
  && host.audit.of('ui-mount').some((a) => a.binds === 1), plugin.ui.nodeIds);

/* ---------- 3. 函数式内核：write / read / search / stats / forget ---------- */
console.log('[3] tools — functional core');
const store = { records: [] };   // 宿主代持状态
const call = (toolId, args = {}, opts = {}) => host.invoke(PLUGIN_ID, toolId, { records: store.records, ...args }, opts);

const w1 = call('memory.write', { content: '用户偏好深色主题', tags: ['preference'], importance: 'high' });
ok('write returns full record', w1.ok === true && w1.result.ok === true
  && typeof w1.result.record.id === 'string' && w1.result.record.at > 0, w1);
store.records.push(w1.result.record);

const w2 = call('memory.write', { content: 'The validator ships 31 behavior tests', tags: ['fact', 'toolchain'] });
ok('default importance = normal', w2.result.record.importance === 'normal', w2);
store.records.push(w2.result.record);
const w3 = call('memory.write', { content: '会话安装通道是 session-install', tags: ['spec'] });
store.records.push(w3.result.record);

const rd = call('memory.read', { tag: 'preference' });
ok('read filters by tag', rd.result.count === 1 && rd.result.records[0].id === w1.result.record.id, rd);

const se = call('memory.search', { q: 'validator' });
ok('search matches content (case-insensitive)', se.result.count === 1 && se.result.matches[0].id === w2.result.record.id, se);

const st = call('memory.stats', {});
ok('stats counts 3 records with tag map', st.result.total === 3 && st.result.byImportance.high === 1, st);

const fg = call('memory.forget', { id: w2.result.record.id });
ok('forget is idempotent-ok', fg.ok === true && fg.result.removed === w2.result.record.id, fg);
store.records = store.records.filter((r) => r.id !== w2.result.record.id);

const st2 = call('memory.stats', {});
ok('stats reflects forget (total 2)', st2.result.total === 2, st2);

const bad = call('memory.write', { content: '' });
ok('empty content rejected by impl contract', bad.ok === true && bad.result.error === 'CONTENT_REQUIRED', bad);

/* ---------- 4. Surface 增量 → ui.bind / events ---------- */
console.log('[4] surface → ui.bind / events');
const bindBefore = host.audit.of('ui-bind-update').length;
const evtBefore = host.audit.of('event-fire').length;
const rendered = store.records.map((r) => `- [${r.importance}] ${r.content} (${r.tags.join('/')})`).join('\n');
const pub = host.publish(SURFACE, { type: 'delta', op: 'upsert', text: rendered, records: store.records });
ok('delta delivered to subscribers', pub.delivered > 0, pub);
ok('ui.bind updated from entries surface', host.audit.of('ui-bind-update').length > bindBefore);
ok('event fired on surface change', host.audit.of('event-fire').length > evtBefore);
ok('panel state carries rendered list', String(plugin.ui.state['list.text']).includes('用户偏好深色主题'), plugin.ui.state);

/* ---------- 5. ui.actions → tools ---------- */
console.log('[5] ui.actions → tools');
const a = host.action(PLUGIN_ID, 'ui.panel.write', { content: '面板按钮也能写入' });
ok('ui action reaches memory.write', a.ok === true && a.result.ok === true, a);
const s = host.action(PLUGIN_ID, 'ui.panel.stats', { records: store.records });
ok('ui action reaches memory.stats', s.ok === true && s.result.total === 2, s);

/* ---------- 6. 审计 ---------- */
console.log('[6] audit trail');
const kinds = new Set(host.audit.all().map((e) => e.kind));
for (const k of ['load-register', 'gradient', 'tool-call', 'surface-publish', 'ui-bind-update', 'event-fire'])
  ok(`audit has ${k}`, kinds.has(k));
const lastWrite = [...host.audit.of('tool-call')].reverse().find((t) => t.tool === 'memory.write');
ok('tool-call audit records layer L0', lastWrite?.layer === 'L0', lastWrite);

console.log(`\nDEMO · ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
console.log('ALL DEMO ASSERTIONS PASSED');
