import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useCatalog } from '../../hooks/useCatalog';
import { quotationService } from './services/quotationService';
import { calcLines } from '../../lib/calcLines';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Spinner } from '../../components/ui/Spinner';
import { CustomerSelect } from '../../components/common/CustomerSelect';
import { LinesTable } from '../../components/common/LinesTable';
import { useToast } from '../../components/ui/Toast';
import { getStatusBadgeVariant } from '../../constants/statusStyles';
import { formatCurrency } from '../../lib/utils';

export const QuotationFormPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useToast();

  const isEdit = Boolean(id);
  const customerIdParam = searchParams.get('customerId');
  const templateIdParam = searchParams.get('templateId');

  const { products, plans, taxes, loading: catalogLoading } = useCatalog();

  const [loading, setLoading] = useState(isEdit || Boolean(templateIdParam));
  const [saving, setSaving] = useState(false);
  const [quotation, setQuotation] = useState(null);

  // Form Fields
  const [customerId, setCustomerId] = useState(customerIdParam || '');
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [lines, setLines] = useState([]);
  const [errors, setErrors] = useState({});

  // Summary State
  const [summary, setSummary] = useState({
    subtotal: 0,
    discountTotal: 0,
    taxTotal: 0,
    grandTotal: 0,
  });
  const [livePreviewFallback, setLivePreviewFallback] = useState(false);

  // Template Save Modal
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Convert Dialog
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  // Load existing quotation if edit mode, or template if templateId provided
  useEffect(() => {
    let isMounted = true;
    if (isEdit) {
      setLoading(true);
      quotationService
        .getById(id)
        .then((q) => {
          if (!isMounted) return;
          setQuotation(q);
          setCustomerId(q.customerId?._id || q.customerId || '');
          if (q.validUntil) {
            setValidUntil(new Date(q.validUntil).toISOString().split('T')[0]);
          }
          const mappedLines = (q.lines || []).map((l) => ({
            productId: l.productId?._id || l.productId,
            variantId: l.variantId?._id || l.variantId || '',
            planId: l.planId?._id || l.planId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            taxId: l.taxId?._id || l.taxId || '',
            taxRate: l.taxRate,
            amount: l.lineSubtotal ?? (l.quantity * l.unitPrice),
          }));
          setLines(mappedLines);
          setSummary({
            subtotal: q.subtotal || 0,
            discountTotal: q.discountTotal || 0,
            taxTotal: q.taxTotal || 0,
            grandTotal: q.grandTotal || 0,
          });
          setLoading(false);
        })
        .catch((err) => {
          if (!isMounted) return;
          showErrorToast(err?.message || 'Quotation not found');
          setLoading(false);
        });
    } else if (templateIdParam) {
      setLoading(true);
      quotationService
        .listTemplates()
        .then((templates) => {
          if (!isMounted) return;
          const tpl = templates.find((t) => t._id === templateIdParam);
          if (tpl) {
            const mappedLines = (tpl.lines || []).map((l) => ({
              productId: l.productId?._id || l.productId,
              variantId: l.variantId?._id || l.variantId || '',
              planId: l.planId?._id || l.planId,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              taxId: l.taxId?._id || l.taxId || '',
              taxRate: l.taxRate,
              amount: l.lineSubtotal ?? (l.quantity * l.unitPrice),
            }));
            setLines(mappedLines);
          }
          setLoading(false);
        })
        .catch(() => {
          if (isMounted) setLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit, templateIdParam]);

  // Read-only condition: confirmed or expired
  const isConfirmed = quotation?.status === 'confirmed';
  const isExpired =
    quotation?.status === 'expired' ||
    (quotation?.validUntil && new Date(quotation.validUntil) < new Date() && ['draft', 'sent'].includes(quotation?.status));
  const isReadOnly = isConfirmed || isExpired;

  // Debounced server calculation
  const calcTimeoutRef = useRef(null);

  const triggerCalculate = useCallback((currentLines) => {
    if (calcTimeoutRef.current) clearTimeout(calcTimeoutRef.current);

    // Basic client calc first
    const local = calcLines(currentLines);
    setSummary((prev) => ({
      ...prev,
      subtotal: local.subtotal,
      taxTotal: local.taxTotal,
      grandTotal: local.grandTotal,
    }));

    calcTimeoutRef.current = setTimeout(async () => {
      const validPayloadLines = currentLines
        .filter((l) => l.productId && l.planId && l.quantity > 0)
        .map((l) => ({
          productId: l.productId,
          variantId: l.variantId || undefined,
          planId: l.planId,
          quantity: Number(l.quantity),
          taxId: l.taxId || undefined,
          unitPriceOverride: Number(l.unitPrice),
        }));

      if (validPayloadLines.length === 0) return;

      try {
        const res = await quotationService.calculate(validPayloadLines);
        if (res) {
          setSummary({
            subtotal: res.subtotal || local.subtotal,
            taxTotal: res.taxTotal || local.taxTotal,
            discountTotal: res.discountTotal || 0,
            grandTotal: res.grandTotal ?? local.grandTotal,
          });
          setLivePreviewFallback(false);
        }
      } catch {
        setLivePreviewFallback(true);
      }
    }, 400);
  }, []);

  const handleLineChange = (index, field, value) => {
    const updated = [...lines];
    const current = { ...updated[index] };

    if (field === 'productId') {
      current.productId = value;
      const product = products.find((p) => p._id === value);
      current.variantId = '';
      current.unitPrice = product ? product.salesPrice : 0;
      // Default tax to first active tax
      if (!current.taxId && taxes.length > 0) {
        current.taxId = taxes[0]._id;
        current.taxRate = taxes[0].rate;
      }
    } else if (field === 'variantId') {
      current.variantId = value;
      const product = products.find((p) => p._id === current.productId);
      const variant = product?.variants?.find((v) => v._id === value);
      const basePrice = product?.salesPrice || 0;
      const delta = variant?.priceDelta || 0;
      current.unitPrice = Math.max(0, basePrice + delta);
    } else if (field === 'planId') {
      current.planId = value;
      const plan = plans.find((p) => p._id === value);
      if (plan && plan.minQuantity && current.quantity < plan.minQuantity) {
        current.quantity = plan.minQuantity;
      }
    } else if (field === 'quantity') {
      current.quantity = Math.max(1, parseInt(value, 10) || 1);
    } else if (field === 'unitPrice') {
      current.unitPrice = Math.max(0, parseFloat(value) || 0);
    } else if (field === 'taxId') {
      current.taxId = value;
      const tax = taxes.find((t) => t._id === value);
      current.taxRate = tax ? tax.rate : 0;
    }

    current.amount = Math.round(current.quantity * current.unitPrice * 100) / 100;
    updated[index] = current;
    setLines(updated);
    triggerCalculate(updated);
  };

  const handleAddItem = () => {
    const defaultTax = taxes.length > 0 ? taxes[0] : null;
    const newLine = {
      productId: '',
      variantId: '',
      planId: plans.length > 0 ? plans[0]._id : '',
      quantity: 1,
      unitPrice: 0,
      taxId: defaultTax ? defaultTax._id : '',
      taxRate: defaultTax ? defaultTax.rate : 0,
      amount: 0,
    };
    const updated = [...lines, newLine];
    setLines(updated);
    triggerCalculate(updated);
  };

  const handleRemoveItem = (index) => {
    const updated = lines.filter((_, i) => i !== index);
    setLines(updated);
    triggerCalculate(updated);
  };

  const validateForm = () => {
    const errs = {};
    if (!customerId) errs.customerId = 'Customer is required';
    if (!validUntil) errs.validUntil = 'Valid Until date is required';
    if (lines.length === 0) {
      errs.lines = 'At least one line item is required';
    } else {
      const invalid = lines.some((l) => !l.productId || !l.planId || l.quantity < 1);
      if (invalid) {
        errs.lines = 'All line items must have a Product, Plan, and Quantity';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = {
        customerId,
        lines: lines.map((l) => ({
          productId: l.productId,
          variantId: l.variantId || undefined,
          planId: l.planId,
          quantity: Number(l.quantity),
          taxId: l.taxId || undefined,
          unitPriceOverride: Number(l.unitPrice),
        })),
        validityDays: Math.max(1, Math.ceil((new Date(validUntil) - new Date()) / (1000 * 60 * 60 * 24))) || 30,
      };

      if (isEdit) {
        await quotationService.update(id, payload);
        showSuccessToast('Quotation updated successfully');
      } else {
        await quotationService.create(payload);
        showSuccessToast('Quotation created successfully');
      }
      navigate('/quotations');
    } catch (err) {
      showErrorToast(err?.message || 'Failed to save quotation');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) {
      showErrorToast('Please enter a template name');
      return;
    }
    if (lines.length === 0) {
      showErrorToast('At least one item is required for a template');
      return;
    }
    setSavingTemplate(true);
    try {
      await quotationService.createTemplate({
        templateName: templateName.trim(),
        lines: lines.map((l) => ({
          productId: l.productId,
          variantId: l.variantId || undefined,
          planId: l.planId,
          quantity: Number(l.quantity),
          taxId: l.taxId || undefined,
          unitPriceOverride: Number(l.unitPrice),
        })),
        validityDays: 30,
      });
      showSuccessToast('Template saved');
      setIsTemplateModalOpen(false);
      setTemplateName('');
    } catch (err) {
      showErrorToast(err?.message || 'Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleSend = async () => {
    try {
      await quotationService.send(id);
      showSuccessToast('Quotation marked as sent');
      const updated = await quotationService.getById(id);
      setQuotation(updated);
    } catch (err) {
      showErrorToast(err?.message || 'Failed to send quotation');
    }
  };

  const handleConvert = async () => {
    setIsConverting(true);
    try {
      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const res = await quotationService.convert(id, {
        startDate: now.toISOString(),
        expiryDate: thirtyDays.toISOString(),
        paymentTerms: 'Net 15',
      });
      showSuccessToast('Quotation converted into subscription');
      const subId = res?.subscription?._id || res?._id;
      if (subId) {
        navigate(`/subscriptions/${subId}`);
      } else {
        navigate('/subscriptions');
      }
    } catch (err) {
      showErrorToast(err?.message || 'Failed to convert quotation');
    } finally {
      setIsConverting(false);
      setIsConvertOpen(false);
    }
  };

  if (loading || catalogLoading) {
    return (
      <div className="py-24 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const quoteStatus = quotation?.status || 'draft';
  const displayStatus = isExpired ? 'expired' : quoteStatus;

  return (
    <div className="space-y-6">
      {/* Header & Breadcrumb */}
      <div>
        <div className="text-xs text-[#737373] mb-1">
          <Link to="/quotations" className="hover:underline">
            Quotations
          </Link>{' '}
          &gt; {isEdit ? quotation?.quoteNumber || 'Quotation Details' : 'Create Quotation'}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#0b0b0b]">
              {isEdit ? quotation?.quoteNumber : 'Create Quotation'}
            </h1>
            {isEdit && (
              <Badge variant={getStatusBadgeVariant('quotation', displayStatus)}>
                {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isReadOnly && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setIsTemplateModalOpen(true)}
                  disabled={saving}
                >
                  Save as Template
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/quotations')}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveDraft}
                  isLoading={saving}
                >
                  Save Draft
                </Button>
              </>
            )}

            {isEdit && quoteStatus === 'draft' && !isExpired && (
              <Button variant="secondary" onClick={handleSend}>
                Send
              </Button>
            )}

            {isEdit && ['draft', 'sent'].includes(quoteStatus) && !isExpired && (
              <Button variant="primary" onClick={() => setIsConvertOpen(true)}>
                Convert to Subscription
              </Button>
            )}

            {isConfirmed && quotation?.subscriptionId && (
              <Button
                variant="primary"
                onClick={() =>
                  navigate(
                    `/subscriptions/${
                      quotation.subscriptionId?._id || quotation.subscriptionId
                    }`
                  )
                }
              >
                View subscription
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Customer & Details */}
        <Card className="p-6 lg:col-span-2 space-y-4">
          <h2 className="text-base font-semibold text-[#171717]">Customer & Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#171717] mb-1.5">
                Customer <span className="text-red-500">*</span>
              </label>
              {isReadOnly ? (
                <div className="text-sm font-medium text-[#171717]">
                  {quotation?.customerId?.name} ({quotation?.customerId?.email})
                </div>
              ) : (
                <CustomerSelect
                  value={customerId}
                  onChange={setCustomerId}
                  error={errors.customerId}
                  required
                />
              )}
            </div>

            <div>
              <Input
                label="Valid Until"
                type="date"
                required
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                disabled={isReadOnly}
                error={errors.validUntil}
              />
            </div>
          </div>
        </Card>

        {/* Right Card: Summary */}
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-[#171717]">Summary</h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between text-[#525252]">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(summary.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#525252]">
              <span>Discount</span>
              <span className="font-mono text-emerald-600">
                -{formatCurrency(summary.discountTotal)}
              </span>
            </div>
            <div className="flex justify-between text-[#525252]">
              <span>Tax</span>
              <span className="font-mono">{formatCurrency(summary.taxTotal)}</span>
            </div>
            <div className="border-t border-[#e5e5e5] pt-3 flex justify-between font-bold text-base text-[#171717]">
              <span>Grand Total</span>
              <span className="font-mono">{formatCurrency(summary.grandTotal)}</span>
            </div>
            {livePreviewFallback && (
              <div className="text-xs text-[#737373] italic pt-1">
                Discount calculated on save
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Card: Quotation Items */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#171717]">Quotation Items</h2>
          {errors.lines && <span className="text-xs text-red-600">{errors.lines}</span>}
        </div>

        {isReadOnly ? (
          <LinesTable lines={lines} />
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e5e5e5] text-xs font-semibold text-[#737373] uppercase tracking-wider">
                    <th className="py-2.5 px-2 w-10 text-center">#</th>
                    <th className="py-2.5 px-2 min-w-[180px]">Product *</th>
                    <th className="py-2.5 px-2 min-w-[140px]">Variant</th>
                    <th className="py-2.5 px-2 min-w-[140px]">Plan *</th>
                    <th className="py-2.5 px-2 w-24 text-center">Quantity *</th>
                    <th className="py-2.5 px-2 w-28 text-right">Unit Price</th>
                    <th className="py-2.5 px-2 min-w-[140px]">Tax</th>
                    <th className="py-2.5 px-2 w-28 text-right">Amount</th>
                    <th className="py-2.5 px-2 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0f0]">
                  {lines.map((line, idx) => {
                    const selectedProduct = products.find((p) => p._id === line.productId);
                    const variants = selectedProduct?.variants || [];
                    const selectedPlan = plans.find((p) => p._id === line.planId);
                    const minQty = selectedPlan?.minQuantity || 1;

                    return (
                      <tr key={idx} className="hover:bg-[#fafafa]">
                        <td className="py-2 px-2 text-center text-xs text-[#737373] font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={line.productId}
                            onChange={(e) => handleLineChange(idx, 'productId', e.target.value)}
                            className="w-full h-9 px-2 bg-white border border-[#d4d4d4] rounded-md text-sm text-[#171717]"
                          >
                            <option value="">Select Product...</option>
                            {products.map((p) => (
                              <option key={p._id} value={p._id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={line.variantId || ''}
                            onChange={(e) => handleLineChange(idx, 'variantId', e.target.value)}
                            disabled={!line.productId || variants.length === 0}
                            className="w-full h-9 px-2 bg-white border border-[#d4d4d4] rounded-md text-sm text-[#171717] disabled:bg-[#f5f5f5]"
                          >
                            <option value="">None</option>
                            {variants.map((v) => (
                              <option key={v._id} value={v._id}>
                                {v.name} ({v.priceDelta >= 0 ? `+${v.priceDelta}` : v.priceDelta})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={line.planId}
                            onChange={(e) => handleLineChange(idx, 'planId', e.target.value)}
                            className="w-full h-9 px-2 bg-white border border-[#d4d4d4] rounded-md text-sm text-[#171717]"
                          >
                            <option value="">Select Plan...</option>
                            {plans.map((p) => (
                              <option key={p._id} value={p._id}>
                                {p.name} ({p.billingCycle})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min={minQty}
                            value={line.quantity}
                            onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                            className="w-full h-9 px-2 bg-white border border-[#d4d4d4] rounded-md text-sm text-center text-[#171717]"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.unitPrice}
                            onChange={(e) => handleLineChange(idx, 'unitPrice', e.target.value)}
                            className="w-full h-9 px-2 bg-white border border-[#d4d4d4] rounded-md text-sm text-right font-mono text-[#171717]"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={line.taxId}
                            onChange={(e) => handleLineChange(idx, 'taxId', e.target.value)}
                            className="w-full h-9 px-2 bg-white border border-[#d4d4d4] rounded-md text-sm text-[#171717]"
                          >
                            <option value="">No Tax (0%)</option>
                            {taxes.map((t) => (
                              <option key={t._id} value={t._id}>
                                {t.name} ({t.rate}%)
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-medium text-[#171717]">
                          {formatCurrency(line.amount || 0)}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-[#737373] hover:text-red-600 transition-colors"
                            title="Remove line"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div>
              <Button size="sm" variant="secondary" onClick={handleAddItem}>
                + Add Item
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Save as Template Modal */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title="Save as Template"
        description="Save these quotation line items as a reusable template"
      >
        <div className="space-y-4">
          <Input
            label="Template Name"
            required
            placeholder="e.g. Enterprise Annual SaaS"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setIsTemplateModalOpen(false)}
              disabled={savingTemplate}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveAsTemplate}
              isLoading={savingTemplate}
            >
              Save Template
            </Button>
          </div>
        </div>
      </Modal>

      {/* Convert to Subscription Dialog */}
      <ConfirmDialog
        isOpen={isConvertOpen}
        title="Convert to Subscription"
        message="This will confirm the quotation and create a subscription."
        confirmText="Convert"
        confirmVariant="primary"
        isLoading={isConverting}
        onConfirm={handleConvert}
        onClose={() => setIsConvertOpen(false)}
      />
    </div>
  );
};
