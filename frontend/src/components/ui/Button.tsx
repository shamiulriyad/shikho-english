import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import Spinner from './Spinner';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger' | 'inverse';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-forest text-brand-ivory hover:bg-[#0F2B26]',
  accent: 'bg-brand-terracotta text-white hover:bg-[#934427]',
  secondary: 'border border-brand-forest bg-white text-brand-forest hover:bg-info-soft',
  ghost: 'text-brand-forest hover:bg-info-soft',
  danger: 'bg-danger text-white hover:bg-[#86222F]',
  // Outline button for forest/dark surfaces
  inverse: 'border border-brand-ivory/40 text-brand-ivory hover:bg-white/10',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-base',
};

interface ButtonStyle {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

/** Shared by <Button> and <ButtonLink> so links styled as buttons stay identical. */
export const buttonClasses = ({ variant = 'primary', size = 'md', fullWidth = false }: ButtonStyle = {}) =>
  [
    'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-60',
    VARIANTS[variant],
    SIZES[size],
    fullWidth ? 'w-full' : '',
  ].join(' ');

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonStyle {
  /** Disables the button and shows a spinner; `loadingText` replaces the label while it runs. */
  loading?: boolean;
  loadingText?: ReactNode;
}

export const Button = ({
  variant,
  size,
  fullWidth,
  loading = false,
  loadingText,
  disabled,
  type = 'button',
  className = '',
  children,
  ...rest
}: ButtonProps) => (
  <button
    type={type}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    className={`${buttonClasses({ variant, size, fullWidth })} ${className}`}
    {...rest}
  >
    {loading && <Spinner />}
    {loading && loadingText ? loadingText : children}
  </button>
);

export const ButtonLink = ({ variant, size, fullWidth, className = '', ...rest }: LinkProps & ButtonStyle) => (
  <Link className={`${buttonClasses({ variant, size, fullWidth })} ${className}`} {...rest} />
);
