/** True when `href` (path part only) is the page being viewed. */
export function isCurrentPath(pathname: string, href: string): boolean {
  if (!href || !href.startsWith('/')) return false
  const path = href.split(/[?#]/)[0] || '/'
  return path === pathname
}
