/**
 * Finds a wide, freely licensed photo of an artist on Wikimedia Commons, for use as a page banner.
 *
 *   Spotify artist ID ──(Wikidata P1902 "Spotify artist ID")──▶ Wikidata item Q…
 *     ├─ P18 main image → its uncropped original is the best candidate (same photo, wider)
 *     └─ Commons files tagged "depicts (P180) = Q…" → photos verified to show this exact person
 *
 * File names alone are NOT trusted (a category can hold "Hans Zimmer's Piano" or an ad still), so
 * only the main image and "depicts"-tagged photos are eligible. Solo shots rank above group shots.
 *
 * Only images with a free license (CC0 / public domain / CC BY / CC BY-SA) that are landscape and ≥1600px wide
 * are accepted. Returns null when there's no confident match — better no photo than the wrong one.
 * Server-only (Wikimedia asks API clients to send a descriptive User-Agent, which browsers can't set).
 */

const USER_AGENT = 'Unwrapped/1.0 (https://spotify-unwrapped-nine.vercel.app)';
const TIMEOUT_MS = 5000;
const MIN_WIDTH = 1600;
const MIN_RATIO = 1.3;
const MAX_RATIO = 3;
const THUMB_WIDTH = 1920;

export interface CommonsBanner {
  url: string;
  width: number;
  height: number;
  /** Commons file page (where license and author details live). */
  pageUrl: string;
  author: string;
  license: string;
  licenseUrl: string | null;
}

interface ImageInfo {
  title: string;
  mime: string;
  width: number;
  height: number;
  thumburl?: string;
  url: string;
  descriptionurl: string;
  extmetadata?: Record<string, { value?: string }>;
}

const getJson = async (url: string): Promise<any> => {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Api-User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

const commonsApi = (params: Record<string, string>) =>
  getJson(
    `https://commons.wikimedia.org/w/api.php?${new URLSearchParams({
      action: 'query',
      format: 'json',
      prop: 'imageinfo',
      iiprop: 'url|size|mime|extmetadata',
      iiurlwidth: String(THUMB_WIDTH),
      ...params,
    })}`
  );

const stripHtml = (html = '') =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

/** Free licenses only; Commons shouldn't host anything else, but check anyway. */
const isFreeLicense = (license: string, meta: Record<string, { value?: string }>) =>
  !meta.NonFree?.value &&
  /^(cc0|cc[ -]by(-sa)?([ -]\d(\.\d)?)?|public domain|pd\b)/i.test(license.trim());

const GOOD_WORDS = /\b(concert|live|performing|performance|perform|tour|festival|stage|show|gig|in concert)\b/i;
/** Tagged photos that still make poor banners (objects/places associated with the artist). */
const BAD_WORDS =
  /\b(star|walk of fame|signature|autograph|logo|poster|album|cover|grave|plaque|stamp|ticket|map|building|house|mural|statue|wax|sign|billboard|screenshot|piano)\b/i;
/** File names suggesting several people — still the artist, but prefer solo shots. */
const GROUP_HINT = /\b(and|with|feat|ft)\b|&/i;

/** Base score per source: uncropped main image 100, main image 80, depicts-tagged 60. */
function score(file: ImageInfo, base: number): number {
  const name = file.title.replace(/^File:/, '').replace(/\.[a-z]+$/i, '');
  if (BAD_WORDS.test(name)) return -1;
  let s = base;
  if (GOOD_WORDS.test(name)) s += 15;
  if (GROUP_HINT.test(name)) s -= 15;
  s += Math.min(file.width / 1000, 6); // mild preference for higher resolution
  return s;
}

function toBanner(file: ImageInfo): CommonsBanner | null {
  const meta = file.extmetadata ?? {};
  const license = stripHtml(meta.LicenseShortName?.value);
  if (!license || !isFreeLicense(license, meta)) return null;
  return {
    url: file.thumburl ?? file.url,
    width: file.width,
    height: file.height,
    pageUrl: file.descriptionurl,
    author: stripHtml(meta.Artist?.value).slice(0, 80) || 'Unknown author',
    license,
    licenseUrl: meta.LicenseUrl?.value ?? null,
  };
}

const usable = (f: ImageInfo) =>
  /^image\/(jpeg|png|webp)$/.test(f.mime) &&
  f.width >= MIN_WIDTH &&
  f.width / f.height >= MIN_RATIO &&
  f.width / f.height <= MAX_RATIO;

export async function findCommonsBanner(spotifyArtistId: string): Promise<CommonsBanner | null> {
  // 1. Spotify artist ID → Wikidata item
  const search = await getJson(
    `https://www.wikidata.org/w/api.php?${new URLSearchParams({
      action: 'query',
      list: 'search',
      srsearch: `haswbstatement:P1902=${spotifyArtistId}`,
      srlimit: '1',
      format: 'json',
    })}`
  );
  const qid: string | undefined = search?.query?.search?.[0]?.title;
  if (!qid || !/^Q\d+$/.test(qid)) return null;

  // 2. Main image(s)
  const entity = await getJson(
    `https://www.wikidata.org/w/api.php?${new URLSearchParams({
      action: 'wbgetentities',
      ids: qid,
      props: 'claims',
      format: 'json',
    })}`
  );
  const claims = entity?.entities?.[qid]?.claims ?? {};
  const mainImages: string[] = (claims.P18 ?? []).map((c: any) => c?.mainsnak?.datavalue?.value).filter(Boolean);

  // Uncropped originals of the main image rank highest, then the main image itself.
  const base = new Map<string, number>();
  for (const file of mainImages) {
    const original = file.replace(/\s*\(cropped\)/gi, '');
    if (original !== file) base.set(`File:${original}`, 100);
    base.set(`File:${file}`, 80);
  }

  // 3. Image details for the main image(s), and for photos tagged as depicting this person (in parallel).
  const [direct, depicts] = await Promise.all([
    base.size ? commonsApi({ titles: Array.from(base.keys()).join('|') }).catch(() => null) : null,
    commonsApi({
      generator: 'search',
      gsrsearch: `haswbstatement:P180=${qid} filetype:bitmap`,
      gsrnamespace: '6',
      gsrlimit: '50',
    }).catch(() => null),
  ]);

  const files = new Map<string, ImageInfo>();
  for (const [result, fallbackBase] of [
    [direct, 0],
    [depicts, 60],
  ] as const) {
    for (const page of Object.values<any>(result?.query?.pages ?? {})) {
      const info = page?.imageinfo?.[0];
      if (!info || !page.title) continue;
      files.set(page.title, { title: page.title, ...info });
      if (!base.has(page.title) && fallbackBase) base.set(page.title, fallbackBase);
    }
  }

  const ranked = Array.from(files.values())
    .filter(usable)
    .map(file => ({ file, score: score(file, base.get(file.title) ?? 0) }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);

  for (const { file } of ranked) {
    const banner = toBanner(file);
    if (banner) return banner;
  }
  return null;
}
