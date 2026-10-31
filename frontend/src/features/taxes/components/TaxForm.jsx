import { useState, useEffect } from 'react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

/**
 * TaxForm Drawer component
 * Name*, Rate* (0-100, percent suffix), Active toggle (default on)
 */
export const TaxForm = ({ tax, onSubmit, onCancel, submitting }) => {
  const isEdit = !!tax?._id;

  const [formData, setFormData] = useState({
    name: '',
    rate: 0,
    isActive: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (tax) {
      setFormData({
        name: tax.name || '',
        rate: tax.rate ?? 0,
        isActive: tax.isActive ?? true,
      });
    }
  }, [tax]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.name.trim()) {
      nextErrors.name = 'Tax name is required.';
    }
    const rateNum = Number(formData.rate);
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
      nextErrors.rate = 'Tax rate must be between 0 and 100%.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: formData.name.trim(),
      rate: Number(formData.rate),
      isActive: Boolean(formData.isActive),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <Input
        id="tax-name"
        label="Tax Name *"
        placeholder="e.g. GST (18%)"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        error={errors.name}
        required
      />

      <div className="flex flex-col gap-1.5 text-left">
        <label htmlFor="tax-rate" className="text-xs font-medium text-neutral-700">
          Tax Rate (%) *
        </label>
        <div className="relative flex items-center">
          <input
            id="tax-rate"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.rate}
            onChange={(e) => handleChange('rate', e.target.value)}
            className="w-full bg-white text-neutral-900 text-sm rounded-[10px] border border-black/10 py-2 pl-3.5 pr-8 outline-none"
            required
          />
          <span className="absolute right-3 text-neutral-400 pointer-events-none text-sm">
            %
          </span>
        </div>
        {errors.rate && <span className="text-xs text-red-600">{errors.rate}</span>}
      </div>

      <div className="pt-2 border-t border-black/5">
        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-neutral-700 select-none">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
            className="w-4 h-4 rounded text-black focus:ring-black accent-black cursor-pointer"
          />
          <span className="font-medium text-neutral-900">
            {formData.isActive ? 'Active Tax' : 'Inactive Tax'}
          </span>
        </label>
      </div>

      <div className="pt-4 border-t border-black/10 flex items-center justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          {isEdit ? 'Save Changes' : 'Create Tax'}
        </Button>
      </div>
    </form>
  );
};
