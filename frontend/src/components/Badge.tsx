import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline';
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        {
          'bg-slate-800 text-slate-300 border-slate-700': variant === 'default',
          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20': variant === 'success',
          'bg-amber-500/10 text-amber-400 border-amber-500/20': variant === 'warning',
          'bg-rose-500/10 text-rose-400 border-rose-500/20': variant === 'danger',
          'bg-transparent text-slate-400 border-slate-700': variant === 'outline',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
