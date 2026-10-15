import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

// Only destinations that exist. Learning pages ask visitors to log in and then return them here.
const LEARN_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/topics', label: 'Topics' },
  { to: '/analyze', label: 'Analyze a question' },
  { to: '/practice', label: 'Sentence Check' },
  { to: '/quiz', label: 'Quiz' },
  { to: '/history', label: 'History' },
  { to: '/progress', label: 'Progress' }
];

const linkClass = 'text-brand-ivory/85 transition-colors hover:text-brand-amber';

const Column = ({ id, title, children }: { id: string; title: string; children: ReactNode }) => (
  <div>
    <h2 id={id} className="text-sm font-semibold text-brand-amber">
      {title}
    </h2>
    <ul aria-labelledby={id} className="mt-4 space-y-3">
      {children}
    </ul>
  </div>
);

/**
 * "Shikho English" set across the full footer width, written the way the logo is: a matra (headline
 * stroke) runs along the tops of the letters and ends in the amber spark. The size is a share of the
 * footer's width (see .footer-wordmark), so it always fits on one line. Decorative: the logo above
 * already names the site.
 */
const BrandWordmark = () => (
  <div aria-hidden="true" className="mt-16 select-none [container-type:inline-size]">
    <p className="footer-wordmark relative whitespace-nowrap font-bold leading-none tracking-[-0.04em]">
      <span className="text-brand-ivory">Shikho</span> <span className="font-semibold text-brand-amber">English</span>
      {/* Matra: its lower edge sits on the capital height, so tall letters (h, k, l) join it */}
      <span className="absolute left-0 top-[0.081em] h-[0.055em] w-[94.5%] rounded-full bg-brand-ivory" />
      <span className="absolute right-0 top-[0.054em] h-[0.11em] w-[0.11em] rounded-full bg-brand-amber" />
    </p>
  </div>
);

const SiteFooter = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <footer className="on-dark overflow-hidden bg-brand-forest text-brand-ivory">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="col-span-2 max-w-sm lg:col-span-1">
            <Logo tone="dark" size={40} />
            <p className="mt-5 text-xl font-semibold leading-snug text-brand-ivory">
              Understand English. Think clearly. Grow confidently.
            </p>
            <p className="mt-3 text-brand-ivory/80">
              SSC English grammar practice, with explanations in English and <span lang="bn">বাংলা</span>.
            </p>
          </div>

          <nav aria-label="Learn">
            <Column id="footer-learn" title="Learn">
              {LEARN_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className={linkClass}>{link.label}</Link>
                </li>
              ))}
            </Column>
          </nav>

          <nav aria-label="Account">
            <Column id="footer-account" title="Account">
              {user ? (
                <>
                  <li><Link to="/settings" className={linkClass}>Settings</Link></li>
                  <li>
                    <button type="button" onClick={handleLogout} className={linkClass}>
                      Log out
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li><Link to="/login" className={linkClass}>Log in</Link></li>
                  <li><Link to="/register" className={linkClass}>Create account</Link></li>
                </>
              )}
            </Column>
          </nav>

          <nav aria-label="Help">
            <Column id="footer-help" title="Help">
              <li>
                <Link to={{ pathname: '/', hash: '#faq' }} className={linkClass}>Questions students ask</Link>
              </li>
            </Column>
          </nav>
        </div>

        <BrandWordmark />

        <div className="mt-8 flex flex-col gap-3 border-t border-brand-ivory/15 pt-6 text-sm text-brand-ivory/75 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Shikho English</p>
          <p className="max-w-xl md:text-right">
            Explanations are AI-generated and can contain mistakes. When unsure, check with your teacher or textbook.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
