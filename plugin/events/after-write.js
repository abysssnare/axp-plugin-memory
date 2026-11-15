/** lifecycle/tool.after(memory.write)：写入完成后的审计钩子（参考宿主跳过生命周期事件，真机宿主触发）。 */
export function run(ev) {
  return { audited: true, tool: 'memory.write' };
}
