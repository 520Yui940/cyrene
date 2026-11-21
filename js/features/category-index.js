import { categories } from '../../data/categories.js';
import { sites } from '../../data/sites.js';

export function createIndex(nav, select) {
    const items = [{name: '', icon: 'fas fa-border-all'}, ...categories];
    for (const {name, icon} of items) {
        const button = document.createElement('button');
        button.type = 'button';
        const glyph = document.createElement('i');
        glyph.className = icon;
        const label = document.createElement('span');
        label.textContent = name || '全部站点';
        const count = document.createElement('small');
        count.textContent = name ? sites.filter(site => site.category === name).length : sites.length;
        button.append(glyph, label, count);
        button.setAttribute('aria-pressed', String(!name));
        button.addEventListener('click', () => {
            for (const item of nav.children) item.setAttribute('aria-pressed', String(item === button));
            select(name);
            if (document.querySelector('.directory-head').getBoundingClientRect().top < 0)
                document.querySelector('.directory-head').scrollIntoView({block: 'start'});
        });
        nav.append(button);
    }
}
