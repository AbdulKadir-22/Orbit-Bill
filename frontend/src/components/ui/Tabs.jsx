/**
 * Tabs primitive
 * Clean monochrome underline or pill tabs.
 */
export const Tabs = ({
  tabs = [],
  activeTab,
  onChange,
  variant = 'underline', // 'underline' | 'pill'
  className = '',
}) => {
  return (
    <div
      role="tablist"
      className={`flex items-center gap-6 ${
        variant === 'pill'
          ? 'bg-neutral-100 p-1 rounded-[10px]'
          : 'border-b border-black/10'
      } ${className}`}
    >
      {tabs.map((tab, idx) => {
        const tabId = tab.id ?? tab.key ?? idx;
        const isActive = activeTab === tabId;
        const buttonClasses =
          variant === 'pill'
            ? `px-3 py-1.5 text-xs font-semibold rounded-[8px] transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`
            : `pb-3 text-sm font-semibold transition-all relative cursor-pointer focus:outline-none ${
                isActive
                  ? 'text-neutral-900 border-b-2 border-neutral-900 -mb-[1px]'
                  : 'text-neutral-500 hover:text-neutral-800 border-b-2 border-transparent'
              }`;

        return (
          <button
            key={tabId}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tabId)}
            className={buttonClasses}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1 text-xs opacity-70">({tab.count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

