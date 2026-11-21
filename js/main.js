/**
 * main.js — 应用入口
 *
 * 只做三件事：装配模块、绑定导航按钮、处理启动失败。
 * 业务逻辑都在 features/ 下，这里不写业务细节。
 */
import { setupCover } from './features/cover.js';
import { createPins } from './features/pins.js';
import { createWaypoint } from './features/waypoint.js';
import { createIndex } from './features/category-index.js';
import { config } from './config.js';
import { $ } from './core/dom.js';
import { onStorageChange, readString, writeString } from './core/storage.js';
import { toast } from './ui/toast.js';
import { createModal, anyModalOpen } from './ui/modal.js';
import { createCatalog } from './features/catalog.js';
import { createFavorites } from './features/favorites.js';
import { createSearch } from './features/search.js';
import { createRanking } from './features/ranking.js';
import { createQr } from './features/qr.js';
import { createTheme } from './features/theme.js';
import { createClock } from './features/clock.js';
import { fillAnnouncement, markAnnouncementSeen, shouldShowAnnouncement } from './features/announcement.js';

function showBootError(message) {
    const mount = $('#mainContent');
    window.__XN_BOOT_ERROR__ = String(message);
    if (!mount) return;
    mount.innerHTML = [
        '<div class="boot-error">',
        '<h3>页面初始化失败</h3>',
        '<p>', String(message), '</p>',
        '<p>如果是直接双击打开的本地文件，ES Module 会被浏览器的 CORS 策略拦住。',
        '请在项目根目录运行 <code>node server.mjs</code>，然后访问 ',
        '<code>http://127.0.0.1:5173/public-edition/index.html</code>。</p>',
        '</div>'
    ].join('');
}

function boot() {
    const mainContent = $('#mainContent');
    const searchInput = $('#searchInput');
    const noResult = $('#noResult');

    /** 弹窗控制器（统一处理遮罩点击 / Esc / 焦点归还） */
    const favoritesModal = createModal($('#favoritesModal'));
    const statsModal = createModal($('#statsModal'));
    const qrModal = createModal($('#qrModal'));
    const settingsModal = createModal($('#settingsModal'));
    const bulletin = $('#announcementModal');
    let activeCategory = '';

    const favorites = createFavorites({ body: $('#favoritesBody') });

    let catalog = null;
    let ranking = null;
    let search = null;
    let qr = null;

    catalog = createCatalog({
        mount: mainContent,
        noResult: noResult,
        isFavorite: favorites.has,
        onActivate: function (site) {
            if (ranking) ranking.track(site);
        },
        onToggleFavorite: function (site) {
            const added = favorites.toggle(site);
            catalog.setFavoriteState(site.url, added);
            toast(added ? '已添加到收藏夹' : '已从收藏夹移除', added ? 'success' : 'info');
        },
        onTogglePin(site) {
            toast(pins.toggle(site.url) ? '已置顶到首页' : '已取消首页置顶', 'info');
        },
        onShowQr: function (site) {
            qr.show(site);
        }
    });

    qr = createQr({
        modal: qrModal,
        name: $('#qrSiteName'),
        url: $('#qrSiteUrl'),
        canvas: $('#qrcode')
    });

    search = createSearch({
        input: searchInput,
        applyFilter: function (term) {
            const count = catalog.applyFilter(term, activeCategory);
            $('#resultCount').textContent = count + ' 个站点';
            return count;
        },
        onChangeHistory: function (history) {
            if (ranking) ranking.renderCloud(history);
        }
    });

    ranking = createRanking({
        list: $('#rankingList'),
        cloud: $('#searchCloud'),
        getHistory: function () {
            return search.history();
        }
    });

    setupCover();


    // 收藏变化 → 同步卡片上的红心，并重渲染收藏夹列表（含跨标签页）
    favorites.onChange(function () {
        catalog.syncFavoriteStates();
        favorites.render();
    });

    if (catalog.count === 0) {
        toast('站点数据为空，请检查 data/sites.js', 'error', 5000);
    }

    catalog.render();
    const pins = createPins(site => ranking.track(site), catalog.syncPins);
    createIndex($('#categoryIndex'), function (category) {
        activeCategory = category;
        $('#currentCategory').textContent = category || '资源目录';
        search.apply();
    });
    createWaypoint($('#destination'), $('#shuffleSite'), site => ranking.track(site));
    search.apply();
    if (navigator.platform.includes('Mac')) document.querySelector('kbd').textContent = '⌘ K';
    const compact = $('#compactCards');
    compact.checked = readString('atlasDensity', '') === 'compact';
    document.body.classList.toggle('compact', compact.checked);
    compact.addEventListener('change', () => {
        document.body.classList.toggle('compact', compact.checked);
        writeString('atlasDensity', compact.checked ? 'compact' : 'normal');
    });

    const theme = createTheme($('#themeToggle'));
    createClock({
        runtimeEl: $('#siteRuntime'),
        loadEl: $('#pageLoadTime'),
        gaokaoEl: $('#gaokaoCountdown')
    });

    // 导航按钮
    const refreshBtn = $('#refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function () {
            const icon = refreshBtn.querySelector('i');
            if (icon) icon.style.animation = 'spin 0.8s linear';
            window.setTimeout(function () {
                window.location.reload();
            }, 600);
        });
    }

    $('#favoritesBtn').addEventListener('click', function () {
        favorites.render();
        favoritesModal.open();
    });

    $('#statsBtn').addEventListener('click', function () {
        statsModal.open();
        ranking.refresh(search.history());
    });

    $('#settingsBtn').addEventListener('click', function () {
        settingsModal.open();
    });

    // 键盘：Ctrl/Cmd + K 聚焦搜索
    document.addEventListener('keydown', function (event) {
        if (!anyModalOpen() && !document.querySelector('dialog[open]') && (event.ctrlKey || event.metaKey) && String(event.key).toLowerCase() === 'k') {
            event.preventDefault();
            searchInput.focus();
            searchInput.select();
        }
    });

    // 公告：同一版本只弹一次
    if (shouldShowAnnouncement()) {
        fillAnnouncement($('#announcementBody'));
        bulletin.hidden = false;
        bulletin.classList.add('show');
        bulletin.addEventListener('click', event => {
            if (!event.target.closest('button')) return;
            bulletin.hidden = true;
            bulletin.classList.remove('show');
            markAnnouncementSeen();
        });
    }

    // 跨标签页同步
    onStorageChange(function (key) {
        if (key === 'favorites') favorites.reload();
        if (key === 'theme') theme.sync();
    });

    // 给冒烟测试 / 调试用
    window.__XN_READY__ = {
        version: config.version,
        sites: catalog.count,
        categories: document.querySelectorAll('.category').length,
        theme: readString('theme', 'light')
    };
    if (window.console) window.console.info('[xilian] boot ok', window.__XN_READY__);
}

function start() {
    try {
        boot();
    } catch (error) {
        if (window.console) window.console.error('[xilian] boot failed', error);
        showBootError(error && error.message ? error.message : error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
    start();
}
