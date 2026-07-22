/**
 * The backend returns image paths as server-relative strings (e.g.
 * "/uploads/abc.png"), which React Native's <Image> can't resolve on its
 * own — unlike a browser, there's no "current origin" to resolve against.
 * Prefix them with the API's base URL to get a loadable absolute URL.
 */
export function resolveImageUrl(baseUrl: string, path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return `${baseUrl}${path}`;
}
