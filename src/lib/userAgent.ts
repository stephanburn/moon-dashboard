// "Safari on iPhone" from a raw user-agent string, for the admin log. Rough on
// purpose: the full string is kept alongside for anything that needs it.
export function describeUserAgent(ua: string | null): string {
  if (!ua) return 'Unknown browser';
  const os =
    /iPhone/.test(ua) ? 'iPhone'
    : /iPad/.test(ua) ? 'iPad'
    : /Android/.test(ua) ? 'Android'
    : /Mac OS X|Macintosh/.test(ua) ? 'Mac'
    : /Windows/.test(ua) ? 'Windows'
    : /CrOS/.test(ua) ? 'ChromeOS'
    : /Linux/.test(ua) ? 'Linux'
    : null;
  // Order matters: Edge and Opera also say Chrome; Chrome also says Safari.
  const browser =
    /Discord/.test(ua) ? 'Discord'
    : /Edg\//.test(ua) ? 'Edge'
    : /OPR\//.test(ua) ? 'Opera'
    : /Firefox\/|FxiOS/.test(ua) ? 'Firefox'
    : /Chrome\/|CriOS/.test(ua) ? 'Chrome'
    : /Safari\//.test(ua) ? 'Safari'
    : null;
  if (browser && os) return `${browser} on ${os}`;
  return browser ?? os ?? 'Unknown browser';
}
