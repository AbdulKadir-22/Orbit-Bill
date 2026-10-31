import { useState } from 'react';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { STRINGS } from '../../../constants/strings';
import { isValidEmail } from '../../../lib/validators';

/**
 * ForgotPasswordForm component
 * Neutral message displayed on completion regardless of email existence.
 */
export const ForgotPasswordForm = ({ onSendReset, onBackToLogin, isSubmitting }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Please provide a valid email format.');
      return;
    }

    setError('');
    const success = await onSendReset({ email: email.trim() });
    if (success) {
      setSubmittedMessage(STRINGS.AUTH.SUCCESS_RESET_SENT);
    }
  };

  return (
    <div className="space-y-5">
      {submittedMessage ? (
        <div className="space-y-4">
          <div className="p-4 rounded-[12px] bg-neutral-50 border border-black/5 text-sm text-neutral-700 leading-relaxed text-left">
            {submittedMessage}
          </div>
          <Button
            variant="secondary"
            size="md"
            className="w-full"
            onClick={onBackToLogin}
            leadingIcon={ArrowLeft}
          >
            {STRINGS.AUTH.BACK_TO_LOGIN}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            id="forgot-email"
            type="email"
            label={STRINGS.AUTH.FIELD_EMAIL}
            placeholder={STRINGS.AUTH.FIELD_EMAIL_PLACEHOLDER}
            leadingIcon={Mail}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            error={error}
            disabled={isSubmitting}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full"
            loading={isSubmitting}
            trailingIcon={ArrowRight}
          >
            {STRINGS.AUTH.BTN_SEND_RESET}
          </Button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-xs font-semibold text-neutral-600 hover:text-black transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={13} />
              <span>{STRINGS.AUTH.BACK_TO_LOGIN}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
