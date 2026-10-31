import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import { quotationService } from './services/quotationService';
import { useToast } from '../../components/ui/Toast';

export const QuotationTemplatesDrawer = ({ isOpen, onClose }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useToast();

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await quotationService.listTemplates();
      setTemplates(data || []);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await quotationService.deleteTemplate(deleteTarget._id);
      showSuccessToast('Template deleted successfully');
      setDeleteTarget(null);
      loadTemplates();
    } catch (err) {
      showErrorToast(err?.message || 'Failed to delete template');
    } finally {
      setDeleting(false);
    }
  };

  const handleUse = (template) => {
    onClose();
    navigate(`/quotations/new?templateId=${template._id}`);
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title="Quotation Templates"
        description="Pre-configured quotation templates for faster creation"
        size="md"
      >
        <div className="flex flex-col h-full">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Spinner size="md" />
            </div>
          ) : templates.length === 0 ? (
            <div className="py-12">
              <EmptyState
                title="No templates yet"
                description="Save a quotation as a template to reuse line item sets anytime."
              />
            </div>
          ) : (
            <div className="divide-y divide-[#f0f0f0]">
              {templates.map((tpl) => (
                <div key={tpl._id} className="py-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-[#171717]">{tpl.templateName}</h4>
                    <p className="text-xs text-[#737373] mt-0.5">
                      {tpl.lines?.length || 0} line items • Validity: {tpl.validityDays || 30} days
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleUse(tpl)}
                    >
                      Use
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setDeleteTarget(tpl)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Drawer>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Template"
        message={`Are you sure you want to delete template "${deleteTarget?.templateName}"? This action cannot be undone.`}
        confirmText="Delete Template"
        confirmVariant="danger"
        isLoading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
};
