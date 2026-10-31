import { Check, X } from 'lucide-react';
import { STRINGS } from '../../../constants/strings';
import { evaluatePasswordRules } from '../../../lib/validators';

/**
 * PasswordRules component
 * Shows met / unmet indicator live for each rule as the user types.
 */
export const PasswordRules = ({ password = '' }) => {
  const evaluations = evaluatePasswordRules(password);

  return (
    <div className="bg-neutral-50 rounded-[10px] p-3 border border-black/5 space-y-1.5 text-left text-xs">
      <span className="font-medium text-neutral-600 block mb-1">
        {STRINGS.AUTH.RULES_HEADING}
      </span>
      {evaluations.map((rule) => {
        const text = STRINGS.AUTH[rule.labelKey] || rule.labelKey;
        return (
          <div
            key={rule.id}
            className={`flex items-center gap-2 transition-colors duration-150 ${
              rule.met ? 'text-emerald-600 font-medium' : 'text-neutral-400'
            }`}
          >
            {rule.met ? (
              <Check size={13} className="shrink-0 stroke-[2.5]" />
            ) : (
              <X size={13} className="shrink-0 text-neutral-300 stroke-[2]" />
            )}
            <span>{text}</span>
          </div>
        );
      })}
    </div>
  );
};
