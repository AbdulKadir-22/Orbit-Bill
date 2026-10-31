import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Layers,
  FileText,
  CreditCard,
  Clock,
  ArrowRight,
  Edit2,
  Building,
  Mail,
  Phone,
  MapPin,
  FileCheck,
} from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/common/StatCard';
import { InvoiceStatusBadge } from '../../components/common/InvoiceStatusBadge';
import { portalService } from './services/portalService';
import { formatCurrency, formatDate } from '../../lib/utils';
import { getPaymentMethodLabel } from '../../constants/options';
import { getStatusBadgeVariant } from '../../constants/statusStyles';

export const CustomerDashboardPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, login } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Profile Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    company: '',
    gstin: '',
    address: '',
  });

  const loadData = async () => {
    try {
      const res = await portalService.getDashboard();
      setData(res);
      const prof = res.profile || {};
      setProfileForm({
        name: prof.name || user?.name || '',
        phone: prof.phone || '',
        company: prof.company || '',
        gstin: prof.gstin || '',
        address: typeof prof.address === 'string' ? prof.address : (prof.billingAddress?.street || ''),
      });
    } catch (err) {
      console.error('Failed to load customer dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      await portalService.updateProfile({
        name: profileForm.name,
        phone: profileForm.phone,
        company: profileForm.company,
        gstin: profileForm.gstin,
        billingAddress: { street: profileForm.address },
      });
      toast.success('Profile updated successfully');
      setDrawerOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
        <p className="text-sm text-neutral-400 mt-3 font-medium">Loading account overview...</p>
      </div>
    );
  }

  const profile = data?.profile || {};
  const customerName = profile.name || user?.name || 'Customer';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's your account overview."
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Subscriptions"
          value={data?.activeSubscriptions ?? 0}
          icon={Layers}
        />
        <StatCard
          label="Total Invoices"
          value={data?.totalInvoices ?? 0}
          icon={FileText}
        />
        <StatCard
          label="Amount Paid"
          value={formatCurrency(data?.amountPaid ?? 0)}
          icon={CreditCard}
        />
        <StatCard
          label="Outstanding Amount"
          value={formatCurrency(data?.outstandingAmount ?? 0)}
          icon={Clock}
          isGoodTrend={false}
        />
      </div>

      {/* Row 2: My Subscriptions & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Subscriptions */}
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-neutral-100">
            <h3 className="text-base font-semibold text-neutral-900">My Subscriptions</h3>
            <Link
              to="/my/subscriptions"
              className="inline-flex items-center text-xs font-semibold text-neutral-900 hover:text-neutral-600 transition-colors"
            >
              View all <ArrowRight size={13} className="ml-1" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/75 text-neutral-500 font-medium border-b border-neutral-100">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Next Billing</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {(data?.subscriptions || []).length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-neutral-400">
                      No subscriptions found
                    </td>
                  </tr>
                ) : (
                  data.subscriptions.map((sub, idx) => (
                    <tr
                      key={sub._id || idx}
                      onClick={() => navigate('/my/subscriptions')}
                      className="hover:bg-neutral-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-neutral-900">
                        {sub.subscriptionNumber || idx + 1}
                      </td>
                      <td className="py-3 px-4 font-medium text-neutral-900">
                        {sub.lines?.[0]?.planName || sub.planName || 'Plan'}
                      </td>
                      <td className="py-3 px-4 text-neutral-500">
                        {sub.startDate ? formatDate(sub.startDate) : '—'}
                      </td>
                      <td className="py-3 px-4 text-neutral-500">
                        {sub.expiryDate ? formatDate(sub.expiryDate) : '—'}
                      </td>
                      <td className="py-3 px-4 text-neutral-500">
                        {sub.nextBillingDate ? formatDate(sub.nextBillingDate) : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusBadgeVariant('subscription', sub.status)}>
                          {sub.status ? sub.status.charAt(0).toUpperCase() + sub.status.slice(1) : '—'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Invoices */}
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-neutral-100">
            <h3 className="text-base font-semibold text-neutral-900">Recent Invoices</h3>
            <Link
              to="/my/invoices"
              className="inline-flex items-center text-xs font-semibold text-neutral-900 hover:text-neutral-600 transition-colors"
            >
              View all <ArrowRight size={13} className="ml-1" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/75 text-neutral-500 font-medium border-b border-neutral-100">
                <tr>
                  <th className="py-3 px-4"># Invoice</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {(data?.recentInvoices || []).length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-neutral-400">
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  data.recentInvoices.map((inv) => (
                    <tr
                      key={inv._id}
                      onClick={() => navigate('/my/invoices')}
                      className="hover:bg-neutral-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-neutral-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 text-neutral-500">
                        {inv.invoiceDate ? formatDate(inv.invoiceDate) : '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-neutral-900">
                        {formatCurrency(inv.grandTotal)}
                      </td>
                      <td className="py-3 px-4">
                        <InvoiceStatusBadge invoice={inv} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Row 3: Recent Payments & Account Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-neutral-100">
            <h3 className="text-base font-semibold text-neutral-900">Recent Payments</h3>
            <Link
              to="/my/invoices?tab=payments"
              className="inline-flex items-center text-xs font-semibold text-neutral-900 hover:text-neutral-600 transition-colors"
            >
              View all <ArrowRight size={13} className="ml-1" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/75 text-neutral-500 font-medium border-b border-neutral-100">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {(data?.recentPayments || []).length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-neutral-400">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  data.recentPayments.map((p) => (
                    <tr
                      key={p._id}
                      onClick={() => navigate('/my/invoices?tab=payments')}
                      className="hover:bg-neutral-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-neutral-900">
                        {p.paymentNumber}
                      </td>
                      <td className="py-3 px-4 text-neutral-500">
                        {p.paidAt ? formatDate(p.paidAt) : '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-neutral-900">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3 px-4 text-neutral-600">
                        {getPaymentMethodLabel(p.method)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Account Information Card */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-neutral-900">Account Information</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDrawerOpen(true)}
                className="text-xs h-8 px-3"
              >
                <Edit2 size={13} className="mr-1.5" />
                Edit
              </Button>
            </div>

            <div className="flex items-start space-x-4 mb-6">
              <Avatar name={customerName} size="lg" className="bg-neutral-900 text-white font-bold" />
              <div>
                <h4 className="text-lg font-bold text-neutral-900">{customerName}</h4>
                <div className="flex items-center text-xs text-neutral-500 mt-1 space-x-1">
                  <Mail size={13} className="text-neutral-400 mr-1" />
                  <span>{profile.email || user?.email || '—'}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center text-xs text-neutral-500 mt-1 space-x-1">
                    <Phone size={13} className="text-neutral-400 mr-1" />
                    <span>{profile.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-4 border-t border-neutral-100">
              <div>
                <span className="text-neutral-400 block mb-1">Company</span>
                <span className="font-medium text-neutral-800">{profile.company || '—'}</span>
              </div>
              <div>
                <span className="text-neutral-400 block mb-1">GSTIN</span>
                <span className="font-medium text-neutral-800 font-mono">{profile.gstin || '—'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-neutral-400 block mb-1">Address</span>
                <p className="font-medium text-neutral-800 whitespace-pre-line leading-relaxed">
                  {typeof profile.address === 'string'
                    ? profile.address
                    : profile.billingAddress?.street || '—'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Edit Profile Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Edit Profile"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4 p-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Email (read-only)
            </label>
            <Input
              value={profile.email || user?.email || ''}
              disabled
              className="bg-neutral-50 text-neutral-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Name <span className="text-rose-500">*</span>
            </label>
            <Input
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              required
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Phone
            </label>
            <Input
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              placeholder="+91 98765 43210"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Company
            </label>
            <Input
              value={profileForm.company}
              onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
              placeholder="Acme Corp"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              GSTIN
            </label>
            <Input
              value={profileForm.gstin}
              onChange={(e) => setProfileForm({ ...profileForm, gstin: e.target.value })}
              placeholder="27ABCDE1234F1Z5"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Address
            </label>
            <textarea
              rows={3}
              value={profileForm.address}
              onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
              placeholder="Street, City, State, Country"
              className="w-full text-xs rounded-xl border border-neutral-300 p-2.5 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          <div className="pt-4 flex items-center justify-end space-x-2 border-t border-neutral-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDrawerOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
};
