import { useState } from 'react';
import { STRINGS } from '../../../constants/strings';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

export const UserForm = ({
  initialData = null,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState(() => ({
    name: initialData?.name || '',
    email: initialData?.email || '',
    age: initialData?.age !== undefined && initialData?.age !== null ? String(initialData.age) : '',
  }));

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = STRINGS.VALIDATION.NAME_REQUIRED;
    } else if (formData.name.trim().length < 2 || formData.name.trim().length > 50) {
      newErrors.name = STRINGS.VALIDATION.NAME_LENGTH;
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!formData.email.trim()) {
      newErrors.email = STRINGS.VALIDATION.EMAIL_REQUIRED;
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = STRINGS.VALIDATION.EMAIL_INVALID;
    }

    if (formData.age !== '') {
      const parsedAge = Number(formData.age);
      if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 120 || !Number.isInteger(parsedAge)) {
        newErrors.age = STRINGS.VALIDATION.AGE_INVALID;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: formData.name.trim(),
      email: formData.email.trim(),
      age: formData.age !== '' ? Number(formData.age) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input
        id="user-form-name"
        name="name"
        label={STRINGS.FIELD_NAME_LABEL}
        hint={STRINGS.FIELD_NAME_HINT}
        placeholder={STRINGS.FIELD_NAME_PLACEHOLDER}
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        disabled={isSubmitting}
        autoFocus
      />

      <Input
        id="user-form-email"
        name="email"
        type="email"
        label={STRINGS.FIELD_EMAIL_LABEL}
        hint={STRINGS.FIELD_EMAIL_HINT}
        placeholder={STRINGS.FIELD_EMAIL_PLACEHOLDER}
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        disabled={isSubmitting}
      />

      <Input
        id="user-form-age"
        name="age"
        type="number"
        min="0"
        max="120"
        label={STRINGS.FIELD_AGE_LABEL}
        hint={STRINGS.FIELD_AGE_HINT}
        placeholder={STRINGS.FIELD_AGE_PLACEHOLDER}
        value={formData.age}
        onChange={handleChange}
        error={errors.age}
        disabled={isSubmitting}
      />

      <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-border border-dashed">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {STRINGS.BTN_CANCEL}
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? STRINGS.SUBMITTING_FORM
            : initialData
            ? STRINGS.BTN_UPDATE
            : STRINGS.BTN_CREATE}
        </Button>
      </div>
    </form>
  );
};
