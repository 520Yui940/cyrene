/**
 * ranking.js — 点击统计、热门排行、搜索词云
 *
 * 与原站的差别：
 * - 点击后不再弹「点击已记录」的提示（每点一次弹一次，很吵），失败也只是静默回退本地；
 * - 排行接口有超时，超时/后端挂掉时直接显示本地排行，不会卡在「正在加载」；
 * - 打开统计弹窗时先渲染本地数据，远端数据到了再替换，首屏不用干等。
 */
import { config } from '../config.js';
import { escapeHtml, formatNumber } from '../core/dom.js';
import { readJSON, readString, writeJSON, writeString } from '../core/storage.js';
import { sites } from '../../data/sites.js';
import { fetchRanking, reportClick } from '../services/stats-api.js';

const CLICKS_KEY = 'siteClicks';
const TOP_N = 10;

function titleMarkup(text, color) {
    return '<p style="text-align:center; color:' + color + '; margin-bottom:16px; font-weight:600;">' + escapeHtml(text) + '</p>';
}

function rowMarkup(index, title, count, numberColor, textColor, prefix) {
    return [
        '<div class="ranking-item">',
        '<div class="ranking-number" style="background:', numberColor, '">', index + 1, '</div>',
        '<div class="ranking-info">',
        '<div class="ranking-name">', escapeHtml(title), '</div>',
        '<div class="ranking-count" style="color:', textColor, '">', prefix, ' ', formatNumber(count), ' 次点击</div>',
        '</div>',
        '</div>'
    ].join('');
}

export function createRanking(options) {
    const listEl = options.list;
    const cloudEl = options.cloud;
    const getHistory = typeof options.getHistory === 'function' ? options.getHistory : function () { return []; };

    let clicks = readJSON(CLICKS_KEY, {});
    if (!clicks || typeof clicks !== 'object' || Array.isArray(clicks)) clicks = {};

    function persistClicks() {
        writeJSON(CLICKS_KEY, clicks);
    }

    /** 本地排行：数据源是 sites.js，点击数来自 localStorage */
    function renderLocal() {
        if (!listEl) return;
        const ranked = sites.map(function (site) {
            return { title: site.title, clicks: Number(clicks[site.url]) || 0 };
        }).sort(function (a, b) {
            return b.clicks - a.clicks;
        }).slice(0, TOP_N);

        const html = [titleMarkup('📱 本地热门排行', '#999')];
        ranked.forEach(function (item, index) {
            html.push(rowMarkup(index, item.title, item.clicks, '#999', '#999', '📱'));
        });
        listEl.innerHTML = html.join('');
    }

    /** 远端排行：Worker 返回的 [{ title, clicks }] */
    function renderRemote(list) {
        if (!listEl) return;
        const top = list.slice(0, TOP_N);
        const html = [titleMarkup('🌍 全用户热门排行 TOP ' + Math.min(list.length, TOP_N), 'var(--main-color)')];
        top.forEach(function (item, index) {
            const isTop3 = index < 3;
            html.push(rowMarkup(index, item.title, item.clicks, isTop3 ? 'var(--main-color)' : '#999', isTop3 ? 'var(--main-color)' : '#999', '🔥'));
        });
        listEl.innerHTML = html.join('');
    }

    function renderCloud(history) {
        if (!cloudEl) return;
        const source = Array.isArray(history) ? history : getHistory();
        const counter = new Map();

        source.forEach(function (term) {
            String(term).toLowerCase().split(/\s+/).forEach(function (word) {
                if (word.length > 1) counter.set(word, (counter.get(word) || 0) + 1);
            });
        });

        const sorted = Array.from(counter.entries()).sort(function (a, b) {
            return b[1] - a[1];
        }).slice(0, 20);

        if (sorted.length === 0) {
            cloudEl.innerHTML = '<p style="text-align:center; color:#666;">暂无搜索记录</p>';
            return;
        }

        const max = sorted[0][1];
        cloudEl.innerHTML = sorted.map(function (entry) {
            const size = (0.8 + (entry[1] / max) * 0.6).toFixed(2);
            return '<span class="search-tag" style="font-size:' + size + 'rem" title="搜索 ' + entry[1] + ' 次">' + escapeHtml(entry[0]) + '</span>';
        }).join('');
    }

    /** 记录一次点击：本地立即 +1，远端上报失败也不影响使用 */
    function track(site) {
        if (!site) return Promise.resolve(false);
        const key = 'lastClick:' + site.url;
        const last = Number(readString(key, '0')) || 0;
        if (Date.now() - last < config.clickCooldownMs) return Promise.resolve(false);
        writeString(key, String(Date.now()));

        clicks[site.url] = (Number(clicks[site.url]) || 0) + 1;
        persistClicks();

        if (!config.statsApiBase) return Promise.resolve(false);
        return reportClick(site).then(function () {
            return true;
        }).catch(function (error) {
            if (window.console) window.console.info('[stats] 远端统计不可用，已记在本地：' + error.message);
            return false;
        });
    }

    async function refresh(history) {
        renderLocal();
        renderCloud(history);
        if (!config.statsApiBase) return;
        try {
            const list = await fetchRanking();
            if (list && list.length > 0) renderRemote(list);
        } catch (error) {
            if (window.console) window.console.info('[stats] 排行接口不可用，使用本地排行：' + error.message);
        }
    }

    return {
        track: track,
        refresh: refresh,
        renderLocal: renderLocal,
        renderRemote: renderRemote,
        renderCloud: renderCloud
    };
}
