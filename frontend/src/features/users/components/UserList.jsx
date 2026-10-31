import { useState, useMemo } from 'react';
import { STRINGS } from '../../../constants/strings';
import { UserCard } from './UserCard';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Search, Users, RefreshCw } from 'lucide-react';

export const UserList = ({
  users = [],
  isLoading = false,
  onEdit,
  onDelete,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const term = searchTerm.toLowerCase().trim();
    return users.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term))
    );
  }, [users, searchTerm]);

  return (
    <div className="flex flex-col gap-6">
      {/* Control Bar: Search & Refresh */}
      <div className="brutal-card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Input
            id="user-search"
            placeholder={STRINGS.SEARCH_PLACEHOLDER}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-8"
          />
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-ink-muted hover:text-ink cursor-pointer"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <span className="font-mono text-xs font-semibold text-ink-muted">
            {STRINGS.SEARCH_RESULTS_COUNT(filteredUsers.length, users.length)}
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={onRefresh}
            disabled={isLoading}
            className="shrink-0"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>{STRINGS.BTN_REFRESH}</span>
          </Button>
        </div>
      </div>

      {/* Grid or Status View */}
      {isLoading ? (
        <div className="brutal-card p-12 flex flex-col items-center justify-center gap-3 text-center">
          <RefreshCw size={28} className="animate-spin text-ink" />
          <p className="font-mono text-sm font-bold tracking-wider text-ink">
            {STRINGS.LOADING_USERS}
          </p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="brutal-card p-12 flex flex-col items-center justify-center gap-3 text-center">
          <Users size={36} className="text-ink-muted stroke-[1.5]" />
          <h4 className="font-heading font-bold text-lg text-ink">
            {searchTerm ? STRINGS.SEARCH_EMPTY_TITLE : STRINGS.EMPTY_TITLE}
          </h4>
          <p className="text-sm text-ink-muted max-w-sm">
            {searchTerm ? STRINGS.SEARCH_EMPTY_DESCRIPTION : STRINGS.EMPTY_DESCRIPTION}
          </p>
          {searchTerm && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setSearchTerm('')}
              className="mt-2"
            >
              {STRINGS.BTN_SEARCH_CLEAR}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredUsers.map((user) => (
            <UserCard
              key={user._id || user.email}
              user={user}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
