import { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { PasswordRules } from '../../auth/components/PasswordRules';
import { PERMISSIONS_LIST, ALL_PERMISSION_KEYS } from '../../../constants/permissions';
import { isValidEmail, isStrongPassword } from '../../../lib/validators';

/**
 * StaffModal component (Create & Edit Staff Member)
 */
export const StaffModal = ({
  isOpen,
  onClose,
  staff,
  onSubmit,
  submitting,
}) => {
  const isEdit = !!staff?._id;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [permissions, setPermissions] = useState([...ALL_PERMISSION_KEYS]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (staff) {
      setName(staff.name || '');
      setEmail(staff.email || '');
      setPassword('');
      setPermissions(staff.permissions || [...ALL_PERMISSION_KEYS]);
      setErrors({});
    } else {
      setName('');
      setEmail('');
      setPassword('');
      setPermissions([...ALL_PERMISSION_KEYS]);
      setErrors({});
    }
  }, [staff, isOpen]);

  const togglePermission = (key) => {
    if (permissions.includes(key)) {
      setPermissions(permissions.filter((p) => p !== key));
    } else {
      setPermissions([...permissions, key]);
    }
  };

  const toggleAll = () => {
    if (permissions.length === ALL_PERMISSION_KEYS.length) {
      setPermissions([]);
    } else {
      setPermissions([...ALL_PERMISSION_KEYS]);
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (!name.trim()) {
      nextErrors.name = 'Full name is required.';
    }
    if (!email.trim()) {
      nextErrors.email = 'Email address is required.';
    } else if (!isValidEmail(email.trim())) {
      nextErrors.email = 'Please provide a valid email address.';
    }

    if (!isEdit) {
      if (!password) {
        nextErrors.password = 'Password is required.';
      } else if (!isStrongPassword(password)) {
        nextErrors.password = 'Password does not meet requirements.';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = isEdit
      ? {
          name: name.trim(),
          permissions,
        }
      : {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          permissions,
        };

    onSubmit(payload, setErrors);
  };

  const allSelected = permissions.length === ALL_PERMISSION_KEYS.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Staff Member' : 'Add Staff Member'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
        <Input
          id="staff-name"
          label="Full Name *"
          placeholder="e.g. Jane Smith"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
          }}
          error={errors.name}
          required
        />

        <Input
          id="staff-email"
          type="email"
          label="Email Address *"
          placeholder="e.g. jane@orbitbill.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          disabled={isEdit}
          error={errors.email}
          required
        />

        {!isEdit && (
          <div className="space-y-2">
            <Input
              id="staff-password"
              type="password"
              label="Temporary Password *"
              placeholder="Enter strong password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              error={errors.password}
              required
            />
            {password.length > 0 && <PasswordRules password={password} />}
          </div>
        )}

        {/* Permissions Grid */}
        <div className="pt-2 border-t border-black/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-800">
              Assigned Permissions ({permissions.length}/{ALL_PERMISSION_KEYS.length})
            </span>
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs font-semibold text-neutral-600 hover:text-black cursor-pointer"
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="space-y-4 border border-black/10 rounded-[12px] p-3 bg-neutral-50/50">
            {PERMISSIONS_LIST.map((group, gIdx) => (
              <div key={gIdx} className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
                  {group.category}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.permissions.map((p) => {
                    const isChecked = permissions.includes(p.key);
                    return (
                      <label
                        key={p.key}
                        className="flex items-center gap-2 p-1.5 rounded-[8px] hover:bg-neutral-100/70 cursor-pointer text-xs text-neutral-700 select-none transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(p.key)}
                          className="w-4 h-4 rounded text-black focus:ring-black accent-black cursor-pointer shrink-0"
                        />
                        <span className="leading-snug">{p.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-black/10 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            {isEdit ? 'Save Changes' : 'Create Staff Member'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
