import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { CURRENCY_SYMBOL } from '../../../lib/utils';

/**
 * VariantsEditor component
 * Inline editable table with columns: # | Variant Name | SKU | Price Adjustment | Delete
 */
export const VariantsEditor = ({ variants = [], onChange }) => {
  const addVariant = () => {
    const nextIndex = variants.length + 1;
    onChange([
      ...variants,
      {
        name: `Variant ${nextIndex}`,
        sku: `SKU-${Date.now().toString().slice(-4)}`,
        priceDelta: 0,
        isActive: true,
      },
    ]);
  };

  const updateVariant = (index, field, value) => {
    const updated = [...variants];
    updated[index] = {
      ...updated[index],
      [field]: field === 'priceDelta' ? (value === '' ? '' : Number(value)) : value,
    };
    onChange(updated);
  };

  const removeVariant = (index) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">Variants</h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Add product variants with price adjustments (e.g. by edition, storage, tier).
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={addVariant}
          leadingIcon={Plus}
        >
          Add Variant
        </Button>
      </div>

      {variants.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-black/10 rounded-[12px] bg-neutral-50/50">
          <p className="text-xs text-neutral-500">
            No variants configured. Click &ldquo;Add Variant&rdquo; to add options.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[12px] border border-black/10 bg-white">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-black/5 bg-neutral-50/75 text-neutral-500 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3 w-10">#</th>
                <th className="py-2.5 px-3">Variant Name *</th>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3">Price Adjustment</th>
                <th className="py-2.5 px-3 w-12 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {variants.map((v, idx) => (
                <tr key={idx} className="hover:bg-neutral-50/50">
                  <td className="py-2 px-3 text-neutral-400 font-mono">{idx + 1}</td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={v.name || ''}
                      onChange={(e) => updateVariant(idx, 'name', e.target.value)}
                      placeholder="e.g. Standard"
                      className="w-full bg-white border border-black/10 rounded-[6px] px-2.5 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-black"
                      required
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={v.sku || ''}
                      onChange={(e) => updateVariant(idx, 'sku', e.target.value)}
                      placeholder="e.g. PROD-STD"
                      className="w-full bg-white border border-black/10 rounded-[6px] px-2.5 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-black"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-neutral-400 pointer-events-none">
                        {CURRENCY_SYMBOL}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={v.priceDelta ?? 0}
                        onChange={(e) => updateVariant(idx, 'priceDelta', e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-white border border-black/10 rounded-[6px] pl-6 pr-2.5 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-black"
                      />
                    </div>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => removeVariant(idx)}
                      className="p-1 rounded text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                      aria-label="Remove variant"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
