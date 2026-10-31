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
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
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
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={buttonClasses}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

