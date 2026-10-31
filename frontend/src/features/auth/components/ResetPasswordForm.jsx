import { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { PasswordRules } from './PasswordRules';
import { STRINGS } from '../../../constants/strings';
import { isStrongPassword } from '../../../lib/validators';

/**
 * ResetPasswordForm component
 * Displayed when user lands on /auth?token=<token>
 */
export const ResetPasswordForm = ({ token, onResetPassword, isSubmitting }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const nextErrors = {};

    if (!password) {
      nextErrors.password = 'New password is required.';
    } else if (!isStrongPassword(password)) {
      nextErrors.password = 'Password does not meet all security requirements.';
    }

    if (password !== confirmPassword) {
      nextErrors.confirmPassword = STRINGS.AUTH.ERROR_PASSWORD_MISMATCH;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onResetPassword({ token, password }, setErrors);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Input
        id="reset-password"
        type="password"
        label={STRINGS.AUTH.FIELD_NEW_PASSWORD}
        placeholder={STRINGS.AUTH.FIELD_NEW_PASSWORD_PLACEHOLDER}
        leadingIcon={Lock}
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
        }}
        error={errors.password}
        disabled={isSubmitting}
        required
      />

      {password.length > 0 && <PasswordRules password={password} />}

      <Input
        id="reset-confirm-password"
        type="password"
        label={STRINGS.AUTH.FIELD_CONFIRM_PASSWORD}
        placeholder={STRINGS.AUTH.FIELD_CONFIRM_PASSWORD_PLACEHOLDER}
        leadingIcon={Lock}
        value={confirmPassword}
        onChange={(e) => {
          setConfirmPassword(e.target.value);
          if (errors.confirmPassword) {
            setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
          }
        }}
        error={errors.confirmPassword}
        disabled={isSubmitting}
        required
      />

      <Button
        type="submit"
        variant="primary"
        size="md"
        className="w-full mt-2"
        loading={isSubmitting}
        trailingIcon={ArrowRight}
      >
        {STRINGS.AUTH.BTN_RESET_PASSWORD}
      </Button>
    </form>
  );
};
