/**
 * 生成本地唯一 ID。
 *
 * 没有用 nanoid：nanoid 5.x 起只发布 ESM 格式，而 electron-vite 默认把主进程/preload
 * 编译成 CommonJS，并且用 externalizeDepsPlugin 把 node_modules 依赖原样 require() 引入
 * （不参与打包转换）。这会导致运行时报错：
 *   Error [ERR_REQUIRE_ESM]: require() of ES Module .../nanoid/index.js not supported
 * 这里自己写一个足够用的 ID 生成器：时间戳 + 两段随机字符串拼接，
 * 对于"单机本地待办/备忘录"这种场景，唯一性和长度都完全够用，
 * 也不需要 nanoid 那种密码学级别的随机性，同时彻底避免 ESM/CJS 兼容性问题。
 */
export function genId(): string {
  const time = Date.now().toString(36)
  const randomA = Math.random().toString(36).slice(2, 10)
  const randomB = Math.random().toString(36).slice(2, 10)
  return `${time}-${randomA}${randomB}`
}
