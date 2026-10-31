import { useState, useEffect } from 'react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { MultiSelect } from '../../../components/ui/MultiSelect';
import { productService } from '../../products/services/productService';
import { DISCOUNT_TYPE_OPTIONS, APPLIES_TO_OPTIONS } from '../../../constants/options';
import { CURRENCY_SYMBOL } from '../../../lib/utils';

/**
 * DiscountForm Drawer component
 */
export const DiscountForm = ({ discount, onSubmit, onCancel, submitting }) => {
  const isEdit = !!discount?._id;

  const [formData, setFormData] = useState({
    name: '',
    type: 'percentage',
    value: 10,
    minPurchase: 0,
    minQuantity: 0,
    appliesTo: 'subscription',
    productIds: [],
    startDate: '',
    endDate: '',
    usageLimit: '',
    isActive: true,
  });

  const [productsList, setProductsList] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Load products for MultiSelect
    const fetchActiveProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await productService.list({ limit: 100, isActive: true });
        setProductsList(
          (res.data || []).map((p) => ({
            value: p._id,
            label: p.name,
            sublabel: `${CURRENCY_SYMBOL}${p.salesPrice} (${p.type})`,
          }))
        );
      } catch {
        setProductsList([]);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchActiveProducts();
  }, []);

  useEffect(() => {
    if (discount) {
      setFormData({
        name: discount.name || '',
        type: discount.type || 'percentage',
        value: discount.value ?? 10,
        minPurchase: discount.minPurchase ?? 0,
        minQuantity: discount.minQuantity ?? 0,
        appliesTo: discount.appliesTo || 'subscription',
        productIds: Array.isArray(discount.productIds)
          ? discount.productIds.map((p) => (typeof p === 'object' ? p._id : p))
          : [],
        startDate: discount.startDate
          ? new Date(discount.startDate).toISOString().split('T')[0]
          : '',
        endDate: discount.endDate
          ? new Date(discount.endDate).toISOString().split('T')[0]
          : '',
        usageLimit: discount.usageLimit != null ? String(discount.usageLimit) : '',
        isActive: discount.isActive ?? true,
      });
    }
  }, [discount]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.name.trim()) {
      nextErrors.name = 'Discount name is required.';
    }
    const valNum = Number(formData.value);
    if (isNaN(valNum) || valNum <= 0) {
      nextErrors.value = 'Discount value must be greater than 0.';
    } else if (formData.type === 'percentage' && valNum > 100) {
      nextErrors.value = 'Percentage discount cannot exceed 100%.';
    }

    if (formData.appliesTo === 'products' && formData.productIds.length === 0) {
      nextErrors.productIds = 'Please select at least one product.';
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) <= new Date(formData.startDate)) {
        nextErrors.endDate = 'End date must be strictly after start date.';
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
      type: formData.type,
      value: Number(formData.value),
      minPurchase: Number(formData.minPurchase) || 0,
      minQuantity: parseInt(formData.minQuantity, 10) || 0,
      appliesTo: formData.appliesTo,
      productIds: formData.appliesTo === 'products' ? formData.productIds : [],
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      usageLimit:
        formData.usageLimit !== '' && formData.usageLimit !== null
          ? parseInt(formData.usageLimit, 10)
          : null,
      isActive: Boolean(formData.isActive),
    };

    onSubmit(payload);
  };

  const discountTypeOptions = DISCOUNT_TYPE_OPTIONS.filter((o) => o.value !== '');

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {isEdit && (
        <div className="bg-neutral-50 border border-black/5 rounded-[10px] p-3 text-xs text-neutral-600 flex items-center justify-between">
          <span>Times Used:</span>
          <strong className="text-neutral-900 font-mono text-sm">{discount.usedCount || 0}</strong>
        </div>
      )}

      <Input
        id="discount-name"
        label="Discount Name *"
        placeholder="e.g. Summer Special 15%"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        error={errors.name}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          id="discount-type"
          label="Discount Type *"
          value={formData.type}
          onChange={(e) => handleChange('type', e.target.value)}
          options={discountTypeOptions}
          required
        />

        <div className="flex flex-col gap-1.5 text-left">
          <label htmlFor="discount-value" className="text-xs font-medium text-neutral-700">
            Value * ({formData.type === 'percentage' ? '%' : CURRENCY_SYMBOL})
          </label>
          <div className="relative flex items-center">
            <input
              id="discount-value"
              type="number"
              step="0.01"
              min="0"
              max={formData.type === 'percentage' ? '100' : undefined}
              value={formData.value}
              onChange={(e) => handleChange('value', e.target.value)}
              className="w-full bg-white text-neutral-900 text-sm rounded-[10px] border border-black/10 py-2 pl-3.5 pr-8 outline-none"
              required
            />
            <span className="absolute right-3 text-neutral-400 pointer-events-none text-sm">
              {formData.type === 'percentage' ? '%' : CURRENCY_SYMBOL}
            </span>
          </div>
          {errors.value && <span className="text-xs text-red-600">{errors.value}</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="discount-min-purchase"
          type="number"
          min="0"
          step="0.01"
          label="Min Purchase ($)"
          value={formData.minPurchase}
          onChange={(e) => handleChange('minPurchase', e.target.value)}
        />
        <Input
          id="discount-min-quantity"
          type="number"
          min="0"
          label="Min Quantity"
          value={formData.minQuantity}
          onChange={(e) => handleChange('minQuantity', e.target.value)}
        />
      </div>

      <Select
        id="discount-applies-to"
        label="Applies To *"
        value={formData.appliesTo}
        onChange={(e) => handleChange('appliesTo', e.target.value)}
        options={APPLIES_TO_OPTIONS}
        required
      />

      {/* Product Selection if appliesTo === 'products' */}
      {formData.appliesTo === 'products' && (
        <MultiSelect
          label="Select Eligible Products *"
          options={productsList}
          value={formData.productIds}
          onChange={(ids) => handleChange('productIds', ids)}
          error={errors.productIds}
          placeholder="Filter products..."
          emptyMessage={loadingProducts ? 'Loading products...' : 'No active products available'}
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="discount-start-date"
          type="date"
          label="Start Date"
          value={formData.startDate}
          onChange={(e) => handleChange('startDate', e.target.value)}
        />
        <Input
          id="discount-end-date"
          type="date"
          label="End Date"
          value={formData.endDate}
          onChange={(e) => handleChange('endDate', e.target.value)}
          error={errors.endDate}
        />
      </div>

      <Input
        id="discount-usage-limit"
        type="number"
        min="1"
        label="Usage Limit (leave empty for unlimited)"
        placeholder="e.g. 100"
        value={formData.usageLimit}
        onChange={(e) => handleChange('usageLimit', e.target.value)}
      />

      <div className="pt-2 border-t border-black/5">
        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-neutral-700 select-none">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
            className="w-4 h-4 rounded text-black focus:ring-black accent-black cursor-pointer"
          />
          <span className="font-medium text-neutral-900">
            {formData.isActive ? 'Active Promotion' : 'Inactive Promotion'}
          </span>
        </label>
      </div>

      <div className="pt-4 border-t border-black/10 flex items-center justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          {isEdit ? 'Save Changes' : 'Create Discount'}
        </Button>
      </div>
    </form>
  );
};
