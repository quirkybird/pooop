import { SHAPE_OPTIONS } from '../services/api';
import type { ShapeOption } from '../types';
import { Info } from 'lucide-react';

interface ShapeSelectorProps {
  selectedId?: string;
  onSelect: (shape: ShapeOption) => void;
}

export function ShapeSelector({ selectedId, onSelect }: ShapeSelectorProps) {
  // 获取健康状态的样式
  const getHealthBadge = (index: number) => {
    if (index <= 1) return { text: '便秘', bgColor: '#FFEBEE', textColor: '#C62828' };
    if (index <= 3) return { text: '正常', bgColor: '#E8F5E9', textColor: '#2E7D32' };
    if (index === 4) return { text: '正常', bgColor: '#E8F5E9', textColor: '#2E7D32' };
    return { text: '腹泻', bgColor: '#FFF3E0', textColor: '#EF6C00' };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 mb-4 p-3 bg-cream-warm rounded-xl">
        <Info size={16} className="text-primary/50 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-serif text-primary/80 text-sm font-medium">
            布里斯托粪便分类法
          </p>
          <p className="text-xs text-primary/50 font-mono mt-1">
            国际通用医学标准，分为7种类型。3-4型最理想，6-7型可能腹泻，1-2型可能便秘。
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {SHAPE_OPTIONS.map((shape, index) => {
          const healthBadge = getHealthBadge(index);
          return (
            <button
              key={shape.id}
              onClick={() => onSelect(shape)}
              className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                selectedId === shape.id
                  ? 'border-primary bg-cream-light shadow-md'
                  : 'border-transparent bg-cream-warm hover:border-primary/20 hover:bg-cream'
              }`}
            >
              <span className="text-4xl flex-shrink-0">{shape.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-serif text-lg font-medium text-primary">
                    {shape.label}
                  </span>
                  <span 
                    className="text-xs px-2 py-0.5 rounded-full font-mono font-medium"
                    style={{ 
                      backgroundColor: healthBadge.bgColor,
                      color: healthBadge.textColor
                    }}
                  >
                    {healthBadge.text}
                  </span>
                </div>
                <p className="text-sm text-primary/70 font-mono mb-1">
                  {shape.description}
                </p>
                {shape.healthMeaning && (
                  <p className="text-xs text-primary/50 font-mono">
                    💡 {shape.healthMeaning}
                  </p>
                )}
              </div>
              {selectedId === shape.id && (
                <span className="text-primary text-xl flex-shrink-0">✓</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ShapeSelector;
