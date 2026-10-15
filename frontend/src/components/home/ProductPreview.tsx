import { parseDemoVideo } from '../../utils/demoVideo';
import AnalysisResult from '../AnalysisResult';
import DemoVideo from './DemoVideo';
import SectionIntro from './SectionIntro';
import type { QuestionAnalysis } from '../../types/api';

// Sample content shown in the real explanation component. Labelled as a sample on the page.
const SAMPLE: QuestionAnalysis = {
  id: 0,
  topic: { code: 'articles', nameEn: 'Articles', nameBn: 'আর্টিকেল' },
  questionText: 'Fill in the blank with a suitable article: She is ___ honest girl.',
  correctAnswer: 'an',
  steps: [
    { en: 'Look at the word after the blank: honest.', bn: 'শূন্যস্থানের পরের শব্দটি দেখো: honest।' },
    { en: 'The h in honest is silent, so the word begins with a vowel sound.', bn: 'honest শব্দের h উচ্চারিত হয় না, তাই শব্দটি স্বরধ্বনি দিয়ে শুরু হয়।' },
    { en: 'Use an before a vowel sound.', bn: 'স্বরধ্বনির আগে an বসে।' }
  ],
  rule: {
    en: 'Use an before a word that begins with a vowel sound, even when its first letter is a consonant (an hour, an honest man).',
    bn: 'যে শব্দের উচ্চারণ স্বরধ্বনি দিয়ে শুরু হয়, তার আগে an বসে, প্রথম অক্ষর ব্যঞ্জনবর্ণ হলেও (an hour, an honest man)।'
  },
  commonMistakes: [{ en: 'Writing “a honest” because honest starts with the letter h.', bn: 'honest শব্দটি h দিয়ে শুরু বলে “a honest” লেখা।' }],
  studentAnswer: null,
  createdAt: '2026-01-01T00:00:00Z'
};

/**
 * Section E: how Shikho English looks in use. With VITE_DEMO_VIDEO_URL set it shows the walkthrough video;
 * otherwise it shows the real explanation screen with a sample question, and says plainly that the video
 * isn't available yet.
 */
const ProductPreview = () => {
  const video = parseDemoVideo(import.meta.env.VITE_DEMO_VIDEO_URL);

  return (
    <section aria-labelledby="preview-heading" className="px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto grid max-w-page items-start gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
        <div className="lg:sticky lg:top-10">
          <SectionIntro
            id="preview-heading"
            number={5}
            kicker="Product preview"
            title={video ? 'Watch how it works.' : 'See the real screen.'}
            intro={
              video
                ? 'A short walkthrough of analysing a question, reading the explanation and practising.'
                : 'This is the actual explanation screen you get after analysing a question, filled with a sample. Switch the language to read it in বাংলা.'
            }
          />
          {!video && (
            <p className="mt-6 inline-flex items-center gap-2 rounded border border-line bg-white px-3 py-1.5 text-sm text-ink-muted">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-brand-amber" />
              Video walkthrough: coming soon
            </p>
          )}
        </div>

        {video ? (
          <DemoVideo video={video} />
        ) : (
          <div>
            <p className="mb-3 text-sm font-semibold text-ink-muted">Sample · the real explanation component</p>
            <AnalysisResult analysis={SAMPLE} />
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductPreview;
