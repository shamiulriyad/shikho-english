import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

// A hand-written, grammatically checked example. It is labelled as such on the page and never presented as
// live AI output. Keep the English and the Bangla accurate if you edit it.
const NOTES = [
  {
    phrase: 'has been reading',
    topicEn: 'Right form of verbs',
    topicBn: 'ক্রিয়ার সঠিক রূপ',
    title: 'Present perfect continuous',
    pattern: 'has / have + been + verb-ing',
    en: 'An action that started in the past and is still going on.',
    bn: 'অতীতে শুরু হয়ে এখনো চলছে এমন কাজ বোঝাতে present perfect continuous হয়।'
  },
  {
    phrase: 'an',
    topicEn: 'Articles',
    topicBn: 'আর্টিকেল',
    title: 'An before a vowel sound',
    pattern: 'an + vowel sound',
    en: '“English” begins with a vowel sound, so it takes an, not a.',
    bn: 'English শব্দটি স্বরধ্বনি দিয়ে শুরু, তাই এর আগে an বসে।'
  },
  {
    phrase: 'since',
    topicEn: 'Prepositions',
    topicBn: 'প্রিপজিশন',
    title: 'Since marks a starting point',
    pattern: 'since + point in time · for + length of time',
    en: '“This morning” is when the reading began, so we use since. For would need a length of time.',
    bn: 'কাজ শুরুর সময় বোঝাতে since, আর সময়ের দৈর্ঘ্য বোঝাতে for বসে।'
  }
] as const;

// The sentence, with the annotated phrases marked by note index
const SENTENCE: (string | number)[] = ['Rahim ', 0, ' ', 1, ' English newspaper ', 2, ' this morning.'];

const PANEL_ID = 'studio-note';

/**
 * The hero's signature visual: a sentence on a ruled khata page. Choosing a highlighted phrase (hover, tap,
 * focus or Enter) draws an annotation line to a note explaining the grammar in English and Bangla.
 */
const SentenceStudio = () => {
  const [active, setActive] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const phraseRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [path, setPath] = useState<{ d: string; start: [number, number]; end: [number, number] } | null>(null);
  const note = NOTES[active]!;

  // The annotation line runs from under the chosen phrase out to the page's margin, down the margin and
  // into the note, so it never crosses the writing (the way a teacher annotates a khata)
  const measure = useCallback(() => {
    const canvas = canvasRef.current;
    const phrase = phraseRefs.current[active];
    const panel = panelRef.current;
    if (!canvas || !phrase || !panel) return;
    const c = canvas.getBoundingClientRect();
    const rects = phrase.getClientRects();
    const r = rects[rects.length - 1] ?? phrase.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    if (r.width === 0) return;
    // Lines are 1.5em tall and the text box is ~1.21em, so the gap between lines is ~0.29em.
    // The line starts just under the phrase and runs sideways through the middle of that gap.
    const em = parseFloat(getComputedStyle(phrase).fontSize) || 16;
    const sx = r.left + r.width / 2 - c.left;
    const sy = r.bottom - c.top + 0.03 * em;
    const lane = r.bottom - c.top + 0.14 * em;
    const marginX = 22;
    const px = p.left - c.left;
    const py = p.top - c.top + 22;
    setPath({ d: `M ${sx} ${sy} V ${lane} H ${marginX} V ${py} H ${px}`, start: [sx, sy], end: [px, py] });
  }, [active]);

  useLayoutEffect(measure, [measure]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(canvas);
    // Web fonts change the sentence's width once they load
    void document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, [measure]);

  return (
    <figure className="relative">
      <div ref={canvasRef} className="khata relative overflow-hidden rounded-lg border border-line shadow-paper">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-white/90 px-5 py-3 pl-14">
          <p className="text-sm font-semibold text-brand-forest">Sentence Studio</p>
          <p className="rounded bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning">Example</p>
        </div>

        <div className="px-5 pb-8 pl-14 pt-9 sm:pr-8">
          <p className="mb-3 text-sm font-medium text-ink-muted">Choose a highlighted phrase</p>
          <p lang="en" className="khata-lines text-[clamp(1.55rem,3vw,2.35rem)] font-medium tracking-[-0.015em] text-brand-forest">
            {SENTENCE.map((part, index) => {
              if (typeof part === 'string') return <span key={index}>{part}</span>;
              const isActive = part === active;
              return (
                <button
                  key={index}
                  ref={(el) => {
                    phraseRefs.current[part] = el;
                  }}
                  type="button"
                  aria-pressed={isActive}
                  aria-controls={PANEL_ID}
                  onClick={() => setActive(part)}
                  onFocus={() => setActive(part)}
                  onMouseEnter={() => setActive(part)}
                  className={`relative inline rounded-sm px-0.5 transition-colors ${
                    isActive ? 'bg-brand-amber/25' : 'hover:bg-brand-amber/15'
                  }`}
                >
                  <span
                    className={`underline decoration-2 underline-offset-[0.2em] ${isActive ? 'decoration-brand-terracotta' : 'decoration-brand-amber'}`}
                  >
                    {NOTES[part]!.phrase}
                  </span>
                  <sup aria-hidden="true" className="ml-0.5 text-[0.42em] font-bold text-brand-terracotta">
                    {part + 1}
                  </sup>
                  <span className="sr-only">, grammar note {part + 1}</span>
                </button>
              );
            })}
            <span aria-hidden="true" className="ml-1 inline-block h-[0.9em] w-[2px] translate-y-[0.12em] animate-caret bg-brand-terracotta" />
          </p>
        </div>

        <div
          ref={panelRef}
          id={PANEL_ID}
          aria-live="polite"
          className="relative mx-5 mb-5 ml-14 rounded-md border border-line bg-white px-5 py-4 sm:mr-8"
        >
          <div key={active} className="animate-fade">
            <p className="text-sm font-semibold text-brand-terracotta">
              {active + 1} · {note.topicEn} <span aria-hidden="true">·</span> <span lang="bn">{note.topicBn}</span>
            </p>
            <p className="mt-1 text-h3 text-brand-forest">{note.title}</p>
            <p className="mt-2 inline-block rounded bg-info-soft px-2 py-1 text-sm font-semibold tracking-wide text-brand-forest" lang="en">
              {note.pattern}
            </p>
            <p className="mt-3 text-ink">{note.en}</p>
            <p className="mt-1 text-ink-muted" lang="bn">{note.bn}</p>
          </div>
        </div>

        {/* Annotation line from the chosen phrase to its note */}
        {path && (
          <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
            <g key={active} className="animate-fade">
              <path d={path.d} fill="none" className="stroke-brand-terracotta" strokeWidth={1.25} strokeDasharray="3 3" />
              <circle cx={path.start[0]} cy={path.start[1]} r={3} className="fill-brand-terracotta" />
              <circle cx={path.end[0]} cy={path.end[1]} r={3} className="fill-brand-terracotta" />
            </g>
          </svg>
        )}
      </div>
      <figcaption className="mt-3 text-sm text-ink-muted">
        An illustrative example written for this page, not a live AI result.
      </figcaption>
    </figure>
  );
};

export default SentenceStudio;
