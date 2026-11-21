/**
 * toast.js — 右上角轻提示
 *
 * 视觉沿用原站 .notification（位置、圆角、滑入动画都在 feedback.css 里），
 * 这里只负责创建、自动消失、点击关闭和颜色。
 */
import { on } from '../core/dom.js';

const COLORS = { success: '#4CAF50', error: '#f44336', info: '#2196F3' };
const DEFAULT_DURATION = 2800;

export function toast(message, type, duration) {
    const kind = COLORS[type] ? type : 'info';
    const node = document.createElement('div');
    node.className = 'notification';
    node.setAttribute('role', 'status');
    node.style.background = COLORS[kind];
    node.textContent = message;
    document.body.appendChild(node);

    let removed = false;
    const remove = function () {
        if (removed) return;
        removed = true;
        node.classList.add('is-leaving');
        window.setTimeout(function () {
            if (node.parentNode) node.parentNode.removeChild(node);
        }, 300);
    };

    const timer = window.setTimeout(remove, duration || DEFAULT_DURATION);
    on(node, 'click', function () {
        window.clearTimeout(timer);
        remove();
    });
    return remove;
}
