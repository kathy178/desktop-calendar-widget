/** 极简的环境判断工具，避免额外引入 @electron-toolkit/utils 依赖 */
export const is = {
  dev: !process.env['NODE_ENV'] || process.env['NODE_ENV'] === 'development' || !!process.env['ELECTRON_RENDERER_URL']
}
