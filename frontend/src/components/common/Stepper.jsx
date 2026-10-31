
/**
 * Stepper component
 * Horizontal steps with a check for completed steps, filled dot for the current one, gray for upcoming.
 * Each step has a label and an optional date caption.
 *
 * @param {Array<{ key: string, label: string, date?: string }>} steps
 * @param {string} currentStep
 * @param {string} [extraBadge] - Optional badge on current step (e.g. "Paused")
 */
export const Stepper = ({ steps = [], currentStep, extraBadge = null }) => {
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="w-full py-4 px-2">
      <div className="flex items-center justify-between relative">
        {/* Connecting bar */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-[#e5e5e5] -z-0" />
        <div
          className="absolute top-4 left-6 h-0.5 bg-[#0b0b0b] transition-all duration-300 -z-0"
          style={{
            width: currentIndex > 0 ? `${(currentIndex / (steps.length - 1)) * 100}%` : '0%',
          }}
        />

        {steps.map((step, idx) => {
          const isCompleted = currentIndex > idx;
          const isCurrent = currentIndex === idx;

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  isCompleted
                    ? 'bg-[#0b0b0b] text-white shadow-sm'
                    : isCurrent
                    ? 'bg-[#0b0b0b] text-white ring-4 ring-[#0b0b0b]/10'
                    : 'bg-white border-2 border-[#d4d4d4] text-[#a3a3a3]'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-white' : 'bg-transparent'}`} />
                )}
              </div>

              <div className="mt-2 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <span
                    className={`text-xs font-medium ${
                      isCurrent ? 'text-[#0b0b0b] font-semibold' : isCompleted ? 'text-[#171717]' : 'text-[#a3a3a3]'
                    }`}
                  >
                    {step.label}
                  </span>
                  {isCurrent && extraBadge && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                      {extraBadge}
                    </span>
                  )}
                </div>
                {step.date && (
                  <div className="text-[11px] text-[#737373] mt-0.5">{step.date}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
