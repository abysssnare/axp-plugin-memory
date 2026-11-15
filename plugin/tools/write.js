/**
 * memory.write — 生成一条完整记忆记录。
 *
 * 参考运行时的 T1 沙箱没有宿主存储 API（无 fs / 无跨调用全局），
 * 因此实现采用「函数式内核」：本工具只负责把输入规整成记录并返回，
 * 真实宿主把返回值写入插件私有存储（axp://fs 私有目录，L1 fs.write:app 声明）。
 * id 由内容指纹 + 时间戳构成，同一毫秒内不同内容不冲突。
 */
export function run(args) {
  const content = String(args.content || '').trim();
  if (!content) return { error: 'CONTENT_REQUIRED' };
  const tags = Array.isArray(args.tags) ? args.tags.map(String) : [];
  const importance = ['low', 'normal', 'high'].includes(args.importance) ? args.importance : 'normal';
  let h = 0;
  for (let i = 0; i < content.length; i++) h = ((h * 31) + content.charCodeAt(i)) >>> 0;
  const at = Date.now();
  const id = 'm' + h.toString(36) + '-' + at.toString(36);
  return { ok: true, record: { id, content, tags, importance, at } };
}
