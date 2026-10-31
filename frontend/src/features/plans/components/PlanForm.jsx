import { useState, useEffect } from 'react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { BILLING_CYCLE_OPTIONS } from '../../../constants/options';
import { CURRENCY_SYMBOL } from '../../../lib/utils';

/**
 * PlanForm Drawer component
 */
export const PlanForm = ({ plan, onSubmit, onCancel, submitting }) => {
  const isEdit = !!plan?._id;

  const [formData, setFormData] = useState({
    name: '',
    billingCycle: 'monthly',
    price: 0,
    minQuantity: 1,
    availableFrom: new Date().toISOString().split('T')[0],
    availableTo: '',
    autoClose: false,
    allowEarlyClose: true,
    allowPause: true,
    allowRenewal: true,
    isActive: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || '',
        billingCycle: plan.billingCycle || 'monthly',
        price: plan.price ?? 0,
        minQuantity: plan.minQuantity ?? 1,
        availableFrom: plan.availableFrom
          ? new Date(plan.availableFrom).toISOString().split('T')[0]
          : '',
        availableTo: plan.availableTo
          ? new Date(plan.availableTo).toISOString().split('T')[0]
          : '',
        autoClose: plan.autoClose ?? false,
        allowEarlyClose: plan.allowEarlyClose ?? true,
        allowPause: plan.allowPause ?? true,
        allowRenewal: plan.allowRenewal ?? true,
        isActive: plan.isActive ?? true,
      });
    }
  }, [plan]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.name.trim()) {
      nextErrors.name = 'Plan name is required.';
    }
    if (Number(formData.price) < 0) {
      nextErrors.price = 'Price must be ≥ 0.';
    }
    if (Number(formData.minQuantity) < 1) {
      nextErrors.minQuantity = 'Min quantity must be at least 1.';
    }
    if (formData.availableFrom && formData.availableTo) {
      if (new Date(formData.availableTo) <= new Date(formData.availableFrom)) {
        nextErrors.availableTo = 'Available To must be after Available From.';
      }
    }
    if (formData.autoClose && !formData.availableTo) {
      nextErrors.availableTo = 'Available To date is required when auto-close is enabled.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: formData.name.trim(),
      billingCycle: formData.billingCycle,
      price: Number(formData.price),
      minQuantity: parseInt(formData.minQuantity, 10) || 1,
      availableFrom: formData.availableFrom
        ? new Date(formData.availableFrom).toISOString()
        : null,
      availableTo: formData.availableTo
        ? new Date(formData.availableTo).toISOString()
        : null,
      autoClose: Boolean(formData.autoClose),
      allowEarlyClose: Boolean(formData.allowEarlyClose),
      allowPause: Boolean(formData.allowPause),
      allowRenewal: Boolean(formData.allowRenewal),
      isActive: Boolean(formData.isActive),
    };

    onSubmit(payload);
  };

  const cycleOptions = BILLING_CYCLE_OPTIONS.filter((o) => o.value !== '');

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <Input
        id="plan-name"
        label="Plan Name *"
        placeholder="e.g. Pro Monthly"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        error={errors.name}
        required
      />

      <Select
        id="plan-billing-cycle"
        label="Billing Cycle *"
        value={formData.billingCycle}
        onChange={(e) => handleChange('billingCycle', e.target.value)}
        options={cycleOptions}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5 text-left">
          <label htmlFor="plan-price" className="text-xs font-medium text-neutral-700">
            Price *
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-neutral-400 pointer-events-none text-sm">
              {CURRENCY_SYMBOL}
            </span>
            <input
              id="plan-price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => handleChange('price', e.target.value)}
              className="w-full bg-white text-neutral-900 text-sm rounded-[10px] border border-black/10 py-2 pl-7 pr-3 outline-none"
              required
            />
          </div>
          {errors.price && <span className="text-xs text-red-600">{errors.price}</span>}
        </div>

        <Input
          id="plan-min-quantity"
          type="number"
          min="1"
          label="Min Quantity *"
          value={formData.minQuantity}
          onChange={(e) => handleChange('minQuantity', e.target.value)}
          error={errors.minQuantity}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="plan-available-from"
          type="date"
          label="Available From"
          value={formData.availableFrom}
          onChange={(e) => handleChange('availableFrom', e.target.value)}
        />
        <Input
          id="plan-available-to"
          type="date"
          label="Available To"
          value={formData.availableTo}
          onChange={(e) => handleChange('availableTo', e.target.value)}
          error={errors.availableTo}
        />
      </div>

      {/* Rules Toggles */}
      <div className="pt-2 border-t border-black/5 space-y-3">
        <span className="text-xs font-semibold text-neutral-800 block">Plan Settings</span>

        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-neutral-700 select-none">
          <input
            type="checkbox"
            checked={formData.autoClose}
            onChange={(e) => handleChange('autoClose', e.target.checked)}
            className="w-4 h-4 rounded text-black focus:ring-black accent-black cursor-pointer"
          />
          <span>Auto-close at end date</span>
        </label>

        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-neutral-700 select-none">
          <input
            type="checkbox"
            checked={formData.allowEarlyClose}
            onChange={(e) => handleChange('allowEarlyClose', e.target.checked)}
            className="w-4 h-4 rounded text-black focus:ring-black accent-black cursor-pointer"
          />
          <span>Allow early close</span>
        </label>

        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-neutral-700 select-none">
          <input
            type="checkbox"
            checked={formData.allowPause}
            onChange={(e) => handleChange('allowPause', e.target.checked)}
            className="w-4 h-4 rounded text-black focus:ring-black accent-black cursor-pointer"
          />
          <span>Allow pause</span>
        </label>

        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-neutral-700 select-none">
          <input
            type="checkbox"
            checked={formData.allowRenewal}
            onChange={(e) => handleChange('allowRenewal', e.target.checked)}
            className="w-4 h-4 rounded text-black focus:ring-black accent-black cursor-pointer"
          />
          <span>Allow renewal</span>
        </label>

        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-neutral-700 select-none pt-1">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
            className="w-4 h-4 rounded text-black focus:ring-black accent-black cursor-pointer"
          />
          <span className="font-medium text-neutral-900">
            {formData.isActive ? 'Active Plan' : 'Inactive Plan'}
          </span>
        </label>
      </div>

      {/* Buttons */}
      <div className="pt-4 border-t border-black/10 flex items-center justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          {isEdit ? 'Save Changes' : 'Create Plan'}
        </Button>
      </div>
    </form>
  );
};
