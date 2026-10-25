/**
 * Luma motion runtime (framework-agnostic ES module, ~2 KB gzip). Adapt to the host project's architecture;
 * do NOT create a second competing reveal system if the project already has one.
 *
 *  - Entrance (Luma timing, motion-system.md section 4): every [data-reveal] element reveals once when IT scrolls
 *    into view (15% visible, bottom root margin -10%). Elements already on screen when the runtime boots are
 *    marked revealed without animation; only elements below the viewport are staged hidden (data-revealed="false"),
 *    so a reveal never blinks (visible -> hidden -> animated). Entries arriving together reveal in DOM order with
 *    a 70ms stagger (CSS reads --lm-i, capped at 6). [data-motion-ignore] opts out.
 *  - Loops: any [data-loop] gets data-in-view="true|false" so CSS runs the loop only while visible.
 *  - Surfaces: setSurfaceState(el, 'open' | 'closed') with a 160ms compact close and a bounded fallback timer.
 *  - Progressive: content is visible without JS. Hidden initial styles apply only to elements this runtime staged.
 */
const REDUCED = '(prefers-reduced-motion: reduce)';
const MAX_STAGGER_INDEX = 6;

export function initLumaMotion(root = document) {
  const doc = root.ownerDocument || document;
  const html = doc.documentElement;
  const mq = window.matchMedia ? window.matchMedia(REDUCED) : { matches: false, addEventListener() {}, removeEventListener() {} };
  const cleanups = [];

  const targets = () => [...root.querySelectorAll('[data-reveal]')].filter((el) => !el.closest('[data-motion-ignore]'));
  const reveal = (el, i = 0) => {
    el.style.setProperty('--lm-i', String(Math.min(i, MAX_STAGGER_INDEX)));
    el.setAttribute('data-revealed', 'true');
  };
  const revealAll = () => targets().forEach((el) => { el.style.removeProperty('--lm-i'); el.setAttribute('data-revealed', 'true'); });

  // Loop gating: runs for reduced-motion users too, harmless (CSS disables the loops themselves).
  let loopIO = null;
  if ('IntersectionObserver' in window) {
    loopIO = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.setAttribute('data-in-view', e.isIntersecting ? 'true' : 'false')),
      { rootMargin: '0px', threshold: 0 } // strict: a loop never runs outside the viewport
    );
    root.querySelectorAll('[data-loop]').forEach((el) => loopIO.observe(el));
    cleanups.push(() => loopIO.disconnect());
  }

  if (mq.matches || !('IntersectionObserver' in window)) {
    revealAll(); // reduced motion or no IO: content just appears
    return () => cleanups.forEach((fn) => fn());
  }

  // Stage: on-screen elements stay visible (no animation), below-the-fold elements are hidden until they enter.
  const vh = window.innerHeight;
  const staged = [];
  targets().forEach((el) => {
    if (el.hasAttribute('data-revealed')) return;
    const r = el.getBoundingClientRect();
    if (r.top < vh && r.bottom > 0) el.setAttribute('data-revealed', 'true');
    else { el.setAttribute('data-revealed', 'false'); staged.push(el); }
  });
  html.classList.add('lm-motion');

  const io = new IntersectionObserver(
    (entries) => {
      const hits = entries.filter((e) => e.isIntersecting).map((e) => e.target);
      hits.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)); // DOM order, not callback order
      hits.forEach((el, i) => { io.unobserve(el); reveal(el, i); });
    },
    { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
  );
  staged.forEach((el) => io.observe(el));
  cleanups.push(() => io.disconnect());

  // The shrunken root margin never reaches the last elements of a short tail (a footer): once the page
  // cannot scroll further, reveal what is on screen. Without this, the footer stays invisible forever.
  const tail = () => {
    if (innerHeight + scrollY < document.documentElement.scrollHeight - 2) return;
    staged.filter((el) => el.getAttribute('data-revealed') === 'false' && el.getBoundingClientRect().top < innerHeight)
      .forEach((el, i) => { io.unobserve(el); reveal(el, i); });
  };
  addEventListener('scroll', tail, { passive: true });
  cleanups.push(() => removeEventListener('scroll', tail));

  // Elements scrolled past without ever intersecting (anchor jumps) reveal when the user scrolls back; nothing
  // is permanently hidden because the observer keeps watching them until they intersect.

  const onChange = () => { if (mq.matches) { revealAll(); html.classList.remove('lm-motion'); } };
  mq.addEventListener && mq.addEventListener('change', onChange);
  cleanups.push(() => mq.removeEventListener && mq.removeEventListener('change', onChange));

  return () => cleanups.forEach((fn) => fn());
}

const surfaceTimers = new WeakMap();
/** state: 'open' | 'closed'. Closing animates 160ms, then settles to 'closed'. Reopening during close cancels the timer. */
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
  surfaceTimers.set(el, window.setTimeout(done, reduced ? 60 : 160 + 40)); // bounded fallback; never rely on transitionend alone
}
