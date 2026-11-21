/**
 * storage.js — localStorage 的薄封装
 *
 * 设计要点：
 * 1. 沿用原站 key（theme / favorites / siteClicks / searchHistory），老访客的收藏和计数不丢。
 * 2. 隐私模式或禁用存储时退回内存实现，页面不至于直接报错。
 * 3. JSON 解析失败会清掉脏数据并返回默认值，避免一条坏记录让整页崩掉。
 */
import { on } from './dom.js';

/**
 * key 前缀：默认空字符串，即沿用原站的裸 key（老访客的收藏与计数不会丢）。
 * scripts/build.mjs 生成公开版时会把它替换成 'xilian.public.'，
 * 这样公开版和开发版落在同一个 origin 下也不会互相覆盖。
 */
const KEY_PREFIX = 'xilian.public.';
const memory = new Map();
let backend = null;
let probed = false;

function probe() {
    if (probed) return backend;
    probed = true;
    try {
        const probeKey = '__xilian_probe__';
        window.localStorage.setItem(probeKey, '1');
        window.localStorage.removeItem(probeKey);
        backend = window.localStorage;
    } catch (error) {
        backend = null;
        if (window.console) window.console.info('[storage] localStorage 不可用，已退回内存存储');
    }
    return backend;
}

export function storageAvailable() {
    return probe() !== null;
}

export function readString(key, fallback) {
    const store = probe();
    const empty = fallback === undefined ? null : fallback;
    if (!store) return memory.has(KEY_PREFIX + key) ? memory.get(KEY_PREFIX + key) : empty;
    try {
        const value = store.getItem(KEY_PREFIX + key);
        return value === null ? empty : value;
    } catch (error) {
        return empty;
    }
}

export function writeString(key, value) {
    const store = probe();
    if (!store) {
        memory.set(KEY_PREFIX + key, String(value));
        return true;
    }
    try {
        store.setItem(KEY_PREFIX + key, String(value));
        return true;
    } catch (error) {
        // 配额满 / 隐私模式受限，退回内存，别把交互打断
        memory.set(KEY_PREFIX + key, String(value));
        return false;
    }
}

export function readJSON(key, fallback) {
    const raw = readString(key, null);
    if (raw === null || raw === '') return fallback;
    try {
        const parsed = JSON.parse(raw);
        return parsed === null || parsed === undefined ? fallback : parsed;
    } catch (error) {
        if (window.console) window.console.warn('[storage] 数据损坏，已重置 key=' + key);
        writeString(key, '');
        return fallback;
    }
}

export function writeJSON(key, value) {
    try {
        return writeString(key, JSON.stringify(value));
    } catch (error) {
        return false;
    }
}

export function remove(key) {
    const store = probe();
    if (!store) {
        memory.delete(KEY_PREFIX + key);
        return;
    }
    try {
        store.removeItem(KEY_PREFIX + key);
    } catch (error) {
        memory.delete(KEY_PREFIX + key);
    }
}

/** 别的标签页改了数据时通知一下，用于跨标签页同步收藏/主题 */
export function onStorageChange(callback) {
    return on(window, 'storage', function (event) {
        // 对外回调去掉前缀，业务模块始终看到 'favorites' 这种裸 key
        const bare = event.key && event.key.indexOf(KEY_PREFIX) === 0
            ? event.key.slice(KEY_PREFIX.length)
            : event.key;
        callback(bare, event.newValue);
    });
}
