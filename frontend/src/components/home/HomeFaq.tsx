import type { ReactNode } from 'react';
import SectionIntro from './SectionIntro';

// Answers describe how the product actually behaves today. No promises, prices or numbers.
const FAQ: { question: string; answer: ReactNode }[] = [
  {
    question: 'Which grammar topics does it cover?',
    answer:
      'The grammar topics of SSC English 2nd Paper, such as articles, prepositions, right form of verbs, narration and transformation of sentences. A question that fits none of them is filed under Other.'
  },
  {
    question: 'Can I read the explanations in Bangla?',
    answer: (
      <>
        Yes. Question analyses and practice-set feedback switch between English and <span lang="bn">বাংলা</span>. Sentence
        Check and the article quiz explain in English.
      </>
    )
  },
  {
    question: 'Are the answers always correct?',
    answer:
      'No. Explanations are written by AI and can contain mistakes. Use them to understand the reasoning, and check with your teacher or textbook when something looks wrong.'
  },
  {
    question: 'Do I need an account?',
    answer: 'Yes. Register to analyse questions, practise and see your progress. Your history is saved to your account.'
  },
  {
    question: 'Why does it sometimes say “Too many requests”?',
    answer:
      'Each student can make a limited number of AI requests per minute, so the service stays available for everyone. Wait a moment, then try again.'
  },
  {
    question: 'What is saved about me?',
    answer:
      'Your name, username and email, plus the questions you analyse, the sentences you check and your quiz and practice answers, so you can see your history and progress. To write explanations, the text you submit is sent to an AI service.'
  }
];

/** The FAQ. Its id ("faq") is the target of the footer's "Questions students ask" link. */
const HomeFaq = () => (
  <section
    id="faq"
    tabIndex={-1}
    aria-labelledby="faq-heading"
    className="scroll-mt-4 border-t border-line bg-white px-4 py-20 focus:outline-none sm:px-6 lg:py-28"
  >
    <div className="mx-auto grid max-w-page gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
      <SectionIntro id="faq-heading" kicker="Good to know" title="Questions students ask" />
      <div className="divide-y divide-line border-y border-line">
        {FAQ.map((item) => (
          <details key={item.question} className="group py-1">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded py-4 text-lg font-semibold text-brand-forest [&::-webkit-details-marker]:hidden">
              {item.question}
              <span aria-hidden="true" className="text-2xl leading-none text-brand-terracotta transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="pb-5 text-ink-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  </section>
);

export default HomeFaq;
