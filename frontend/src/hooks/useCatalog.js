import { useState, useEffect } from 'react';
import api from '../lib/api';

// Cache catalog data in memory across component remounts
let cachedCatalog = null;
let catalogPromise = null;

/**
 * useCatalog hook
 * Loads once and caches active products (with variants), active plans and active taxes.
 * Used by the quotation lines editor.
 */
export const useCatalog = () => {
  const [products, setProducts] = useState(cachedCatalog ? cachedCatalog.products : []);
  const [plans, setPlans] = useState(cachedCatalog ? cachedCatalog.plans : []);
  const [taxes, setTaxes] = useState(cachedCatalog ? cachedCatalog.taxes : []);
  const [loading, setLoading] = useState(!cachedCatalog);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cachedCatalog) {
      setProducts(cachedCatalog.products);
      setPlans(cachedCatalog.plans);
      setTaxes(cachedCatalog.taxes);
      setLoading(false);
      return;
    }

    if (!catalogPromise) {
      catalogPromise = Promise.all([
        api.get('/products', { params: { isActive: true, limit: 200 } }),
        api.get('/plans', { params: { isActive: true, limit: 200 } }),
        api.get('/taxes', { params: { isActive: true, limit: 200 } }),
      ]).then(([prodRes, planRes, taxRes]) => {
        const data = {
          products: prodRes.data?.data || [],
          plans: planRes.data?.data || [],
          taxes: taxRes.data?.data || [],
        };
        cachedCatalog = data;
        return data;
      });
    }

    let isMounted = true;
    catalogPromise
      .then((data) => {
        if (isMounted) {
          setProducts(data.products);
          setPlans(data.plans);
          setTaxes(data.taxes);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.message || 'Failed to load catalog');
          setLoading(false);
        }
        catalogPromise = null; // allow retry on failure
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { products, plans, taxes, loading, error };
};
