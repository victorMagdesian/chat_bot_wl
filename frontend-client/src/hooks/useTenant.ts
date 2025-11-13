import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface TenantData {
  id: string;
  name: string;
  domain: string;
  logoUrl?: string;
  primaryColor?: string;
}

export function useTenantData() {
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        if (typeof window !== 'undefined') {
          const hostname = window.location.hostname;
          const subdomain = hostname.split('.')[0];

          if (subdomain && subdomain !== 'www' && subdomain !== 'localhost') {
            const response = await api.get(`/tenants/domain/${subdomain}`);
            setTenant(response.data);
          } else {
            setError('Invalid tenant domain');
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load tenant');
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, []);

  return { tenant, loading, error };
}
