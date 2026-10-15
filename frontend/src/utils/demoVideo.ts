// The homepage walkthrough video comes from VITE_DEMO_VIDEO_URL. Only links we know how to embed
// safely are accepted; anything else is treated as "no video configured".

export type DemoVideo = { kind: 'youtube'; embedUrl: string } | { kind: 'file'; src: string };

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const VIDEO_FILE = /\.(mp4|webm)$/i;

const youTubeId = (url: URL): string | null => {
  const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') id = url.pathname.slice(1);
  else if (host === 'youtube.com' && url.pathname === '/watch') id = url.searchParams.get('v');
  else if (host === 'youtube.com' && /^\/(embed|shorts)\//.test(url.pathname)) id = url.pathname.split('/')[2] ?? null;
  return id && YOUTUBE_ID.test(id) ? id : null;
};

export const parseDemoVideo = (raw: string | undefined): DemoVideo | null => {
  const value = raw?.trim();
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;

  const id = youTubeId(url);
  if (id) return { kind: 'youtube', embedUrl: `https://www.youtube-nocookie.com/embed/${id}` };
  if (VIDEO_FILE.test(url.pathname)) return { kind: 'file', src: url.href };
  return null;
};
