import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/helpers';
import LanguageToggle from '../components/LanguageToggle';
import { Button } from '../components/ui/Button';
import { PageContainer, PageHeader } from '../components/ui/Page';

const sectionClass = 'rounded-lg border border-line bg-white px-5 py-6 sm:px-6';

/**
 * What the app can genuinely offer today: the account details saved at login (read-only; the API has no
 * endpoint to change them), the explanation language (stored in this browser) and signing out.
 */
const SettingsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const details = [
    { label: 'Full name', value: user.fullName },
    { label: 'Username', value: user.username },
    { label: 'Email', value: user.email },
    { label: 'Member since', value: formatDate(user.createdAt) }
  ];

  return (
    <PageContainer width="reading">
      <PageHeader eyebrow="Account" title="Settings" />

      <div className="space-y-6">
        <section aria-labelledby="account-heading" className={sectionClass}>
          <h2 id="account-heading" className="text-h3 text-brand-forest">Your account</h2>
          <dl className="mt-4 divide-y divide-line">
            {details.map((detail) => (
              <div key={detail.label} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr]">
                <dt className="text-sm font-semibold text-ink-muted">{detail.label}</dt>
                <dd className="break-words text-ink">{detail.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-ink-muted">Your details and password can’t be changed in the app.</p>
        </section>

        <section aria-labelledby="language-heading" className={sectionClass}>
          <h2 id="language-heading" className="text-h3 text-brand-forest">Explanation language</h2>
          <p className="mt-1 text-ink-muted">
            Used for question analyses and practice-set feedback. You can also switch it next to any explanation. Saved
            in this browser.
          </p>
          <div className="mt-4">
            <LanguageToggle />
          </div>
        </section>

        <section aria-labelledby="signout-heading" className={sectionClass}>
          <h2 id="signout-heading" className="text-h3 text-brand-forest">Log out</h2>
          <p className="mt-1 text-ink-muted">Signs you out of Shikho English in this browser.</p>
          <Button variant="secondary" className="mt-4" onClick={handleLogout}>
            Log out
          </Button>
        </section>
      </div>
    </PageContainer>
  );
};

export default SettingsPage;
