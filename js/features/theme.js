/**
 * theme.js — 明暗主题
 *
 * 原站：两个 class 手动增删 + 图标替换，逻辑散在 toggleTheme() 里；
 * 现在收敛成一个可复用的控制器，并且首屏主题由 index.html 里的内联脚本提前设置，避免闪白。
 */
import { readString, writeString } from '../core/storage.js';

const KEY = 'theme';
const SUN = '<i class="fas fa-sun"></i>';
const MOON = '<i class="fas fa-moon"></i>';

export function readTheme() {
    return readString(KEY, 'light') === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme, button) {
    const isDark = theme === 'dark';
    document.body.classList.toggle('dark-mode', isDark);
    document.body.classList.toggle('light-mode', !isDark);
    if (button) button.innerHTML = isDark ? SUN : MOON;
}

export function createTheme(button) {
    let current = readTheme();
    applyTheme(current, button);

    if (button) {
        button.addEventListener('click', function () {
            current = current === 'dark' ? 'light' : 'dark';
            writeString(KEY, current);
            applyTheme(current, button);
        });
    }

    return {
        get current() {
            return current;
        },
        /** 别的标签页切换主题后同步过来 */
        sync: function () {
            current = readTheme();
            applyTheme(current, button);
        }
    };
}
