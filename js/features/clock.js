/**
 * clock.js — 页脚三块时间：已运行、加载耗时、高考倒计时
 *
 * 原站开了两个 setInterval（运行时间 1 个、高考 1 个），还用了已废弃的
 * performance.timing。这里合并成一个每秒 tick，加载耗时优先用 PerformanceNavigationTiming。
 */
import { config } from '../config.js';

export function createClock(options) {
    const runtimeEl = options.runtimeEl;
    const loadEl = options.loadEl;
    const gaokaoEl = options.gaokaoEl;

    const launchTime = new Date(config.launchTime).getTime();
    const gaokaoTime = new Date(config.gaokaoTime).getTime();
    let timer = null;

    function tick() {
        const now = Date.now();

        if (runtimeEl && Number.isFinite(launchTime)) {
            const diff = Math.max(0, now - launchTime);
            const days = Math.floor(diff / 86400000);
            const hours = Math.floor(diff / 3600000) % 24;
            const minutes = Math.floor(diff / 60000) % 60;
            const seconds = Math.floor(diff / 1000) % 60;
            runtimeEl.innerHTML = '<i class="fas fa-clock"></i> 本站已运行: ' + days + '天 ' + hours + '小时 ' + minutes + '分钟 ' + seconds + '秒';
        }

        if (gaokaoEl && Number.isFinite(gaokaoTime)) {
            const left = gaokaoTime - now;
            if (left <= 0) {
                gaokaoEl.innerHTML = '<i class="fas fa-hourglass-half"></i> 高考加油！你已经上岸啦！';
            } else {
                const days = Math.floor(left / 86400000);
                const hours = Math.floor(left / 3600000) % 24;
                const minutes = Math.floor(left / 60000) % 60;
                const seconds = Math.floor(left / 1000) % 60;
                gaokaoEl.innerHTML = '<i class="fas fa-hourglass-half"></i> 高考倒计时: ' + days + '天 ' + hours + '小时 ' + minutes + '分钟 ' + seconds + '秒';
            }
        }
    }

    function renderLoadTime() {
        if (!loadEl) return;
        let ms = 0;
        try {
            const entries = window.performance.getEntriesByType ? window.performance.getEntriesByType('navigation') : [];
            if (entries && entries.length > 0 && entries[0].domContentLoadedEventEnd) {
                ms = Math.round(entries[0].domContentLoadedEventEnd);
            } else if (window.performance.timing) {
                ms = window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart;
            }
        } catch (error) {
            ms = 0;
        }
        loadEl.innerHTML = '<i class="fas fa-stopwatch"></i> 页面加载耗时: ' + ms + 'ms';
    }

    tick();
    timer = window.setInterval(tick, 1000);
    window.addEventListener('load', renderLoadTime, { once: true });
    if (document.readyState === 'complete') renderLoadTime();

    return {
        stop: function () {
            window.clearInterval(timer);
        },
        renderLoadTime: renderLoadTime
    };
}
