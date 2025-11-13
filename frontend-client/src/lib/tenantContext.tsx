import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TenantContextType {
  tenantId: string | null;
  domain: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  setTenant: (tenant: TenantData) => void;
  clearTenant: () => void;
}

interface TenantData {
  id: string;
  domain: string;
  logoUrl?: string;
  primaryColor?: string;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [domain, setDomain] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState<string | null>('#3182CE');

  useEffect(() => {
    // Extract tenant domain from hostname on client side
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const subdomain = hostname.split('.')[0];
      
      if (subdomain && subdomain !== 'www' && subdomain !== 'localhost') {
        setDomain(subdomain);
      }
    }
  }, []);

  const setTenant = (tenant: TenantData) => {
    setTenantId(tenant.id);
    setDomain(tenant.domain);
    setLogoUrl(tenant.logoUrl || null);
    setPrimaryColor(tenant.primaryColor || '#3182CE');
  };

  const clearTenant = () => {
    setTenantId(null);
    setDomain(null);
    setLogoUrl(null);
    setPrimaryColor('#3182CE');
  };

  return (
    <TenantContext.Provider
      value={{
        tenantId,
        domain,
        logoUrl,
        primaryColor,
        setTenant,
        clearTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
