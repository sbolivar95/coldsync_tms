interface OrderDrawerTabsProps {
  activeTab: 'detalles' | 'historial';
  onTabChange: (tab: 'detalles' | 'historial') => void;
}

const tabs = [
  { id: 'detalles' as const, label: 'Detalles' },
  { id: 'historial' as const, label: 'Historial' },
];

export function OrderDrawerTabs({ activeTab, onTabChange }: OrderDrawerTabsProps) {
  return (
    <div className="shrink-0 bg-white">
      <nav className="flex px-6 py-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative text-sm px-4 py-3 transition-colors flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'text-gray-900 font-medium'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
