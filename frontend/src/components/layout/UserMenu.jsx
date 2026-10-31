import { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { STRINGS } from '../../constants/strings';

/**
 * UserMenu primitive in Topbar
 * Displays user initials avatar, name, role badge, and dropdown with Sign out.
 */
export const UserMenu = () => {
  const { user, role, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const initials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

  const roleLabel =
    role === 'admin'
      ? STRINGS.ROLES.ADMIN
      : role === 'staff'
      ? STRINGS.ROLES.STAFF
      : STRINGS.ROLES.CUSTOMER;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2.5 p-1.5 pl-2.5 pr-2 rounded-full border border-black/10 hover:border-black/20 hover:bg-neutral-100 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-black/10"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="flex flex-col text-right leading-tight">
          <span className="text-xs font-semibold text-neutral-900 max-w-[130px] truncate">
            {user?.name || 'User'}
          </span>
          <span className="text-[10px] text-neutral-500 capitalize">{roleLabel}</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold tracking-wider">
          {initials}
        </div>
        <ChevronDown size={14} className="text-neutral-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-[14px] shadow-xl border border-black/10 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-black/5">
            <p className="text-xs font-medium text-neutral-900 truncate">{user?.name}</p>
            <p className="text-[11px] text-neutral-500 truncate">{user?.email}</p>
          </div>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-[8px] transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              <span>{STRINGS.USER_MENU.SIGN_OUT}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
