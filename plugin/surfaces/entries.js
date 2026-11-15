/**
 * Surface 提供者 — subscribe(emit) 约定。
 * 装载时 emit 一次初始 full 快照（本沙箱无状态，由宿主合并真实记忆）；
 * 之后的增量（写入 / 遗忘）由宿主 publish，本实现返回退订回调。
 */
export function subscribe(emit) {
  emit({ type: 'full', op: 'reset', records: [] });
  return () => { /* 退订：参考实现无后台线程，无需清理 */ };
}
