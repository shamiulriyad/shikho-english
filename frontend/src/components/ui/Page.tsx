import type { ReactNode } from 'react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

/** The brand's matra: a headline stroke ending in the amber spark, used above section headings. */
export const MatraRule = ({ className = '' }: { className?: string }) => (
  <span aria-hidden="true" className={`flex items-center gap-1.5 ${className}`}>
    <span className="h-[3px] w-10 rounded-full bg-brand-forest" />
    <span className="h-1.5 w-1.5 rounded-full bg-brand-amber" />
  </span>
);

interface PageContainerProps {
  /** `reading` for forms and explanations, `page` for lists and dashboards */
  width?: 'reading' | 'page';
  className?: string;
  children: ReactNode;
}

/** Page background and width. App already provides the page's <main>. */
export const PageContainer = ({ width = 'page', className = '', children }: PageContainerProps) => (
  <div className={`bg-paper px-4 py-10 sm:px-6 sm:py-14 ${className}`}>
    <div className={`mx-auto ${width === 'reading' ? 'max-w-reading' : 'max-w-page'}`}>{children}</div>
  </div>
);

interface PageHeaderProps {
  /** Small label above the title, e.g. a section number */
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Browser tab title; defaults to `title` when that is plain text */
  documentTitle?: string;
}

export const PageHeader = ({ eyebrow, title, description, actions, documentTitle }: PageHeaderProps) => {
  useDocumentTitle(documentTitle ?? (typeof title === 'string' ? title : undefined));

  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-reading">
        <MatraRule className="mb-4" />
        {eyebrow && <p className="mb-2 text-sm font-semibold text-brand-terracotta">{eyebrow}</p>}
        <h1 className="text-h1 text-brand-forest">{title}</h1>
        {description && <p className="mt-2 text-lg text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </header>
  );
};
