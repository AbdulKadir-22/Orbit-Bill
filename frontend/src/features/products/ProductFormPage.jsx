import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Save } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import { VariantsEditor } from './components/VariantsEditor';
import { productService } from './services/productService';
import { PRODUCT_TYPE_OPTIONS } from '../../constants/options';
import { CURRENCY_SYMBOL } from '../../lib/utils';

/**
 * ProductFormPage (/products/new and /products/:id/edit)
 */
export const ProductFormPage = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'software',
    salesPrice: 0,
    costPrice: 0,
    notes: '',
    isActive: true,
    variants: [],
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isEdit) return;
    const fetchProduct = async () => {
      try {
        const prod = await productService.getById(id);
        if (prod) {
          setFormData({
            name: prod.name || '',
            type: prod.type || 'software',
            salesPrice: prod.salesPrice ?? 0,
            costPrice: prod.costPrice ?? 0,
            notes: prod.notes || '',
            isActive: prod.isActive ?? true,
            variants: prod.variants || [],
          });
        }
      } catch {
        toast.error('Failed to load product details.');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, isEdit, navigate, toast]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.name.trim()) {
      nextErrors.name = 'Product name is required.';
    }
    if (!formData.type) {
      nextErrors.type = 'Product type is required.';
    }
    if (Number(formData.salesPrice) < 0) {
      nextErrors.salesPrice = 'Sales price must be at least 0.';
    }
    if (Number(formData.costPrice) < 0) {
      nextErrors.costPrice = 'Cost price must be at least 0.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        salesPrice: Number(formData.salesPrice),
        costPrice: Number(formData.costPrice),
        notes: formData.notes.trim(),
        isActive: formData.isActive,
        variants: formData.variants.map((v) => ({
          name: v.name.trim(),
          sku: v.sku ? v.sku.trim() : `SKU-${Date.now().toString().slice(-4)}`,
          priceDelta: Number(v.priceDelta || 0),
          isActive: v.isActive ?? true,
        })),
      };

      if (isEdit) {
        await productService.update(id, payload);
        toast.success('Product updated successfully.');
      } else {
        await productService.create(payload);
        toast.success('Product created successfully.');
      }
      navigate('/products');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save product.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const typeSelectOptions = PRODUCT_TYPE_OPTIONS.filter((o) => o.value !== '');

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-black/[0.06]">
        <div>
          {/* Breadcrumb */}
          <nav className="text-xs text-neutral-400 mb-1 flex items-center gap-1.5">
            <Link to="/products" className="hover:text-black transition-colors">
              Products
            </Link>
            <span>›</span>
            <span className="text-neutral-700 font-medium">
              {isEdit ? 'Edit Product' : 'Add Product'}
            </span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            {isEdit ? 'Edit Product' : 'Add Product'}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Create a new product with variants and pricing.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => navigate('/products')}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={submitting}
            leadingIcon={Save}
          >
            Save Product
          </Button>
        </div>
      </div>

      {/* Form Content: 2 Cards Top, 1 Card Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Basic Information (2 cols) */}
        <Card className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-900 border-b border-black/5 pb-2.5">
            Basic Information
          </h2>

          <Input
            id="product-name"
            label="Product Name *"
            placeholder="Enter product name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            required
          />

          <Select
            id="product-type"
            label="Product Type *"
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value)}
            options={typeSelectOptions}
            error={errors.type}
            required
          />

          <div className="flex flex-col gap-1.5 text-left">
            <label
              htmlFor="product-notes"
              className="text-xs font-medium text-neutral-700"
            >
              Description / Notes
            </label>
            <textarea
              id="product-notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Enter product description (optional)"
              className="w-full bg-white text-neutral-900 placeholder:text-neutral-400 text-sm rounded-[10px] border border-black/10 hover:border-black/20 focus:border-black focus:ring-2 focus:ring-black/5 p-3 outline-none transition-all shadow-sm"
            />
          </div>
        </Card>

        {/* Right Card: Pricing & Status (1 col) */}
        <Card className="space-y-5">
          <h2 className="text-sm font-semibold text-neutral-900 border-b border-black/5 pb-2.5">
            Pricing
          </h2>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5 text-left">
              <label
                htmlFor="sales-price"
                className="text-xs font-medium text-neutral-700"
              >
                Sales Price *
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-neutral-400 pointer-events-none text-sm">
                  {CURRENCY_SYMBOL}
                </span>
                <input
                  id="sales-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.salesPrice}
                  onChange={(e) => handleChange('salesPrice', e.target.value)}
                  className="w-full bg-white text-neutral-900 text-sm rounded-[10px] border border-black/10 hover:border-black/20 focus:border-black py-2 pl-7 pr-3 outline-none shadow-sm"
                  required
                />
              </div>
              {errors.salesPrice && (
                <span className="text-xs text-red-600">{errors.salesPrice}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label
                htmlFor="cost-price"
                className="text-xs font-medium text-neutral-700"
              >
                Cost Price *
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-neutral-400 pointer-events-none text-sm">
                  {CURRENCY_SYMBOL}
                </span>
                <input
                  id="cost-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.costPrice}
                  onChange={(e) => handleChange('costPrice', e.target.value)}
                  className="w-full bg-white text-neutral-900 text-sm rounded-[10px] border border-black/10 hover:border-black/20 focus:border-black py-2 pl-7 pr-3 outline-none shadow-sm"
                  required
                />
              </div>
              {errors.costPrice && (
                <span className="text-xs text-red-600">{errors.costPrice}</span>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-black/5">
            <h3 className="text-xs font-semibold text-neutral-700 mb-2">Status</h3>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
                className="w-4 h-4 rounded text-black focus:ring-black accent-black cursor-pointer"
              />
              <span className="text-xs font-medium text-neutral-800">
                {formData.isActive ? 'Active' : 'Inactive'}
              </span>
            </label>
          </div>
        </Card>
      </div>

      {/* Bottom Card: Variants inline editor */}
      <Card>
        <VariantsEditor
          variants={formData.variants}
          onChange={(v) => handleChange('variants', v)}
        />
      </Card>
    </form>
  );
};
