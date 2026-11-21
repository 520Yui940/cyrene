/**
 * search.js — 搜索输入、历史记录
 *
 * 原站的问题：input 每敲一个字就把当前词存进搜索历史，
 * 搜 "github" 会留下 g / gi / git / gith ... 一串半成品，词云直接变成垃圾。
 * 现在只在「回车 / 失焦 / 停顿 900ms」时记录，并且去重、只留最近 20 条。
 */
import { config } from '../config.js';
import { debounce, on } from '../core/dom.js';
import { readJSON, writeJSON } from '../core/storage.js';

const KEY = 'searchHistory';

function normalize(raw) {
    if (!Array.isArray(raw)) return [];
    const seen = new Set();
    const list = [];
    raw.forEach(function (item) {
        if (typeof item !== 'string') return;
        const value = item.trim().toLowerCase();
        if (!value || seen.has(value)) return;
        seen.add(value);
        list.push(value);
    });
    return list.slice(-config.searchHistoryLimit);
}

export function createSearch(options) {
    const input = options.input;
    const applyFilter = options.applyFilter;
    const onChangeHistory = typeof options.onChangeHistory === 'function' ? options.onChangeHistory : function () {};
    let history = normalize(readJSON(KEY, []));

    function pushHistory(rawValue) {
        const value = String(rawValue || '').trim().toLowerCase();
        if (value.length < 2) return;
        if (history[history.length - 1] === value) return;
        const next = history.filter(function (item) {
            return item !== value;
        });
        next.push(value);
        while (next.length > config.searchHistoryLimit) next.shift();
        history = next;
        writeJSON(KEY, history);
        onChangeHistory(history);
    }

    const filterSoon = debounce(function () {
        applyFilter(input.value);
    }, config.searchDebounceMs);

    const saveIdle = debounce(function () {
        pushHistory(input.value);
    }, 900);

    on(input, 'input', function () {
        filterSoon();
        saveIdle();
    });

    on(input, 'keydown', function (event) {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        applyFilter(input.value);
        pushHistory(input.value);
    });

    on(input, 'blur', function () {
        pushHistory(input.value);
    });

    return {
        history: function () {
            return history.slice();
        },
        pushHistory: pushHistory,
        apply: function () {
            applyFilter(input.value);
        }
    };
}
