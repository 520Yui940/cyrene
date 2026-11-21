import { sites, sitesByUrl } from '../../data/sites.js';
import { $, escapeHtml } from '../core/dom.js';
import { onStorageChange, readJSON, writeJSON } from '../core/storage.js';

const key = 'xilianPinnedSites';
function readPins() {
    const value = readJSON(key, []);
    return Array.isArray(value) ? [...new Set(value.filter(url => sitesByUrl.has(url)))] : [];
}

export function createPins(onVisit, onChange) {
    const dialog = $('#pinDialog');
    const order = $('#pinOrder');
    const options = $('#pinOptions');
    const links = $('#pinLinks');
    const editor = $('#editPins');
    const search = $('#pinSearch');
    let dragged = '';

    function render() {
        const pins = readPins();
        links.innerHTML = pins.map(url => {
            const site = sitesByUrl.get(url);
            return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer"><i class="${escapeHtml(site.icon)}"></i>${escapeHtml(site.title)}</a>`;
        }).join('');
        onChange(new Set(pins));
        editor.textContent = pins.length ? '管理常用' : '＋ 添加常用';
        if (!dialog.open) return;
        $('#pinOrderSection').hidden = !pins.length;
        order.innerHTML = pins.map((url, index) => {
            const name = escapeHtml(sitesByUrl.get(url).title);
            return `<div class="pin-row" draggable="true" data-url="${escapeHtml(url)}"><i class="fas fa-grip-vertical"></i><strong>${name}</strong>
                <button data-step="-1" aria-label="前移 ${name}" ${index === 0 ? 'disabled' : ''}>↑</button>
                <button data-step="1" aria-label="后移 ${name}" ${index === pins.length - 1 ? 'disabled' : ''}>↓</button>
                <button data-step="remove" aria-label="取消置顶 ${name}">×</button></div>`;
        }).join('');
        const term = search.value.trim().toLowerCase();
        const matches = sites.filter(site => (site.title + ' ' + site.url).toLowerCase().includes(term));
        options.innerHTML = matches.map(site => `<label><input type="checkbox" value="${escapeHtml(site.url)}" ${pins.includes(site.url) ? 'checked' : ''}>
            <span>${escapeHtml(site.title)}<small>${escapeHtml(new URL(site.url).hostname)}</small></span></label>`).join('') || '<p>没有找到这个站点。</p>';
    }
    function save(pins) {
        writeJSON(key, pins);
        render();
    }
    function move(pins, from, to) {
        if (from < 0 || to < 0 || to >= pins.length || from === to) return;
        pins.splice(to, 0, pins.splice(from, 1)[0]);
        save(pins);
    }
    editor.addEventListener('click', () => {
        search.value = '';
        dialog.showModal();
        render();
        search.focus({preventScroll: true});
    });
    links.addEventListener('click', event => {
        const link = event.target.closest('a');
        if (link) onVisit(sitesByUrl.get(link.getAttribute('href')));
    });
    search.addEventListener('input', render);
    options.addEventListener('change', event => {
        const input = event.target;
        const pins = readPins().filter(url => url !== input.value);
        if (input.checked) pins.push(input.value);
        save(pins);
        options.querySelector('input[value="' + CSS.escape(input.value) + '"]')?.focus({preventScroll: true});
    });
    order.addEventListener('click', event => {
        const button = event.target.closest('button');
        if (!button) return;
        const pins = readPins();
        const url = button.closest('.pin-row').dataset.url;
        if (button.dataset.step === 'remove') {
            save(pins.filter(item => item !== url));
            search.focus({preventScroll: true});
            return;
        }
        const from = pins.indexOf(url);
        move(pins, from, from + Number(button.dataset.step));
        const row = order.querySelector('[data-url="' + CSS.escape(url) + '"]');
        (row?.querySelector('[data-step="' + button.dataset.step + '"]:enabled') || row?.querySelector('button:enabled'))?.focus();
    });
    order.addEventListener('dragstart', event => {
        dragged = event.target.closest('.pin-row')?.dataset.url || '';
        event.dataTransfer.setData('text/plain', dragged);
        event.dataTransfer.effectAllowed = 'move';
    });
    order.addEventListener('dragover', event => {
        if (dragged) event.preventDefault();
    });
    order.addEventListener('drop', event => {
        event.preventDefault();
        const pins = readPins();
        move(pins, pins.indexOf(dragged), pins.indexOf(event.target.closest('.pin-row')?.dataset.url));
        dragged = '';
    });
    order.addEventListener('dragend', () => { dragged = ''; });
    dialog.addEventListener('close', () => editor.focus({preventScroll: true}));
    onStorageChange(changed => { if (changed === key || changed === null) render(); });
    render();
    return {
        toggle(url) {
            const pins = readPins();
            const add = !pins.includes(url);
            save(add ? [...pins, url] : pins.filter(item => item !== url));
            return add;
        }
    };
}
