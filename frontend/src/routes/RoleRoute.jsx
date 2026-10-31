import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getRoleHomePath } from '../constants/roles';
import { STRINGS } from '../constants/strings';
import { Button } from '../components/ui/Button';

/**
 * RoleRoute guard
 * Restricts access to specified roles. If role is not permitted, renders clean No Access state.
 */
export const RoleRoute = ({ allowedRoles = [], requiredPermission, children }) => {
  const { role, hasPermission } = useAuth();

  const isRoleAllowed = !allowedRoles.length || (role && allowedRoles.includes(role));
  const isPermissionAllowed = !requiredPermission || hasPermission(requiredPermission);
  const isAllowed = isRoleAllowed && isPermissionAllowed;

  if (!isAllowed) {
    const homePath = getRoleHomePath(role);

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4">
          <ShieldAlert size={28} />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">
          {STRINGS.NO_ACCESS.TITLE}
        </h2>
        <p className="text-sm text-neutral-500 max-w-sm mb-6 leading-relaxed">
          {STRINGS.NO_ACCESS.DESCRIPTION}
        </p>
        <Link to={homePath}>
          <Button variant="primary" size="md">
            {STRINGS.NO_ACCESS.BACK_HOME}
          </Button>
        </Link>
      </div>
    );
  }

  return children;
};
