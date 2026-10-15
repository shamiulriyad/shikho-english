import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { LogoMark } from '../components/Logo';
import { ButtonLink } from '../components/ui/Button';
import { MatraRule, PageContainer } from '../components/ui/Page';

const NotFoundPage = () => {
  const { user } = useAuth();
  useDocumentTitle('Page not found');

  return (
    <PageContainer width="reading">
      <div className="py-6 sm:py-12">
        <LogoMark size={56} className="mb-8" />
        <MatraRule className="mb-4" />
        <p className="mb-2 text-sm font-semibold text-brand-terracotta">404</p>
        <h1 className="text-h1 text-brand-forest">We couldn’t find that page</h1>
        <p className="mt-3 text-lg text-ink-muted">The link may be broken, or the page may have moved.</p>
        <p className="mt-1 text-lg text-ink-muted" lang="bn">পাতাটি খুঁজে পাওয়া যায়নি।</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink to="/">Go to the home page</ButtonLink>
          {user && (
            <ButtonLink to="/analyze" variant="secondary">
              Analyze a question
            </ButtonLink>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default NotFoundPage;
