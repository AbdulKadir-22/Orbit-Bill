import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NAVIGATION_CONFIG } from '../../constants/navigation';
import { STRINGS } from '../../constants/strings';

/**
 * OrbitBill Logo Mark (white ring / orbit)
 */
export const LogoMark = ({ className = 'w-7 h-7' }) => {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="3" strokeDasharray="60 30" />
      <circle cx="16" cy="16" r="6" fill="currentColor" />
    </svg>
  );
};

/**
 * Sidebar component
 * Near-black (#0b0b0b), white text, muted gray for inactive items, active lighter dark pill.
 */
export const Sidebar = ({ onNavigate }) => {
  const { role } = useAuth();

  return (
    <aside className="w-64 h-full bg-[#0b0b0b] text-white flex flex-col border-r border-[#1a1a1a]">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-[#1a1a1a]">
        <div className="text-white">
          <LogoMark />
        </div>
        <span className="font-semibold text-base tracking-tight text-white">
          {STRINGS.BRAND_NAME}
        </span>
      </div>

      {/* Navigation list */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6 sidebar-scroll">
        {NAVIGATION_CONFIG.map((group, groupIdx) => {
          const visibleItems = group.items.filter((item) =>
            item.roles.includes(role)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.group || groupIdx}>
              {groupIdx > 0 && <div className="h-[1px] bg-[#1a1a1a] my-4 mx-3" />}
              <nav className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      onClick={onNavigate}
                      end={item.path === '/dashboard' || item.path === '/my/dashboard'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-[#222222] text-white'
                            : 'text-[#888888] hover:text-white hover:bg-[#171717]'
                        }`
                      }
                    >
                      <Icon size={18} className="shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
