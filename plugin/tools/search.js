/** memory.search — 内容与标签的子串匹配（大小写不敏感）。 */
export function run(args) {
  const q = String(args.q || '').toLowerCase();
  const records = Array.isArray(args.records) ? args.records : [];
  if (!q) return { error: 'Q_REQUIRED' };
  const matches = records.filter((r) => {
    const c = String(r.content || '').toLowerCase();
    const t = (r.tags || []).map(String).join('\n').toLowerCase();
    return c.includes(q) || t.includes(q);
  });
  return { ok: true, matches, count: matches.length };
}
