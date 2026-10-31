import { Badge } from '../ui/Badge';
import { getStatusBadgeVariant } from '../../constants/statusStyles';

/**
 * InvoiceStatusBadge component
 * Statuses:
 * - draft (gray / neutral)
 * - confirmed (blue / info)
 * - paid (green / success)
 * - cancelled (red / danger)
 * - overdue (red / danger) -> shown when status is confirmed, amountDue > 0, and dueDate is past,
 *   or if invoice.isOverdue === true, or status === 'overdue'.
 *
 * NOTE: There is NO 'Unpaid' status anywhere.
 */
export const InvoiceStatusBadge = ({ invoice = {}, status, className = '' }) => {
  const rawStatus = (status || invoice?.status || 'draft').toLowerCase();
  const amountDue = invoice?.amountDue ?? (invoice?.grandTotal ?? 0);
  const dueDate = invoice?.dueDate;

  const isOverdue =
    rawStatus === 'overdue' ||
    invoice?.isOverdue === true ||
    (rawStatus === 'confirmed' &&
      amountDue > 0 &&
      dueDate &&
      new Date(dueDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0));

  const displayStatus = isOverdue ? 'overdue' : rawStatus;
  const label = isOverdue
    ? 'Overdue'
    : displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1);

  const variant = getStatusBadgeVariant('invoice', displayStatus);

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
};
