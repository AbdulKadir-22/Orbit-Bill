import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { getRoleHomePath } from '../../constants/roles';
import { STRINGS } from '../../constants/strings';

/**
 * PlaceholderPage
 * Displayed for planned routes so the navigation hierarchy is testable.
 */
export const PlaceholderPage = ({ title, subtitle }) => {
  const { role } = useAuth();
  const homePath = getRoleHomePath(role);

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={subtitle || `${title} ${STRINGS.PLACEHOLDER.TITLE_SUFFIX}`}
      >
        <Badge variant="neutral">{STRINGS.PLACEHOLDER.BADGE}</Badge>
      </PageHeader>

      <Card className="flex flex-col items-center justify-center text-center py-16 px-6">
        <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 mb-4">
          <Sparkles size={22} />
        </div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-2">
          {STRINGS.PLACEHOLDER.HEADING}
        </h2>
        <p className="text-sm text-neutral-500 max-w-md mb-6 leading-relaxed">
          {STRINGS.PLACEHOLDER.DESCRIPTION}
        </p>
        <Link to={homePath}>
          <Button variant="secondary" size="sm">
            {STRINGS.PLACEHOLDER.BACK_TO_DASHBOARD}
          </Button>
        </Link>
      </Card>
    </div>
  );
};
