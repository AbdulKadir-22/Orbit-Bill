import { STRINGS } from '../../../constants/strings';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Edit2, Trash2, Mail, Calendar, Hash } from 'lucide-react';

export const UserCard = ({ user, onEdit, onDelete }) => {
  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="brutal-card p-5 flex flex-col justify-between gap-4 transition-all duration-150 hover:-translate-y-0.5 group">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading font-bold text-lg text-ink group-hover:underline">
              {user.name}
            </h3>
            {user.age !== undefined && user.age !== null && (
              <Badge variant="default">
                {user.age} Y/O
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-ink-muted text-xs font-mono break-all">
            <Mail size={12} className="shrink-0 text-ink" />
            <span>{user.email}</span>
          </div>
        </div>

        <Badge variant="primary" className="shrink-0">
          {STRINGS.USER_STATUS_ACTIVE}
        </Badge>
      </div>

      {/* Meta Information */}
      <div className="border-t border-b border-border/40 py-2.5 flex items-center justify-between text-[11px] font-mono text-ink-muted">
        <div className="flex items-center gap-1">
          <Hash size={11} className="text-ink" />
          <span className="truncate max-w-[120px]" title={user._id}>
            {user._id ? user._id.slice(-8) : 'N/A'}
          </span>
        </div>
        {formattedDate && (
          <div className="flex items-center gap-1">
            <Calendar size={11} className="text-ink" />
            <span>{formattedDate}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onEdit(user)}
          className="flex-1 sm:flex-initial"
        >
          <Edit2 size={13} />
          <span>{STRINGS.BTN_EDIT}</span>
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={() => onDelete(user)}
          className="flex-1 sm:flex-initial"
        >
          <Trash2 size={13} />
          <span>{STRINGS.BTN_DELETE}</span>
        </Button>
      </div>
    </div>
  );
};
