/**
 * catalog.js — 分类区块 + 站点卡片的渲染 / 过滤 / 收藏态
 *
 * 相比原站的三处改动：
 * 1. 不再用内联 onclick（原写法 title 里带单引号就能注入脚本），改成事件委托；
 * 2. 收藏时只改对应按钮的 class/图标，不整页重渲染（原站每次收藏要把 88 张卡重新插一遍，
 *    favicon 会闪、滚动位置也会抖）；
 * 3. 搜索过滤用 hidden 属性，分类块全空时整块隐藏。
 */
import { categories } from '../../data/categories.js';
import { sites, sitesByUrl } from '../../data/sites.js';
import { $$, delegate, escapeHtml } from '../core/dom.js';

const GLOBE_ICON = '<i class="fas fa-globe"></i>';

function hostnameOf(url) {
    try {
        return new URL(url).hostname;
    } catch (error) {
        return '';
    }
}

function iconMarkup(site) {
    if (site.icon) return '<i class="' + escapeHtml(site.icon) + '"></i>';
    const host = hostnameOf(site.url);
    if (!host) return GLOBE_ICON;
    return '<img src="https://' + escapeHtml(host) + '/favicon.ico" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">';
}

function heartIcon(active) {
    return '<i class="' + (active ? 'fas' : 'far') + ' fa-heart"></i>';
}

function cardMarkup(site, isFavorite) {
    const searchKey = (site.title + ' ' + site.desc + ' ' + site.url).toLowerCase();
    return [
        '<a class="site-card" href="', escapeHtml(site.url), '" target="_blank" rel="noopener noreferrer"',
        ' data-url="', escapeHtml(site.url), '"',
        ' data-search="', escapeHtml(searchKey), '">',
        '<div class="site-card-actions">',
        '<button type="button" class="action-btn favorite', isFavorite ? ' active' : '', '" data-action="favorite"',
        ' title="收藏" aria-pressed="', isFavorite ? 'true' : 'false', '"',
        ' aria-label="收藏 ', escapeHtml(site.title), '">', heartIcon(isFavorite), '</button>',
        '<button type="button" class="action-btn pin" data-action="pin" aria-pressed="false" title="置顶到首页" aria-label="置顶 ', escapeHtml(site.title), '"><i class="fas fa-thumbtack"></i></button>',
        '<button type="button" class="action-btn qrcode" data-action="qrcode"',
        ' title="二维码" aria-label="生成 ', escapeHtml(site.title), ' 的二维码">',
        '<i class="fas fa-qrcode"></i></button>',
        '</div>',
        '<div class="site-icon">', iconMarkup(site), '</div>',
        '<div class="site-name">', escapeHtml(site.title), '</div>',
        '<div class="site-desc">', escapeHtml(site.desc), '</div>',
        '<small class="domain">', escapeHtml(hostnameOf(site.url).replace(/^www\./, '')), '</small>',
        '</a>'
    ].join('');
}

function sectionMarkup(meta, list, isFavorite) {
    return [
        '<section class="category glass-container" data-category="', escapeHtml(meta.name), '">',
        '<h2 class="category-title"><i class="', escapeHtml(meta.icon), '"></i> ', escapeHtml(meta.name), ' <small>', list.length, '</small></h2>',
        '<div class="sites-grid">',
        list.map(function (site) {
            return cardMarkup(site, isFavorite(site.url));
        }).join(''),
        '</div>',
        '</section>'
    ].join('');
}

export function createCatalog(options) {
    const settings = options || {};
    const mount = settings.mount;
    const isFavorite = typeof settings.isFavorite === 'function' ? settings.isFavorite : function () { return false; };
    const onActivate = typeof settings.onActivate === 'function' ? settings.onActivate : function () {};
    const onToggleFavorite = typeof settings.onToggleFavorite === 'function' ? settings.onToggleFavorite : function () {};
    const onShowQr = typeof settings.onShowQr === 'function' ? settings.onShowQr : function () {};
    const noResult = settings.noResult || null;

    const cardByUrl = new Map();
    const groups = categories.map(function (meta) {
        return { meta: meta, list: [] };
    });
    const groupByName = new Map(groups.map(function (group) {
        return [group.meta.name, group];
    }));
    const orphans = [];

    sites.forEach(function (site) {
        const group = groupByName.get(site.category);
        if (group) group.list.push(site);
        else orphans.push(site);
    });

    if (orphans.length > 0 && window.console) {
        window.console.warn('[catalog] 有站点用了未登记的分类，已归到「未分类」：', orphans.map(function (site) {
            return site.title;
        }));
    }

    function indexCards() {
        cardByUrl.clear();
        $$('.site-card', mount).forEach(function (card) {
            cardByUrl.set(card.getAttribute('data-url'), card);
        });
    }

    function render() {
        const blocks = groups.filter(function (group) {
            return group.list.length > 0;
        }).map(function (group) {
            return sectionMarkup(group.meta, group.list, isFavorite);
        });

        if (orphans.length > 0) {
            blocks.push(sectionMarkup({ name: '未分类', icon: 'fas fa-folder-open' }, orphans, isFavorite));
        }

        mount.innerHTML = blocks.join('');
        indexCards();
    }

    /** 关键词过滤，返回命中的卡片数 */
    function applyFilter(term, category = '') {
        const keyword = String(term || '').trim().toLowerCase();
        let visible = 0;

        cardByUrl.forEach(function (card) {
            const key = card.getAttribute('data-search') || '';
            const hit = (!category || card.closest('.category').dataset.category === category) && key.includes(keyword);
            card.hidden = !hit;
            if (hit) {
                visible += 1;

            }
        });

        $$('.category', mount).forEach(function (section) {
            const hasVisibleCard = section.querySelector('.site-card:not([hidden])') !== null;
            section.hidden = !hasVisibleCard;
        });

        if (noResult) noResult.hidden = visible !== 0;
        return visible;
    }

    /** 单个站点的收藏态（不重渲染） */
    function setFavoriteState(url, active) {
        const card = cardByUrl.get(url);
        if (!card) return;
        const button = card.querySelector('.action-btn.favorite');
        if (!button) return;
        button.classList.toggle('active', Boolean(active));
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
        button.innerHTML = heartIcon(Boolean(active));
    }

    /** 全量同步收藏态（跨标签页 / 收藏夹里删除后） */
    function syncFavoriteStates() {
        cardByUrl.forEach(function (card, url) {
            setFavoriteState(url, isFavorite(url));
        });
    }

    // favicon 加载失败时退回 Font Awesome 地球图标（error 不冒泡，必须捕获阶段监听）
    mount.addEventListener('error', function (event) {
        const target = event.target;
        if (!target || target.tagName !== 'IMG') return;
        const holder = target.parentNode;
        if (holder) holder.innerHTML = GLOBE_ICON;
    }, true);

    // 卡片内按钮：收藏 / 二维码
    delegate(mount, 'click', '.action-btn', function (event, button) {
        event.preventDefault();
        event.stopPropagation();
        const card = button.closest('.site-card');
        if (!card) return;
        const site = sitesByUrl.get(card.getAttribute('data-url'));
        if (!site) return;
        if (button.getAttribute('data-action') === 'favorite') onToggleFavorite(site);
        else if (button.dataset.action === 'pin') settings.onTogglePin(site);
        else onShowQr(site);
    });

    // 卡片本体：只做点击计数，跳转交给 <a> 的默认行为
    delegate(mount, 'click', '.site-card', function (event, card) {
        if (event.target.closest('.action-btn')) return;
        const site = sitesByUrl.get(card.getAttribute('data-url'));
        if (site) onActivate(site);
    });

    return {
        syncPins(pins) {
            for (const [url, card] of cardByUrl) {
                const button = card.querySelector('.pin');
                const pinned = pins.has(url);
                button.setAttribute('aria-pressed', String(pinned));
                button.title = pinned ? '取消首页置顶' : '置顶到首页';
                button.setAttribute('aria-label', button.title + ' ' + sitesByUrl.get(url).title);
            }
        },
        render: render,
        applyFilter: applyFilter,
        setFavoriteState: setFavoriteState,
        syncFavoriteStates: syncFavoriteStates,
        count: sites.length
    };
}
