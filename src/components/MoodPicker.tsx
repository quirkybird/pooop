import { MOOD_OPTIONS } from '../services/api';
import type { MoodOption } from '../types';

interface MoodPickerProps {
  selectedId?: string;
  onSelect: (mood: MoodOption) => void;
}

export function MoodPicker({ selectedId, onSelect }: MoodPickerProps) {
  return (
    <div className="space-y-3">
      <p className="font-serif text-primary/60 text-sm mb-4">
        今天感觉怎么样？
      </p>
      <div className="grid grid-cols-5 gap-2">
        {MOOD_OPTIONS.map((mood) => (
          <button
            key={mood.id}
            onClick={() => onSelect(mood)}
            className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200 ${
              selectedId === mood.id
                ? 'bg-cream-light shadow-md scale-105'
                : 'hover:bg-cream-warm'
            }`}
            style={
              selectedId === mood.id
                ? { borderColor: mood.color, borderWidth: '2px' }
                : {}
            }
          >
            <span className="text-3xl">{mood.emoji}</span>
            <span
              className="text-xs font-mono"
              style={{ color: selectedId === mood.id ? mood.color : undefined }}
            >
              {mood.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default MoodPicker;
