/**
 * announcement.js — 公告
 *
 * 原站每次刷新都弹一遍，关掉按钮也没有记忆。
 * 现在按 announcement.version 记忆：同一个版本只弹一次，改版本号就重新弹。
 * 关闭时由 main.js 注入的 modal onClose 回调写标记。
 */
import { announcement } from '../../data/announcement.js';
import { readString, writeString } from '../core/storage.js';

const KEY = 'announcementSeen';

export function shouldShowAnnouncement() {
    return readString(KEY, '') !== announcement.version;
}

export function fillAnnouncement(body) {
    if (body) body.innerHTML = announcement.html;
}

export function markAnnouncementSeen() {
    writeString(KEY, announcement.version);
}
