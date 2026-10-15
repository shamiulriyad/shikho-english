import { useState } from 'react';
import type { DemoVideo as DemoVideoSource } from '../../utils/demoVideo';

const TITLE = 'Shikho English walkthrough';

/**
 * Plays the configured walkthrough video (VITE_DEMO_VIDEO_URL); never invents one. YouTube loads only after
 * the visitor presses play, so the page doesn't load a third-party player up front.
 */
const DemoVideo = ({ video }: { video: DemoVideoSource }) => {
  const [playing, setPlaying] = useState(false);

  if (video.kind === 'file') {
    return (
      <video src={video.src} title={TITLE} controls preload="metadata" className="aspect-video w-full rounded-lg bg-brand-forest" />
    );
  }

  if (playing) {
    return (
      <iframe
        src={`${video.embedUrl}?autoplay=1`}
        title={TITLE}
        className="aspect-video w-full rounded-lg"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="on-dark group relative flex aspect-video w-full flex-col items-start justify-end overflow-hidden rounded-lg bg-brand-forest p-6 text-left text-brand-ivory sm:p-8"
    >
      <span aria-hidden="true" className="absolute left-6 top-6 flex items-center gap-1.5 sm:left-8 sm:top-8">
        <span className="h-[3px] w-10 rounded-full bg-brand-ivory" />
        <span className="h-1.5 w-1.5 rounded-full bg-brand-amber" />
      </span>
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand-amber text-brand-forest transition-transform group-hover:scale-105"
      >
        <svg viewBox="0 0 24 24" className="ml-1 h-8 w-8" fill="currentColor">
          <path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5Z" />
        </svg>
      </span>
      <span className="text-h3">Play the walkthrough</span>
      <span className="text-sm text-brand-ivory/80">Plays on YouTube</span>
    </button>
  );
};

export default DemoVideo;
