/**
 * stats-api.js — Cloudflare Worker 统计接口封装
 *
 * 原站直接 fetch，没有超时、没有响应校验，后端挂掉时统计弹窗会一直转圈。
 * 这里统一加 AbortController 超时 + 结构校验，失败就抛错，由上层决定降级。
 */
import { config } from '../config.js';

function request(path, options) {
    const controller = typeof window.AbortController === 'function' ? new window.AbortController() : null;
    const timer = window.setTimeout(function () {
        if (controller) controller.abort();
    }, config.apiTimeoutMs);

    const init = Object.assign({ method: 'GET', cache: 'no-store' }, options || {});
    if (controller) init.signal = controller.signal;

    return window.fetch(config.statsApiBase + path, init).then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status + ' ' + path);
        return response.text();
    }).then(function (text) {
        if (!text) return null;
        try {
            return JSON.parse(text);
        } catch (error) {
            throw new Error('响应不是合法 JSON: ' + path);
        }
    }).finally(function () {
        window.clearTimeout(timer);
    });
}

/** 上报一次点击：{ siteUrl, siteTitle } */
export function reportClick(site) {
    if (!config.statsApiBase) return Promise.resolve(null);
    return request('/api/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl: site.url, siteTitle: site.title })
    });
}

/** 拉取全局排行，返回 [{ title, clicks }] */
export function fetchRanking() {
    if (!config.statsApiBase) return Promise.resolve([]);
    return request('/api/ranking').then(function (data) {
        if (!Array.isArray(data)) throw new Error('排行数据格式异常');
        return data.filter(function (item) {
            return item && typeof item.clicks === 'number' && typeof item.title === 'string';
        }).map(function (item) {
            return { title: item.title, clicks: item.clicks };
        });
    });
}
