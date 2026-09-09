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
          "inline-flex items-center justify-center px-3 py-1 text-[12px] font-medium transition-colors duration-200 rounded-[6px]",
          selected 
            ? "bg-[var(--color-primary)] text-white" 
            : "bg-[var(--color-bg-hover)] text-[var(--color-text-2)] hover:text-[var(--color-text-1)] cursor-pointer",
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
