/**
 * modal.js — 统一的弹窗控制器
 *
 * 原站四个弹窗各自复制了一份「开关 + 点遮罩关闭 + Esc 关闭」的代码，
 * 这里收成一份：创建一次，拿到 { open, close, isOpen }。
 * 同时记录焦点，关闭后把焦点还给触发按钮（键盘用户不会迷路）。
 */
import { on } from '../core/dom.js';

const stack = [];

document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape' || stack.length === 0) return;
    event.preventDefault();
    stack[stack.length - 1].close();
});

export function createModal(root, options) {
    if (!root) throw new Error('createModal: 找不到弹窗节点');
    const settings = options || {};
    let lastFocused = null;

    const api = {
        root: root,
        isOpen: function () {
            return root.classList.contains('show');
        },
        open: function () {
            if (api.isOpen()) return;
            lastFocused = document.activeElement;
            root.classList.add('show');
            root.setAttribute('aria-hidden', 'false');
            stack.push(api);
            if (typeof settings.onOpen === 'function') settings.onOpen();
            const focusTarget = root.querySelector('[data-autofocus]') || root.querySelector('button');
            if (focusTarget && focusTarget.focus) focusTarget.focus({ preventScroll: true });
        },
        close: function () {
            if (!api.isOpen()) return;
            root.classList.remove('show');
            root.setAttribute('aria-hidden', 'true');
            const index = stack.indexOf(api);
            if (index !== -1) stack.splice(index, 1);
            if (lastFocused && lastFocused.focus) lastFocused.focus({ preventScroll: true });
            if (typeof settings.onClose === 'function') settings.onClose();
        }
    };

    // 点遮罩关闭
    on(root, 'click', function (event) {
        if (event.target === root) api.close();
    });

    // 所有带 data-modal-close 的按钮都能关
    const closers = root.querySelectorAll('[data-modal-close]');
    Array.prototype.forEach.call(closers, function (button) {
        on(button, 'click', function () {
            api.close();
        });
    });

    return api;
}

/** 某个弹窗当前是否打开（给跨模块判断用） */
export function anyModalOpen() {
    return stack.length > 0;
}
