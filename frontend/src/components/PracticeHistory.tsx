import { useState } from 'react';
import { formatDate } from '../utils/helpers';
import Badge from './ui/Badge';
import type { PracticeResult } from '../types/api';

const INITIAL_COUNT = 5;

const PracticeHistory = ({ practices }: { practices: PracticeResult[] }) => {
  const [showAll, setShowAll] = useState(false);

  if (practices.length === 0) return null;

  const visible = showAll ? practices : practices.slice(0, INITIAL_COUNT);

  return (
    <section aria-labelledby="practice-history-heading">
      <h2 id="practice-history-heading" className="mb-4 text-h3 text-brand-forest">Recent checks</h2>
      <ul id="practice-history-list" className="divide-y divide-line rounded-lg border border-line bg-white">
        {visible.map((practice) => (
          <li key={practice.id} className="px-5 py-4 sm:px-6">
            <div className="mb-1 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
              <span>{formatDate(practice.createdAt)}</span>
              {practice.isCorrect ? <Badge tone="success">✓ Correct</Badge> : <Badge tone="warning">Corrected</Badge>}
            </div>
            <p className="text-ink" lang="en">{practice.originalSentence}</p>
            {!practice.isCorrect && (
              <p className="mt-1 font-semibold text-success" lang="en">
                <span className="sr-only">Corrected: </span>
                {practice.correctedSentence}
              </p>
            )}
          </li>
        ))}
      </ul>
      {practices.length > INITIAL_COUNT && (
        <button
          type="button"
          aria-expanded={showAll}
          aria-controls="practice-history-list"
          onClick={() => setShowAll((value) => !value)}
          className="mt-3 font-semibold text-brand-forest underline-offset-4 hover:underline"
        >
          {showAll ? 'Show fewer' : `Show all ${practices.length}`}
        </button>
      )}
    </section>
  );
};

export default PracticeHistory;
