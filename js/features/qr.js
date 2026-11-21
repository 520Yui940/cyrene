/**
 * qr.js — 二维码弹窗
 *
 * 原站用 <script defer> 全局加载 qrcodejs；如果用户点得快，QRCode 还没就绪就会 ReferenceError。
 * 现在改成首次打开时按需加载（带超时），加载失败就显示提示，不影响其它功能。
 */
import { config } from '../config.js';

let libraryPromise = null;

function loadLibrary() {
    if (window.QRCode) return Promise.resolve(window.QRCode);
    if (libraryPromise) return libraryPromise;

    libraryPromise = new Promise(function (resolve, reject) {
        let settled = false;
        const script = document.createElement('script');

        function finish(error) {
            if (settled) return;
            settled = true;
            window.clearTimeout(timer);
            if (error) {
                reject(error);
                return;
            }
            if (window.QRCode) resolve(window.QRCode);
            else reject(new Error('二维码库未注册 QRCode 全局变量'));
        }

        const timer = window.setTimeout(function () {
            finish(new Error('二维码库加载超时'));
        }, config.qrcodeTimeoutMs);

        script.src = config.qrcodeLibraryUrl;
        script.async = true;
        script.onload = function () {
            finish(null);
        };
        script.onerror = function () {
            finish(new Error('二维码库加载失败'));
        };
        document.head.appendChild(script);
    });

    return libraryPromise;
}

export function createQr(options) {
    const modal = options.modal;
    const nameEl = options.name;
    const urlEl = options.url;
    const canvasEl = options.canvas;

    function show(site) {
        if (!modal || !canvasEl) return;
        if (nameEl) nameEl.textContent = site.title;
        if (urlEl) urlEl.textContent = site.url;
        canvasEl.innerHTML = '<span class="qr-fallback">正在加载二维码组件…</span>';
        modal.open();

        loadLibrary().then(function (QRCode) {
            try {
                canvasEl.innerHTML = '';
                new QRCode(canvasEl, {
                    text: site.url,
                    width: 200,
                    height: 200,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });
            } catch (error) {
                canvasEl.innerHTML = '<span class="qr-fallback">二维码生成失败，请直接访问上方网址</span>';
            }
        }).catch(function (error) {
            canvasEl.innerHTML = '<span class="qr-fallback">' + error.message + '，请直接访问上方网址</span>';
        });
    }

    return { show: show };
}
