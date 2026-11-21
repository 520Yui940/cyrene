/**
 * config.js — 站点级配置
 *
 * 想改「已运行天数」的起点、高考日期、后端地址，只改这里，别去翻业务代码。
 * 原站这些值是散落在 900 行脚本里的字面量。
 */
export const config = {
    siteName: '昔涟导航',
    version: 'v1.0.8',

    /** 页脚「本站已运行」的起点（保持原站本地时间语义，不加时区偏移） */
    launchTime: '2025-10-23T02:52:00',

    /** 高考倒计时目标时间 */
    gaokaoTime: '2026-06-07T09:00:00',

    /**
     * Cloudflare Worker 统计后端。留空即完全关闭远端统计（本地排行仍然可用）。
     *
     * 默认留空，三个理由：
     * 1. workers.dev 的子域是账户级的，会被 Cloudflare 按账户标识生成，
     *    写进前端就等于把那个标识公开摆在每个访客的 Network 面板里；
     * 2. 界面上的 3 秒防刷可以绕过，公开接口没有鉴权，谁都能往里灌数据；
     * 3. 后端不可达时，统计弹窗要多等一次超时。
     * 真要接：填自己的地址，并在 Worker 侧做限流 + Origin 白名单。
     */
    statsApiBase: '',

    /** 统计接口超时（毫秒）。原站没有超时，后端挂了会一直转圈 */
    apiTimeoutMs: 4000,

    /** 同一个站点两次点击上报的最小间隔（防刷） */
    clickCooldownMs: 3000,

    /** 搜索输入防抖 */
    searchDebounceMs: 120,

    /** 搜索历史最多保留多少条 */
    searchHistoryLimit: 20,

    /** 二维码库 CDN（首次点二维码时才加载） */
    qrcodeLibraryUrl: 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js',
    qrcodeTimeoutMs: 8000
};
