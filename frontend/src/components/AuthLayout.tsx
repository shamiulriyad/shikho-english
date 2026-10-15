import type { ReactNode } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { LogoMark } from './Logo';
import { MatraRule } from './ui/Page';

// What the student gets after signing in. Only features that exist today.
const POINTS = [
  'The answer to a grammar question, with the reasoning step by step',
  <>
    Explanations in English and <span lang="bn">বাংলা</span>
  </>,
  'Practice questions like the ones you found difficult',
];

interface AuthLayoutProps {
  title: string;
  intro: ReactNode;
  children: ReactNode;
  /** The "switch to login/register" line under the form */
  footer: ReactNode;
}

/** Split layout for login and registration: an editorial panel beside the form (stacked on phones). */
const AuthLayout = ({ title, intro, children, footer }: AuthLayoutProps) => {
  useDocumentTitle(title);

  return (
    <div className="bg-paper px-4 py-10 sm:px-6 lg:py-16">
      <div className="mx-auto grid max-w-page overflow-hidden rounded-lg border border-line bg-white shadow-paper lg:grid-cols-[1fr_1.1fr]">
        <aside className="on-dark hidden bg-brand-forest p-10 text-brand-ivory lg:flex lg:flex-col lg:justify-between">
          <div>
            <LogoMark size={48} tone="dark" />
            <p className="mt-10 text-h2">Grammar answers you can understand.</p>
            <ul className="mt-6 space-y-3">
              {POINTS.map((point, index) => (
                <li key={index} className="flex gap-3 text-brand-ivory/90">
                  <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-amber" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-10 text-sm text-brand-ivory/75">
            Explanations are AI-generated and can contain mistakes. Check with your teacher when unsure.
          </p>
        </aside>

        <section className="px-6 py-10 sm:px-10 lg:py-14">
          <div className="mx-auto max-w-md">
            <MatraRule className="mb-4" />
            <h1 className="text-h1 text-brand-forest">{title}</h1>
            <p className="mt-2 text-ink-muted">{intro}</p>
            <div className="mt-8">{children}</div>
            <p className="mt-8 border-t border-line pt-6 text-ink-muted">{footer}</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuthLayout;
