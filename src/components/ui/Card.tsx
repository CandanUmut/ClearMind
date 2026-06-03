import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  interactive?: boolean;
}

export function Card({ children, interactive = false, className = '', ...props }: CardProps) {
  return (
    <div
      className={
        'rounded border border-line bg-surface p-5 shadow-1 ' +
        (interactive ? 'transition-shadow hover:shadow-2 ' : '') +
        className
      }
      {...props}
    >
      {children}
    </div>
  );
}
