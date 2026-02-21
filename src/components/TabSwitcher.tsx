interface TabSwitcherProps {
  activeTab: 'history' | 'trend';
  onChange: (tab: 'history' | 'trend') => void;
}

export function TabSwitcher({ activeTab, onChange }: TabSwitcherProps) {
  return (
    <div className="flex justify-center mb-6">
      <div className="inline-flex bg-white rounded-full p-1 shadow-md border border-primary/10">
        <button
          onClick={() => onChange('history')}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
            activeTab === 'history'
              ? 'bg-primary text-white shadow-sm'
              : 'text-primary/70 hover:text-primary'
          }`}
        >
          历史记录
        </button>
        <button
          onClick={() => onChange('trend')}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
            activeTab === 'trend'
              ? 'bg-pink text-white shadow-sm'
              : 'text-primary/70 hover:text-primary'
          }`}
        >
          趋势
        </button>
      </div>
    </div>
  );
}

export default TabSwitcher;
