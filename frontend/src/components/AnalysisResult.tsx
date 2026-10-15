import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from './LanguageToggle';
import type { QuestionAnalysis } from '../types/api';

const LABELS = {
  en: {
    topic: 'Topic',
    question: 'Question',
    answer: 'Correct answer',
    steps: 'Step by step',
    rule: 'Grammar rule',
    mistakes: 'Common mistakes',
    yourAnswer: 'Your answer',
    correct: '✓ Correct',
    incorrect: '✗ Not quite',
    disclaimer: 'AI-generated explanation. It can make mistakes, so check with your teacher or textbook when unsure.'
  },
  bn: {
    topic: 'বিষয়',
    question: 'প্রশ্ন',
    answer: 'সঠিক উত্তর',
    steps: 'ধাপে ধাপে',
    rule: 'ব্যাকরণের নিয়ম',
    mistakes: 'সাধারণ ভুল',
    yourAnswer: 'তোমার উত্তর',
    correct: '✓ সঠিক',
    incorrect: '✗ সঠিক হয়নি',
    disclaimer: 'এই ব্যাখ্যা AI তৈরি করেছে। ভুল হতে পারে, তাই নিশ্চিত না হলে শিক্ষক বা পাঠ্যবই দেখে নাও।'
  }
} as const;

const AnalysisResult = ({ analysis }: { analysis: QuestionAnalysis }) => {
  const { language, pick } = useLanguage();
  const labels = LABELS[language];
  const feedback = analysis.studentAnswer;

  return (
    <article className="bg-white rounded-lg shadow-lg p-6 space-y-5" lang={language}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
          {labels.topic}: {language === 'bn' ? analysis.topic.nameBn : analysis.topic.nameEn}
        </span>
        <LanguageToggle />
      </div>

      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">{labels.question}</h3>
        <p className="text-gray-800 whitespace-pre-wrap" lang="en">{analysis.questionText}</p>
      </section>

      <section className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-green-800 uppercase mb-1">{labels.answer}</h3>
        <p className="text-lg font-semibold text-green-800 whitespace-pre-wrap" lang="en">{analysis.correctAnswer}</p>
      </section>

      {feedback && (
        <section className={`rounded-lg p-4 border ${feedback.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <h3 className="text-sm font-semibold text-gray-700 uppercase mb-1">{labels.yourAnswer}: <span lang="en">{feedback.answer}</span></h3>
          <p className={`font-semibold ${feedback.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
            {feedback.isCorrect ? labels.correct : labels.incorrect}
          </p>
          <p className="text-gray-700 mt-1">{pick(feedback)}</p>
        </section>
      )}

      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{labels.steps}</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          {analysis.steps.map((step, index) => (
            <li key={index}>{pick(step)}</li>
          ))}
        </ol>
      </section>

      <section className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-1">{labels.rule}</h3>
        <p className="text-gray-800">{pick(analysis.rule)}</p>
      </section>

      {analysis.commonMistakes.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{labels.mistakes}</h3>
          <ul className="space-y-2">
            {analysis.commonMistakes.map((mistake, index) => (
              <li key={index} className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-gray-700">
                {pick(mistake)}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs text-gray-500">{labels.disclaimer}</p>
    </article>
  );
};

export default AnalysisResult;
