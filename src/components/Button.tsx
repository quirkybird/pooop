import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'font-mono font-medium rounded-3xl transition-all duration-200 flex items-center justify-center gap-2';

  const variants = {
    primary:
      'bg-gradient-to-r from-cta-start to-cta-end text-primary shadow-lg shadow-cta-start/40 hover:shadow-xl hover:shadow-cta-start/50 hover:-translate-y-0.5 active:translate-y-0',
    secondary:
      'bg-cream-warm text-primary border-2 border-primary/10 hover:border-primary/30 hover:bg-cream',
    outline:
      'bg-transparent text-primary border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5',
    ghost:
      'bg-transparent text-primary/70 hover:text-primary hover:bg-primary/5',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = disabled || isLoading ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${disabledClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="animate-spin">⏳</span>
          <span>加载中...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

export default Button;
