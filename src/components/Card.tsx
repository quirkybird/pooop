import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'partner' | 'reminder';
  className?: string;
  onClick?: () => void;
}

export function Card({
  children,
  variant = 'default',
  className = '',
  onClick,
}: CardProps) {
  const baseStyles =
    'rounded-3xl p-5 transition-all duration-200';

  const variants = {
    default:
      'bg-white shadow-lg shadow-primary/5 border border-primary/10',
    partner:
      'bg-gradient-to-br from-pink-soft to-white border-2 border-pink shadow-lg shadow-pink/20',
    reminder: 'border-2',
  };

  const interactiveClass = onClick
    ? 'cursor-pointer hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'
    : '';

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${interactiveClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export default Card;
