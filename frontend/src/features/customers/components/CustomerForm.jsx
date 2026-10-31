import { useState, useEffect } from 'react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { isValidEmail } from '../../../lib/validators';

/**
 * CustomerForm Drawer component (Create & Edit)
 */
export const CustomerForm = ({ customer, onSubmit, onCancel, submitting }) => {
  const isEdit = !!customer?._id;

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    gstin: '',
    line1: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    notes: '',
    isActive: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        company: customer.company || '',
        email: customer.email || '',
        phone: customer.phone || '',
        gstin: customer.gstin || '',
        line1: customer.address?.line1 || customer.address?.street || '',
        city: customer.address?.city || '',
        state: customer.address?.state || '',
        pincode: customer.address?.pincode || customer.address?.postalCode || '',
        country: customer.address?.country || 'India',
        notes: customer.notes || '',
        isActive: customer.isActive ?? true,
      });
    }
  }, [customer]);

  const handleChange = (field, value) => {
    const finalVal = field === 'gstin' ? value.toUpperCase() : value;
    setFormData((prev) => ({ ...prev, [field]: finalVal }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.name.trim()) {
      nextErrors.name = 'Customer name is required.';
    }
    if (!formData.email.trim()) {
      nextErrors.email = 'Email address is required.';
    } else if (!isValidEmail(formData.email.trim())) {
      nextErrors.email = 'Please provide a valid email address.';
    }

    if (formData.gstin.trim()) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(formData.gstin.trim())) {
        nextErrors.gstin = 'Invalid 15-character GSTIN format (e.g. 27AABCU9603R1ZN).';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      company: formData.company.trim(),
      gstin: formData.gstin.trim(),
      address: {
        line1: formData.line1.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        country: formData.country.trim(),
      },
      notes: formData.notes.trim(),
      isActive: Boolean(formData.isActive),
    };

    onSubmit(payload, setErrors);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
      {/* 2-Column Grid: Name & Company */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          id="customer-name"
          label="Full Name *"
          placeholder="e.g. Alex Mercer"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
          required
        />
        <Input
          id="customer-company"
          label="Company Name"
          placeholder="e.g. Acme Corp"
          value={formData.company}
          onChange={(e) => handleChange('company', e.target.value)}
          error={errors.company}
        />
      </div>

      {/* 2-Column Grid: Email & Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          id="customer-email"
          type="email"
          label="Email Address *"
          placeholder="e.g. alex@acmecorp.com"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          error={errors.email}
          required
        />
        <Input
          id="customer-phone"
          label="Phone Number"
          placeholder="e.g. +91 98765 43210"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          error={errors.phone}
        />
      </div>

      {/* GSTIN */}
      <Input
        id="customer-gstin"
        label="GSTIN (optional)"
        placeholder="e.g. 27AABCU9603R1ZN"
        value={formData.gstin}
        onChange={(e) => handleChange('gstin', e.target.value)}
        error={errors.gstin}
      />

      {/* Address Block */}
      <div className="pt-2 border-t border-black/5 space-y-3">
        <span className="text-xs font-semibold text-neutral-800 block">Address (optional)</span>

        <Input
          id="customer-street"
          label="Street Address"
          placeholder="e.g. 123 Business Park, GIDC"
          value={formData.line1}
          onChange={(e) => handleChange('line1', e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="customer-city"
            label="City"
            placeholder="e.g. Surat"
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
          />
          <Input
            id="customer-state"
            label="State"
            placeholder="e.g. Gujarat"
            value={formData.state}
            onChange={(e) => handleChange('state', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="customer-pincode"
            label="Postal Code"
            placeholder="e.g. 395001"
            value={formData.pincode}
            onChange={(e) => handleChange('pincode', e.target.value)}
          />
          <Input
            id="customer-country"
            label="Country"
            placeholder="e.g. India"
            value={formData.country}
            onChange={(e) => handleChange('country', e.target.value)}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5 text-left pt-2 border-t border-black/5">
        <label htmlFor="customer-notes" className="text-xs font-medium text-neutral-700">
          Notes
        </label>
        <textarea
          id="customer-notes"
          rows={3}
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Important notes regarding this customer..."
          className="w-full bg-white text-neutral-900 placeholder:text-neutral-400 text-sm rounded-[10px] border border-black/10 hover:border-black/20 focus:border-black focus:ring-2 focus:ring-black/5 p-3 outline-none transition-all shadow-sm"
        />
      </div>

      {/* Active Toggle */}
      <div className="pt-2 border-t border-black/5">
        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-neutral-700 select-none">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
            className="w-4 h-4 rounded text-black focus:ring-black accent-black cursor-pointer"
          />
          <span className="font-medium text-neutral-900">
            {formData.isActive ? 'Active Customer' : 'Inactive Customer'}
          </span>
        </label>
      </div>

      {/* Footer Actions */}
      <div className="pt-4 border-t border-black/10 flex items-center justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          {isEdit ? 'Save Changes' : 'Create Customer'}
        </Button>
      </div>
    </form>
  );
};
