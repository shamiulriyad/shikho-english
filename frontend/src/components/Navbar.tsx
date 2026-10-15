import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import { buttonClasses } from './ui/Button';

const MOBILE_MENU_ID = 'mobile-menu';
const ACCOUNT_MENU_ID = 'account-menu';

type NavItem = { to: string; label: string; end?: boolean };

/** Visitors: the public pages. Learning pages need an account, so they sit behind "Get started". */
const PUBLIC_LINKS: NavItem[] = [
  { to: '/', label: 'Home', end: true },
  { to: '/topics', label: 'Topics' }
];

/** Signed-in destinations, in the order a student usually uses them */
const APP_LINKS: NavItem[] = [
  { to: '/analyze', label: 'Analyze' },
  { to: '/practice', label: 'Sentence Check' },
  { to: '/quiz', label: 'Quiz' },
  { to: '/history', label: 'History' },
  { to: '/progress', label: 'Progress' },
  { to: '/topics', label: 'Topics' }
];

// The current page gets a terracotta bar resting on the header's bottom edge, like the matra in the logo
const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
  `relative flex h-16 items-center whitespace-nowrap px-1 text-[0.95rem] transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-t-full ${
    isActive
      ? 'font-semibold text-brand-forest after:bg-brand-terracotta'
      : 'font-medium text-ink-muted hover:text-brand-forest hover:after:bg-line'
  }`;

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-11 items-center rounded-md border-l-4 px-3 py-2.5 text-base transition-colors ${
    isActive
      ? 'border-brand-terracotta bg-info-soft font-semibold text-brand-forest'
      : 'border-transparent font-medium text-ink hover:bg-paper'
  }`;

const initialOf = (name: string) => name.trim().charAt(0).toUpperCase() || '?';

const Avatar = ({ name }: { name: string }) => (
  <span
    aria-hidden="true"
    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-forest text-sm font-semibold text-brand-ivory"
  >
    {initialOf(name)}
  </span>
);

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => setIsMenuOpen(false);

  // Any navigation (links, the Back button, redirects) closes both menus
  useEffect(() => {
    setIsMenuOpen(false);
    setIsAccountOpen(false);
  }, [pathname]);

  // Escape closes whichever menu is open and returns focus to the button that opened it
  useEffect(() => {
    if (!isMenuOpen && !isAccountOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (isAccountOpen) {
        setIsAccountOpen(false);
        accountButtonRef.current?.focus();
      } else {
        setIsMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isMenuOpen, isAccountOpen]);

  // The account menu also closes when a click or keyboard focus lands outside it
  useEffect(() => {
    if (!isAccountOpen) return;
    const onOutside = (event: Event) => {
      if (!accountRef.current?.contains(event.target as Node)) setIsAccountOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('focusin', onOutside);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('focusin', onOutside);
    };
  }, [isAccountOpen]);

  const handleLogout = () => {
    closeMenu();
    setIsAccountOpen(false);
    logout();
    navigate('/');
  };

  const links = user ? APP_LINKS : PUBLIC_LINKS;

  return (
    <header className="border-b border-line bg-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-brand-forest focus:px-4 focus:py-2 focus:font-semibold focus:text-brand-ivory"
      >
        Skip to main content
      </a>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-6">
          <Link to="/" className="shrink-0 rounded" onClick={closeMenu}>
            <Logo tone="light" size={36} />
          </Link>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-4 xl:gap-6">
              {links.map((link) => (
                <li key={link.to}>
                  <NavLink to={link.to} end={link.end} className={desktopLinkClass}>
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden items-center gap-5 lg:flex">
            {user ? (
              <div ref={accountRef} className="relative">
                <button
                  ref={accountButtonRef}
                  type="button"
                  onClick={() => setIsAccountOpen((open) => !open)}
                  aria-expanded={isAccountOpen}
                  aria-controls={ACCOUNT_MENU_ID}
                  aria-label={`Account menu for ${user.fullName}`}
                  className="flex items-center gap-2 rounded-md border border-line py-1 pl-1 pr-2.5 transition-colors hover:border-line-strong hover:bg-paper"
                >
                  <Avatar name={user.fullName} />
                  <span className="hidden max-w-[8rem] truncate text-sm font-medium text-brand-forest xl:inline">{user.fullName}</span>
                  <svg
                    className={`h-4 w-4 text-ink-muted transition-transform ${isAccountOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {isAccountOpen && (
                  <div
                    id={ACCOUNT_MENU_ID}
                    className="absolute right-0 top-full z-40 mt-2 w-64 rounded-lg border border-line bg-white py-2 shadow-paper"
                  >
                    <div className="border-b border-line px-4 pb-3 pt-1">
                      <p className="truncate font-semibold text-brand-forest">{user.fullName}</p>
                      <p className="truncate text-sm text-ink-muted">{user.email}</p>
                    </div>
                    <ul className="pt-2">
                      <li>
                        <Link to="/settings" className="block px-4 py-2 text-ink transition-colors hover:bg-paper">
                          Settings
                        </Link>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="block w-full px-4 py-2 text-left text-ink transition-colors hover:bg-paper"
                        >
                          Log out
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <>
                <NavLink to="/login" className={desktopLinkClass}>
                  Log in
                </NavLink>
                <Link to="/register" className={buttonClasses({ variant: 'primary', size: 'sm' })}>
                  Get started
                </Link>
              </>
            )}
          </div>

          <button
            ref={toggleRef}
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-controls={MOBILE_MENU_ID}
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-md text-brand-forest transition-colors hover:bg-paper lg:hidden"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <nav id={MOBILE_MENU_ID} aria-label="Main menu" className="border-t border-line bg-white lg:hidden">
          <div className="mx-auto max-w-7xl space-y-4 px-4 py-4 sm:px-6">
            {user && (
              <div className="flex items-center gap-3 rounded-md bg-paper px-3 py-3">
                <Avatar name={user.fullName} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-brand-forest">{user.fullName}</p>
                  <p className="truncate text-sm text-ink-muted">{user.email}</p>
                </div>
              </div>
            )}

            <ul className="space-y-1">
              {links.map((link) => (
                <li key={link.to}>
                  <NavLink to={link.to} end={link.end} onClick={closeMenu} className={mobileLinkClass}>
                    {link.label}
                  </NavLink>
                </li>
              ))}
              {user && (
                <li>
                  <NavLink to="/settings" onClick={closeMenu} className={mobileLinkClass}>
                    Settings
                  </NavLink>
                </li>
              )}
            </ul>

            <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row">
              {user ? (
                <button type="button" onClick={handleLogout} className={buttonClasses({ variant: 'secondary', fullWidth: true })}>
                  Log out
                </button>
              ) : (
                <>
                  <Link to="/login" onClick={closeMenu} className={buttonClasses({ variant: 'secondary', fullWidth: true })}>
                    Log in
                  </Link>
                  <Link to="/register" onClick={closeMenu} className={buttonClasses({ variant: 'primary', fullWidth: true })}>
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
