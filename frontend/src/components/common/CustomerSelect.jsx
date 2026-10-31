import { useState, useEffect } from 'react';
import api from '../../lib/api';

/**
 * CustomerSelect component
 * Searchable Select loading GET /customers?isActive=true&limit=200
 * Option label: "Name (email)"
 */
export const CustomerSelect = ({
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder = 'Select customer...',
  error,
  allowAll = false,
  allLabel = 'All Customers',
  name = 'customerId',
  className = '',
}) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api
      .get('/customers', { params: { isActive: true, limit: 200 } })
      .then((res) => {
        if (isMounted) {
          setCustomers(res.data?.data || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCustomers([]);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <select
        name={name}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        required={required}
        className={`w-full h-10 px-3 py-2 bg-white border rounded-lg text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-[#0b0b0b] disabled:bg-[#f5f5f5] disabled:cursor-not-allowed ${
          error ? 'border-red-500' : 'border-[#d4d4d4]'
        }`}
      >
        {allowAll && <option value="">{allLabel}</option>}
        {!allowAll && <option value="">{loading ? 'Loading customers...' : placeholder}</option>}
        {customers.map((c) => {
          const label = c.email ? `${c.name} (${c.email})` : c.name;
          return (
            <option key={c._id} value={c._id}>
              {label}
            </option>
          );
        })}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
};
