/** memory.stats — 记忆库统计：总数 / 标签分布 / 重要度分布。 */
export function run(args) {
  const records = Array.isArray(args.records) ? args.records : [];
  const byTag = {};
  const byImportance = { low: 0, normal: 0, high: 0 };
  for (const r of records) {
    for (const t of r.tags || []) byTag[t] = (byTag[t] || 0) + 1;
    const k = r.importance || 'normal';
    byImportance[k] = (byImportance[k] || 0) + 1;
  }
  return { ok: true, total: records.length, byTag, byImportance };
}
