import { useState } from 'react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { STRINGS } from '../../../constants/strings';
import { isValidEmail } from '../../../lib/validators';

/**
 * LoginForm component
 * Manages email, password, remember me, forgot-password trigger.
 */
export const LoginForm = ({ onLogin, onForgotPassword, isSubmitting }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [errors, setErrors] = useState({});

  const validate = () => {
    const nextErrors = {};
    if (!email.trim()) {
      nextErrors.email = 'Email address is required.';
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Please provide a valid email format.';
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onLogin({ email: email.trim(), password, rememberMe }, setErrors);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Input
        id="login-email"
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
        id="login-password"
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

      <div className="flex items-center justify-between pt-1 pb-1">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black accent-black cursor-pointer"
          />
          <span className="text-xs text-neutral-600 font-medium">
            {STRINGS.AUTH.REMEMBER_ME}
          </span>
        </label>

        <button
          type="button"
          onClick={onForgotPassword}
          className="text-xs font-semibold text-neutral-800 hover:text-black hover:underline transition-colors cursor-pointer"
        >
          {STRINGS.AUTH.FORGOT_PASSWORD_LINK}
        </button>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="md"
        className="w-full"
        loading={isSubmitting}
        trailingIcon={ArrowRight}
      >
        {STRINGS.AUTH.BTN_LOGIN}
      </Button>
    </form>
  );
};
