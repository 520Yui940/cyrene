/**
 * dom.js — 零依赖 DOM 小工具
 *
 * 这里只放「任何页面都用得上」的东西，业务逻辑不要塞进来。
 */

export function $(selector, scope) {
    return (scope || document).querySelector(selector);
}

export function $$(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
}

const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/**
 * 把任意值转成可安全插入 innerHTML 的文本。
 * 原站直接把 title / url 拼进 innerHTML 和 onclick，标题里带引号就能注入脚本。
 */
export function escapeHtml(value) {
    return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, function (ch) {
        return ESCAPE_MAP[ch];
    });
}

/** 绑定事件，返回解绑函数 */
export function on(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    return function () {
        target.removeEventListener(type, handler, options);
    };
}

/** 事件委托：命中 selector 时回调 (event, matchedElement) */
export function delegate(scope, type, selector, handler) {
    return on(scope, type, function (event) {
        const matched = event.target && event.target.closest ? event.target.closest(selector) : null;
        if (matched && scope.contains(matched)) handler(event, matched);
    });
}

export function debounce(fn, wait) {
    let timer = null;
    return function () {
        const args = arguments;
        const self = this;
        window.clearTimeout(timer);
        timer = window.setTimeout(function () {
            fn.apply(self, args);
        }, wait);
    };
}

export function setHidden(element, hidden) {
    if (element) element.hidden = Boolean(hidden);
}

export function formatNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString('zh-CN') : '0';
}
