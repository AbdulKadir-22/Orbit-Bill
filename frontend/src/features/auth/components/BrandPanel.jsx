import { Repeat, FileText, Users, BarChart3 } from 'lucide-react';
import { STRINGS } from '../../../constants/strings';
import { LogoMark } from '../../../components/layout/Sidebar';
import heroImg from '../../../assets/hero.png';

/**
 * BrandPanel (Left panel on Auth screen)
 * Dark theme (#0b0b0b), OrbitBill logo mark + wordmark, headline,
 * 4 feature rows, hero visual fallback, and trust footer.
 */
export const BrandPanel = () => {
  const features = [
    { label: STRINGS.FEATURES.RECURRING_BILLING, icon: Repeat },
    { label: STRINGS.FEATURES.AUTOMATED_INVOICING, icon: FileText },
    { label: STRINGS.FEATURES.CUSTOMER_MANAGEMENT, icon: Users },
    { label: STRINGS.FEATURES.REALTIME_REPORTING, icon: BarChart3 },
  ];

  return (
    <div className="relative flex flex-col justify-between h-full bg-[#0b0b0b] text-white p-8 lg:p-14 overflow-hidden select-none">
      {/* Decorative backdrop glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-white/[0.04] to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 flex items-center gap-3">
        <LogoMark className="w-8 h-8 text-white" />
        <span className="font-semibold text-lg tracking-tight text-white">
          {STRINGS.BRAND_NAME}
        </span>
      </div>

      {/* Middle Content */}
      <div className="relative z-10 my-auto py-8 space-y-8 max-w-lg">
        {/* Headline */}
        <div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {STRINGS.BRAND_TAGLINE_P1}{' '}
            <span className="text-[#888888] font-normal">{STRINGS.BRAND_TAGLINE_P2}</span>
          </h1>
          <p className="mt-4 text-sm lg:text-base text-neutral-400 leading-relaxed max-w-md">
            {STRINGS.BRAND_SUBTITLE}
          </p>
        </div>

        {/* Feature Rows */}
        <div className="space-y-3.5">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="flex items-center gap-3 text-sm text-neutral-300">
                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300">
                  <Icon size={15} />
                </div>
                <span>{feat.label}</span>
              </div>
            );
          })}
        </div>

        {/* Hero Visual */}
        <div className="relative mt-6 rounded-[16px] overflow-hidden border border-white/10 shadow-2xl bg-[#141414]">
          <img
            src={heroImg}
            alt="OrbitBill Platform preview"
            className="w-full h-44 object-cover object-top opacity-90 transition-opacity hover:opacity-100"
            onError={(e) => {
              // Hide image tag if loading fails and fallback to pure gradient card
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-xs text-neutral-500 pt-6 border-t border-white/10">
        {STRINGS.BRAND_FOOTER}
      </div>
    </div>
  );
};
