import { useEffect } from 'react';

/**
 * Scroll-reveal for the landing page.
 *
 * Finds every [data-reveal] descendant of `ref` and adds `.is-revealed` the
 * first time it scrolls into view. A single IntersectionObserver handles all
 * elements, and `unobserve` fires immediately so each element animates once.
 *
 * `data-reveal="up|left|right"` picks the direction; `--reveal-delay` (set via
 * the `style` prop) staggers siblings.
 *
 * Graceful degradation: if IntersectionObserver is unavailable, every element
 * is revealed up front rather than being left at opacity 0 forever.
 */
export default function useReveal(ref, { threshold = 0.15, rootMargin = '0px 0px -8% 0px' } = {}) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const nodes = Array.from(root.querySelectorAll('[data-reveal]'));
    if (!nodes.length) return;

    if (typeof IntersectionObserver === 'undefined') {
      nodes.forEach((n) => n.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin }
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [ref, threshold, rootMargin]);
}
