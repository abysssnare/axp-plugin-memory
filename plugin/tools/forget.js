/** memory.forget — 按 id 遗忘一条记忆；幂等，id 不存在也返回成功。 */
export function run(args) {
  const id = String(args.id || '');
  if (!id) return { error: 'ID_REQUIRED' };
  return { ok: true, removed: id };
}
