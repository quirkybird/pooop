import type { ReminderCard } from '../types';
import { X } from 'lucide-react';

interface ReminderCardComponentProps {
  card: ReminderCard;
  onDismiss?: (id: string) => void;
  showDismiss?: boolean;
}

export function ReminderCardComponent({
  card,
  onDismiss,
  showDismiss = true,
}: ReminderCardComponentProps) {
  return (
    <div
      className="relative rounded-2xl p-4 shadow-sm animate-float"
      style={{
        backgroundColor: card.backgroundColor,
        color: card.textColor,
      }}
    >
      {showDismiss && onDismiss && (
        <button
          onClick={() => onDismiss(card.id)}
          className="absolute top-2 right-2 p-1 rounded-full opacity-50 hover:opacity-100 transition-opacity"
          style={{ color: card.textColor }}
        >
          <X size={14} />
        </button>
      )}
      <p className="font-mono text-sm pr-6">{card.message}</p>
    </div>
  );
}

export default ReminderCardComponent;
