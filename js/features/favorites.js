/**
 * favorites.js — 收藏夹（本地存储）
 *
 * 存储格式与原站完全一致（数组，元素含 url/title/icon/addedDate），老用户的收藏不会丢。
 * 渲染时会用 sites.js 里的最新标题/图标覆盖旧值，改站点名字后收藏夹不会出现旧名字。
 */
import { delegate, escapeHtml } from '../core/dom.js';
import { readJSON, writeJSON } from '../core/storage.js';
import { sitesByUrl } from '../../data/sites.js';

const KEY = 'favorites';

function normalize(raw) {
    if (!Array.isArray(raw)) return [];
    const seen = new Set();
    const list = [];
    raw.forEach(function (item) {
        // 目录里已经删掉的站点不再保留，避免收藏夹里留下点不开的死条目
        if (!item || typeof item.url !== 'string' || !sitesByUrl.has(item.url)) return;
        if (seen.has(item.url)) return;
        seen.add(item.url);
        list.push({
            url: item.url,
            title: typeof item.title === 'string' && item.title ? item.title : item.url,
            icon: typeof item.icon === 'string' ? item.icon : '',
            addedDate: typeof item.addedDate === 'string' ? item.addedDate : ''
        });
    });
    return list;
}

function itemMarkup(item) {
    const site = sitesByUrl.get(item.url);
    const title = site ? site.title : item.title;
    const icon = site && site.icon ? site.icon : item.icon;
    return [
        '<div class="favorite-item" data-url="', escapeHtml(item.url), '">',
        '<div class="site-icon">',
        icon ? '<i class="' + escapeHtml(icon) + '"></i>' : '<i class="fas fa-globe"></i>',
        '</div>',
        '<div class="favorite-info">',
        '<div class="favorite-name">', escapeHtml(title), '</div>',
        '<div class="favorite-url">', escapeHtml(item.url), '</div>',
        '</div>',
        '<button type="button" class="remove-favorite" data-action="remove"',
        ' title="移除收藏" aria-label="移除收藏 ', escapeHtml(title), '">',
        '<i class="fas fa-times"></i></button>',
        '</div>'
    ].join('');
}

export function createFavorites(options) {
    const body = options.body;
    const listeners = [];
    let items = normalize(readJSON(KEY, []));

    function emit() {
        listeners.forEach(function (fn) {
            fn(items);
        });
    }

    function persist() {
        writeJSON(KEY, items);
    }

    const api = {
        list: function () {
            return items.slice();
        },
        has: function (url) {
            return items.some(function (item) {
                return item.url === url;
            });
        },
        toggle: function (site) {
            if (api.has(site.url)) {
                api.remove(site.url);
                return false;
            }
            items = items.concat([{
                url: site.url,
                title: site.title,
                icon: site.icon || '',
                addedDate: new Date().toISOString()
            }]);
            persist();
            emit();
            return true;
        },
        remove: function (url) {
            const next = items.filter(function (item) {
                return item.url !== url;
            });
            if (next.length === items.length) return false;
            items = next;
            persist();
            emit();
            return true;
        },
        render: function () {
            if (items.length === 0) {
                body.innerHTML = [
                    '<div class="empty-favorites">',
                    '<i class="fas fa-heart-broken"></i>',
                    '<p>还没有收藏任何网站</p>',
                    '</div>'
                ].join('');
                return;
            }
            body.innerHTML = '<div class="favorites-grid">' + items.map(itemMarkup).join('') + '</div>';
        },
        reload: function () {
            items = normalize(readJSON(KEY, []));
            emit();
        },
        onChange: function (fn) {
            listeners.push(fn);
        }
    };

    delegate(body, 'click', '[data-action="remove"]', function (event, button) {
        event.preventDefault();
        event.stopPropagation();
        const row = button.closest('.favorite-item');
        if (row) api.remove(row.getAttribute('data-url'));
    });

    delegate(body, 'click', '.favorite-item', function (event, row) {
        if (event.target.closest('[data-action="remove"]')) return;
        const url = row.getAttribute('data-url');
        if (url) window.open(url, '_blank', 'noopener');
    });

    return api;
}
