import { $ } from '../core/dom.js';

export function setupCover() {
    const scene = $('.cover-scroll');
    const cover = $('.hero');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let pending = false;
    const clamp = value => Math.min(1, Math.max(0, value));
    function update() {
        pending = false;
        const progress = clamp(-scene.getBoundingClientRect().top / scene.offsetHeight);
        cover.style.setProperty('--hold', (motion.matches ? 0 : Math.min(progress, .30) * scene.offsetHeight) + 'px');
        cover.style.setProperty('--title-opacity', 1 - clamp(progress / .26));
        cover.style.setProperty('--face-opacity', 1 - clamp((progress - .22) / .69));
        cover.style.setProperty('--drift', (motion.matches ? 0 : progress * 36) + 'px');
        cover.inert = progress >= .97;
    }
    function schedule() {
        if (pending) return;
        pending = true;
        requestAnimationFrame(update);
    }
    window.addEventListener('scroll', schedule, {passive: true});
    window.addEventListener('resize', schedule);
    motion.addEventListener('change', schedule);
    update();

    const art = $('#artDialog');
    const zoom = $('#artZoom');
    function setZoom(active) {
        art.classList.toggle('magnified', active);
        zoom.setAttribute('aria-pressed', String(active));
        zoom.textContent = active ? '查看全图' : '放大细看';
        const stage = $('.lightbox-stage', art);
        stage.scrollLeft = (stage.scrollWidth - stage.clientWidth) / 2;
        stage.scrollTop = (stage.scrollHeight - stage.clientHeight) / 3;
    }
    $('.view-art').addEventListener('click', event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        art.showModal();
        setZoom(false);
    });
    zoom.addEventListener('click', () => setZoom(!art.classList.contains('magnified')));
}
