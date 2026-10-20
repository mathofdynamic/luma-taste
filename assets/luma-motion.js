/**
 * Luma motion runtime (framework-agnostic ES module, ~2 KB gzip). Adapt to the host project's architecture;
 * do NOT create a second competing reveal system if the project already has one.
 *
 *  - Entrance: [data-reveal-section] is the trigger boundary; its [data-reveal] children reveal once, in DOM order,
 *    each starting after duration/3 of the previous (CSS reads --lm-i). Elements with [data-motion-ignore] are skipped.
 *  - Loops: any [data-loop] gets data-in-view="true|false" so CSS runs the loop only while visible.
 *  - Surfaces: setSurfaceState(el, 'open' | 'closed') with a 66ms compact close and a bounded fallback timer.
 *  - Progressive: content is visible without JS. Hidden initial styles apply only after .lm-motion is added here.
 */
const REDUCED = '(prefers-reduced-motion: reduce)';

export function initLumaMotion(root = document) {
  const doc = root.ownerDocument || document;
  const html = doc.documentElement;
  const mq = window.matchMedia ? window.matchMedia(REDUCED) : { matches: false, addEventListener() {}, removeEventListener() {} };
  const cleanups = [];

  const revealed = new WeakSet();
  const items = (section) =>
    [...section.querySelectorAll('[data-reveal]')].filter((el) => !el.closest('[data-motion-ignore]'));

  const revealSection = (section) => {
    if (revealed.has(section)) return;
    revealed.add(section);
    const list = section.hasAttribute('data-reveal') ? [section, ...items(section)] : items(section);
    list.forEach((el, i) => {
      el.style.setProperty('--lm-i', String(i));
      el.setAttribute('data-revealed', 'true');
    });
  };
  const revealAll = () => root.querySelectorAll('[data-reveal-section], [data-reveal]').forEach((el) => {
    if (el.hasAttribute('data-reveal')) el.setAttribute('data-revealed', 'true');
    else revealSection(el);
  });

  // Loop gating: runs for reduced-motion users too, harmless (CSS disables the loops themselves).
  let loopIO = null;
  if ('IntersectionObserver' in window) {
    loopIO = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.setAttribute('data-in-view', e.isIntersecting ? 'true' : 'false')),
      { rootMargin: '80px 0px 80px 0px', threshold: 0 }
    );
    root.querySelectorAll('[data-loop]').forEach((el) => loopIO.observe(el));
    cleanups.push(() => loopIO.disconnect());
  }

  if (mq.matches || !('IntersectionObserver' in window)) {
    revealAll(); // reduced motion or no IO: content just appears
    return () => cleanups.forEach((fn) => fn());
  }

  html.classList.add('lm-motion');
  const safety = window.setTimeout(revealAll, 2500); // never leave content hidden if setup stalls
  cleanups.push(() => window.clearTimeout(safety));

  const units = [...root.querySelectorAll('[data-reveal-section]')];
  // standalone [data-reveal] elements outside any section are their own boundary
  const loose = [...root.querySelectorAll('[data-reveal]')].filter((el) => !el.closest('[data-reveal-section]') && !el.closest('[data-motion-ignore]'));
  const io = new IntersectionObserver(
    (entries) => {
      const hits = entries.filter((e) => e.isIntersecting).map((e) => e.target);
      hits.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)); // DOM order, not callback order
      hits.forEach((el) => { io.unobserve(el); revealSection(el); });
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
  );
  // double rAF: let the first paint settle before observing, so the first reveal is visible and flash-free
  const raf = requestAnimationFrame(() => requestAnimationFrame(() => {
    units.concat(loose).forEach((el) => io.observe(el));
  }));
  cleanups.push(() => { cancelAnimationFrame(raf); io.disconnect(); });

  const onChange = () => { if (mq.matches) { revealAll(); html.classList.remove('lm-motion'); } };
  mq.addEventListener && mq.addEventListener('change', onChange);
  cleanups.push(() => mq.removeEventListener && mq.removeEventListener('change', onChange));

  return () => cleanups.forEach((fn) => fn());
}

const surfaceTimers = new WeakMap();
/** state: 'open' | 'closed'. Closing animates 66ms, then settles to 'closed'. Reopening during close cancels the timer. */
export function setSurfaceState(el, state, { onClosed } = {}) {
  window.clearTimeout(surfaceTimers.get(el));
  if (state === 'open') {
    el.removeAttribute('inert'); el.setAttribute('aria-hidden', 'false');
    el.dataset.state = 'open';
    [...el.querySelectorAll('[data-surface-item]')].forEach((n, i) => n.style.setProperty('--lm-i', String(i)));
    return;
  }
  if (el.dataset.state !== 'open') return;
  el.dataset.state = 'closing';
  el.setAttribute('inert', ''); el.setAttribute('aria-hidden', 'true');
  const done = () => { el.dataset.state = 'closed'; onClosed && onClosed(); };
  const reduced = window.matchMedia && window.matchMedia(REDUCED).matches;
  surfaceTimers.set(el, window.setTimeout(done, reduced ? 60 : 66 + 34)); // bounded fallback; never rely on transitionend alone
}
