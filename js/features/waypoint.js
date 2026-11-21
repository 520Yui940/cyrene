import { sites } from '../../data/sites.js';

export function createWaypoint(link, shuffle, onVisit) {
    if (!sites.length) {
        link.parentElement.hidden = true;
        return;
    }
    let current = Math.floor(Math.random() * sites.length);
    function render() {
        const site = sites[current];
        link.href = site.url;
        link.textContent = site.title;
        link.title = site.desc + '（新标签页打开）';
    }
    shuffle.disabled = sites.length < 2;
    shuffle.addEventListener('click', () => {
        current = (current + 1 + Math.floor(Math.random() * (sites.length - 1))) % sites.length;
        render();
    });
    link.addEventListener('click', () => onVisit(sites[current]));
    render();
}
