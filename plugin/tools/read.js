/** memory.read — 按 ids / tag 过滤记忆，支持 limit；records 由宿主状态层注入。 */
export function run(args) {
  const records = Array.isArray(args.records) ? args.records : [];
  let out = records;
  if (Array.isArray(args.ids) && args.ids.length) {
    const want = new Set(args.ids.map(String));
    out = out.filter((r) => want.has(r.id));
  }
  if (args.tag) out = out.filter((r) => (r.tags || []).includes(args.tag));
  if (args.limit) out = out.slice(0, args.limit);
  return { ok: true, records: out, count: out.length };
}
