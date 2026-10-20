import 'server-only';

export type GeoInfo = {
  ip: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
};

type HeaderLike = { get(name: string): string | null };

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Resolve the client's IP and approximate location from request headers.
 *
 * Geo headers are injected by the hosting edge:
 *  - Vercel: x-vercel-ip-country / -country-region / -city
 *  - Cloudflare: cf-ipcountry
 * In Next.js 15 App Router route handlers there is NO `request.geo`, which is
 * why location was always empty before — we must read these headers instead.
 */
export function extractGeo(headers: HeaderLike): GeoInfo {
  const forwardedFor = headers.get('x-forwarded-for');
  const ip =
    forwardedFor?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    null;

  const country =
    headers.get('x-vercel-ip-country') ||
    headers.get('cf-ipcountry') ||
    null;

  const region = headers.get('x-vercel-ip-country-region') || null;

  const cityRaw = headers.get('x-vercel-ip-city') || null;
  const city = cityRaw ? safeDecode(cityRaw) : null;

  return { ip, country, region, city };
}

export function getClientIp(headers: HeaderLike): string | null {
  return extractGeo(headers).ip;
}
