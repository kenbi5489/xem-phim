import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-app)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
          {
            'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] border border-transparent shadow-lg shadow-[var(--color-primary)]/20': variant === 'primary',
            'bg-transparent text-[var(--color-text-primary)] border border-[var(--color-border-strong)] hover:bg-[var(--color-surface-elevated)]': variant === 'secondary',
            'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] border border-transparent': variant === 'ghost',
            
            'px-3 py-1.5 text-[13px] rounded-[8px]': size === 'sm',
            'px-4 py-2 text-[14px] rounded-[10px]': size === 'md',
            'px-6 py-3 text-[16px] h-[48px] rounded-full': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
