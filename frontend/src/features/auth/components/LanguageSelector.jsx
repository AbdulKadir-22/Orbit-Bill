import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { STRINGS } from '../../../constants/strings';

/**
 * LanguageSelector component
 * Extensible for future locales, currently supports English with multi-lingual readiness.
 */
export const LanguageSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'en', label: STRINGS.LANG.EN },
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLabel = languages.find((l) => l.code === selectedLang)?.label || 'English';

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors border border-white/10 cursor-pointer focus:outline-none"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe size={14} />
        <span>{currentLabel}</span>
        <ChevronDown size={13} className="text-neutral-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-[#181818] border border-white/10 rounded-[10px] shadow-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-150">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                setSelectedLang(lang.code);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-white rounded-[6px] hover:bg-white/10 transition-colors cursor-pointer text-left"
            >
              <span>{lang.label}</span>
              {selectedLang === lang.code && <Check size={14} className="text-white" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
