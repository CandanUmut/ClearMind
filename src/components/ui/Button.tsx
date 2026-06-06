import { motion } from 'framer-motion';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
  full?: boolean;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-sm font-medium ' +
  'min-h-[44px] px-5 py-3 text-body transition-colors select-none ' +
  'disabled:opacity-50 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-ink',
  secondary: 'bg-transparent text-ink border border-line hover:bg-surface-2',
  ghost: 'bg-transparent text-ink-soft hover:text-ink hover:bg-surface-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', full = false, className = '', children, ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.12 }}
      className={`${base} ${variants[variant]} ${full ? 'w-full' : ''} ${className}`}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {children}
    </motion.button>
  );
});
