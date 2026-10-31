import { useState } from 'react';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { PasswordRules } from './PasswordRules';
import { STRINGS } from '../../../constants/strings';
import { isValidEmail, isStrongPassword } from '../../../lib/validators';

/**
 * RegisterForm component
 * Manages name, email, password, confirm password, live password rules, and duplicate email mapping.
 */
export const RegisterForm = ({ onRegister, isSubmitting }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState({});

  const validate = () => {
    const nextErrors = {};

    if (!name.trim()) {
      nextErrors.name = 'Full name is required.';
    } else if (name.trim().length < 2) {
      nextErrors.name = 'Name must be at least 2 characters.';
    }

    if (!email.trim()) {
      nextErrors.email = 'Email address is required.';
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Please provide a valid email format.';
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
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
    onRegister(
      {
        name: name.trim(),
        email: email.trim(),
        password,
      },
      setErrors
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Input
        id="register-name"
        type="text"
        label={STRINGS.AUTH.FIELD_NAME}
        placeholder={STRINGS.AUTH.FIELD_NAME_PLACEHOLDER}
        leadingIcon={User}
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
        }}
        error={errors.name}
        disabled={isSubmitting}
        required
      />

      <Input
        id="register-email"
        type="email"
        label={STRINGS.AUTH.FIELD_EMAIL}
        placeholder={STRINGS.AUTH.FIELD_EMAIL_PLACEHOLDER}
        leadingIcon={Mail}
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
        }}
        error={errors.email}
        disabled={isSubmitting}
        required
      />

      <Input
        id="register-password"
        type="password"
        label={STRINGS.AUTH.FIELD_PASSWORD}
        placeholder={STRINGS.AUTH.FIELD_PASSWORD_PLACEHOLDER}
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

      {/* Live password strength indicator */}
      {password.length > 0 && <PasswordRules password={password} />}

      <Input
        id="register-confirm-password"
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
        {STRINGS.AUTH.BTN_REGISTER}
      </Button>
    </form>
  );
};
