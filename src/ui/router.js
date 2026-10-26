/**
 * روتر ساده و بی‌وابستگی بر پایه‌ی hash
 * مسیرها به شکل «#/village» هستند و نام صفحه را برمی‌گردانند.
 */
export const DEFAULT_ROUTE = 'village';

/** hash را به { name, params } تبدیل می‌کند. */
export function parseRoute(hash = '') {
  const clean = String(hash).replace(/^#\/?/, '').split('?')[0].trim();
  const name = clean || DEFAULT_ROUTE;
  const params = Object.fromEntries(new URLSearchParams(String(hash).split('?')[1] || ''));
  return { name, params };
}

/** آدرس hash برای یک صفحه. */
export function routeHref(name) {
  return `#/${name}`;
}

/**
 * روتر را روی window نصب می‌کند.
 * @param {{known: string[], fallback?: string, onChange: (route: {name: string, params: object}) => void}} config
 */
export function createRouter({ known, fallback = DEFAULT_ROUTE, onChange }) {
  const resolve = () => {
    const route = parseRoute(window.location.hash);
    if (!known.includes(route.name)) route.name = fallback;
    return route;
  };

  const handle = () => onChange(resolve());
  window.addEventListener('hashchange', handle);
  handle();

  return {
    go(name) {
      if (window.location.hash === routeHref(name)) handle();
      else window.location.hash = routeHref(name);
    },
    current: resolve,
    destroy() {
      window.removeEventListener('hashchange', handle);
    },
  };
}
