import { Menu } from 'lucide-react';
import { UserMenu } from './UserMenu';

/**
 * Topbar layout component
 * Shows mobile sidebar toggle hamburger and UserMenu on the right.
 * Does not include search bar, bells, or date pickers.
 */
export const Topbar = ({ onToggleSidebar }) => {
  return (
    <header className="h-16 bg-[#f6f5f2]/80 backdrop-blur-md border-b border-black/[0.06] sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-[8px] border border-black/10 hover:bg-black/5 text-neutral-800 transition-colors cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <UserMenu />
      </div>
    </header>
  );
};
