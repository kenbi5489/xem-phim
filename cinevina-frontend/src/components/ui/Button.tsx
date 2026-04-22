import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-semibold transition-all duration-300",
          {
            'btn-primary': variant === 'primary',
            'btn-secondary': variant === 'secondary',
            'text-on-surface hover:text-primary transition-colors': variant === 'ghost',
            'px-3 py-1.5 text-sm rounded-lg': size === 'sm',
            'px-4 py-2 text-base rounded-xl': size === 'md',
            'px-6 py-3 text-lg rounded-2xl': size === 'lg',
            'px-8 py-4 text-xl rounded-2xl': size === 'xl',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
