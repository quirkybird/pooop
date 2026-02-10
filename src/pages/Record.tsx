import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, FileText, Moon } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ShapeSelector } from '../components/ShapeSelector';
import { MoodPicker } from '../components/MoodPicker';
import { TimelinePicker } from '../components/TimelinePicker';
import { supabaseApi as api } from '../services/supabaseApi';
import useExtendedStore from '../stores/useStore';
import type { ShapeOption, MoodOption } from '../types';
import { useToast } from '../hooks/useToast';

const STEPS = [
  { id: 1, title: '时间', description: '什么时候？' },
  { id: 2, title: '形状', description: '什么形状？' },
  { id: 3, title: '心情', description: '感觉如何？' },
];

export function Record() {
  const navigate = useNavigate();
  const { currentUser, addRecord } = useExtendedStore();
  const { success, error: showError } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [timestamp, setTimestamp] = useState(new Date());
  const [selectedShape, setSelectedShape] = useState<ShapeOption | null>(null);
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      navigate('/');
    }
  };

  const handleSubmit = async () => {
    if (!currentUser || !selectedShape || !selectedMood) return;

    setIsSubmitting(true);

    try {
      const response = await api.record.create({
        userId: currentUser.id,
        timestamp: timestamp.toISOString(),
        shapeId: selectedShape.id,
        moodId: selectedMood.id,
        note: note || undefined,
      });

      if (response.success) {
        addRecord(response.data);
        success("记录成功！");
        navigate('/');
      }
    } catch (error) {
      console.error('Failed to create record:', error);
      showError('记录失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return true;
      case 2:
        return selectedShape !== null;
      case 3:
        return selectedMood !== null;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-cream p-4 pb-24">
      {/* Header */}
      <header className="flex items-center gap-3 mb-6">
        <button
          onClick={handleBack}
          className="p-2 rounded-full bg-white shadow-sm hover:shadow-md transition-shadow"
        >
          <ChevronLeft size={24} className="text-primary" />
        </button>
        <h1 className="font-serif text-2xl text-primary flex items-center gap-2">记录便便 <Moon size={24} /></h1>
      </header>

      {/* 步骤指示器 */}
      <div className="flex items-center justify-between mb-8 px-2">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex flex-col items-center transition-all duration-300 ${
                currentStep >= step.id
                  ? 'opacity-100'
                  : 'opacity-40'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-serif text-lg mb-1 transition-all duration-300 ${
                  currentStep > step.id
                    ? 'bg-primary text-white'
                    : currentStep === step.id
                    ? 'bg-gradient-to-r from-cta-start to-cta-end text-primary shadow-lg'
                    : 'bg-cream-warm text-primary/50'
                }`}
              >
                {currentStep > step.id ? (
                  <Check size={20} />
                ) : (
                  step.id
                )}
              </div>
              <span className="text-xs font-mono text-primary/70">
                {step.title}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-2 transition-all duration-300 ${
                  currentStep > step.id
                    ? 'bg-primary'
                    : 'bg-primary/20'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* 步骤内容 */}
      <Card className="min-h-[400px]">
        {currentStep === 1 && (
          <div className="animate-in fade-in duration-300">
            <TimelinePicker value={timestamp} onChange={setTimestamp} />
          </div>
        )}

        {currentStep === 2 && (
          <div className="animate-in fade-in duration-300">
            <ShapeSelector
              selectedId={selectedShape?.id}
              onSelect={setSelectedShape}
            />
          </div>
        )}

        {currentStep === 3 && (
          <div className="animate-in fade-in duration-300 space-y-6">
            <MoodPicker
              selectedId={selectedMood?.id}
              onSelect={setSelectedMood}
            />

            {/* 备注输入 */}
            <div className="pt-4 border-t border-primary/10">
              <p className="font-serif text-primary/60 text-sm mb-3 flex items-center gap-2">
                <FileText size={16} />
                添加备注（可选）
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="今天有什么特别的感受吗..."
                className="w-full h-24 p-4 rounded-2xl bg-cream-warm border-2 border-transparent focus:border-primary-light focus:outline-none resize-none font-mono text-sm text-primary placeholder:text-primary/30"
              />
            </div>
          </div>
        )}
      </Card>

      {/* 底部按钮 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-cream/95 backdrop-blur-sm border-t border-primary/5">
        <div className="max-w-md mx-auto flex gap-3">
          {currentStep < 3 ? (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleNext}
              disabled={!canProceed()}
            >
              <span>下一步</span>
              <ChevronRight size={20} />
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              isLoading={isSubmitting}
            >
              <Check size={20} />
              <span>完成记录</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Record;
