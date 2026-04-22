import React from 'react';
import { cn } from './Button';

interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  selected?: boolean;
}

export const Chip = React.forwardRef<HTMLSpanElement, ChipProps>(
  ({ className, selected = false, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center px-3 py-1 text-sm font-medium transition-colors duration-200 cursor-pointer rounded-md",
          selected 
            ? "bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]" 
            : "bg-[var(--color-surface-variant)] text-[var(--color-on-surface)] hover:bg-[color-mix(in_srgb,var(--color-surface-variant)_80%,var(--color-primary)_20%)]",
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Chip.displayName = 'Chip';
