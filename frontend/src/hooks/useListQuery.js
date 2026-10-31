import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useListQuery hook
 * Encapsulates listing query state:
 * - page, limit (10)
 * - search (debounced 300ms)
 * - filters (status, type, billingCycle, etc.)
 * - counts { all, active, inactive }
 * - automatic page reset to 1 on filter or search changes
 *
 * @param {Function} fetcher - Function receiving params and returning { data, pagination, counts }
 * @param {Object} initialFilters - Initial key-value filters
 */
export const useListQuery = (fetcher, initialFilters = {}) => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState(initialFilters);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'active' | 'inactive'

  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [counts, setCounts] = useState({ all: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);

  // Debounce search input by 300ms
  const searchTimeoutRef = useRef(null);
  const handleSearchChange = (val) => {
    setSearch(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 300);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPage(1);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const resetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setFilters(initialFilters);
    setActiveTab('all');
    setPage(1);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Build query params - strip empty strings, undefined, and null
      const params = {
        page,
        limit,
      };

      Object.entries(filters).forEach(([k, v]) => {
        if (v !== '' && v !== undefined && v !== null) {
          params[k] = v;
        }
      });

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }

      // Tab overrides or sets status filter
      if (activeTab === 'active') {
        params.isActive = true;
      } else if (activeTab === 'inactive') {
        params.isActive = false;
      } else if (filters.isActive !== undefined && filters.isActive !== '') {
        params.isActive = filters.isActive === 'true' || filters.isActive === true;
      }

      const res = await fetcher(params);
      setData(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
      if (res.counts) {
        setCounts(res.counts);
      }
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [fetcher, page, limit, filters, debouncedSearch, activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    page,
    setPage,
    limit,
    search,
    setSearch: handleSearchChange,
    filters,
    setFilter: handleFilterChange,
    activeTab,
    setActiveTab: handleTabChange,
    resetFilters,
    data,
    pagination,
    counts,
    loading,
    refetch: loadData,
  };
};
