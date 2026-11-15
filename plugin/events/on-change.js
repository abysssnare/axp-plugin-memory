/** 记忆库变化事件：宿主 publish 增量后触发（filter 由清单声明）。 */
export function run(ev) {
  const d = ev.delta || {};
  return { audited: true, op: d.op, type: d.type };
}
