import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiCall } from '../../utils/api';
import { loginPath } from '../../utils/returnTo';
import { ApiErrorNotice } from '../ui/States';
import SectionIntro, { twoDigits } from './SectionIntro';
import type { Topic } from '../../types/api';

const PLACEHOLDER_ROWS = 10;

/**
 * Section D: "Find your next step." The real topics from GET /topics, set like a book's contents page
 * (সূচিপত্র). No counts, ratings or progress are invented.
 */
const TopicIndex = () => {
  const { user, token } = useAuth();
  const signedIn = Boolean(user && token);
  const [topics, setTopics] = useState<Topic[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setError(null);
    apiCall<Topic[]>('/topics')
      .then((data) => {
        if (active) setTopics(data.filter((topic) => topic.code !== 'other'));
      })
      .catch((err: unknown) => {
        if (active) setError(err);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  return (
    <section aria-labelledby="topics-heading" className="border-y border-line bg-white px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionIntro
            id="topics-heading"
            number={4}
            kicker={<>Contents · <span lang="bn">সূচিপত্র</span></>}
            title="Find your next step."
            intro="The grammar topics you can ask about. Pick one and start with a question from it."
          />
          <Link to="/topics" className="font-semibold text-brand-forest underline decoration-brand-amber decoration-2 underline-offset-4 hover:text-brand-terracotta">
            See all topics
          </Link>
        </div>

        <div className="mt-12">
          {error !== null && (
            <ApiErrorNotice error={error} title="We couldn’t load the topics" onRetry={() => setAttempt((n) => n + 1)} />
          )}

          {/* Same shape while loading, so nothing jumps when the list arrives */}
          {topics === null && error === null && (
            <ul aria-hidden="true" className="grid border-t border-line md:grid-cols-2 md:gap-x-12">
              {Array.from({ length: PLACEHOLDER_ROWS }, (_, index) => (
                <li key={index} className="flex h-[4.5rem] items-center gap-5 border-b border-line">
                  <span className="h-4 w-6 rounded bg-paper" />
                  <span className="h-4 w-40 rounded bg-paper" />
                </li>
              ))}
            </ul>
          )}

          {topics && topics.length > 0 && (
            <ol className="grid border-t border-line md:grid-cols-2 md:gap-x-12">
              {topics.map((topic, index) => {
                const target = `/analyze?topic=${encodeURIComponent(topic.code)}`;
                return (
                  <li key={topic.code} className="border-b border-line">
                    <Link
                      to={signedIn ? target : loginPath(target)}
                      className="group flex min-h-[4.5rem] items-center gap-5 py-3 transition-colors hover:bg-paper"
                    >
                      <span className="w-6 shrink-0 text-sm font-semibold tabular-nums text-brand-terracotta">{twoDigits(index + 1)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-brand-forest">{topic.nameEn}</span>
                        <span className="block text-ink-muted" lang="bn">{topic.nameBn}</span>
                      </span>
                      <span
                        aria-hidden="true"
                        className="pr-2 text-brand-terracotta transition-transform group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
};

export default TopicIndex;
