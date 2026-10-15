/** Decorative spinner; pair it with visible or role="status" text that says what is happening. */
const Spinner = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <span
    aria-hidden="true"
    className={`inline-block shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none ${className}`}
  />
);

export default Spinner;
