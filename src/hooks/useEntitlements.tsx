import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./use-auth";
import { getEntitlements, consumeEntitlement, EntitlementResponse } from "@/api/monetization";

interface EntitlementsContextType {
  entitlements: EntitlementResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  consume: (key: string) => Promise<void>;
}

const EntitlementsContext = createContext<EntitlementsContextType>({
  entitlements: null,
  loading: false,
  error: null,
  refresh: async () => {},
  consume: async () => {},
});

export const EntitlementsProvider = ({ children }: { children: ReactNode }) => {
  const { session } = useAuth();
  const [entitlements, setEntitlements] = useState<EntitlementResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntitlements = async () => {
    if (!session?.access_token) {
      setEntitlements(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getEntitlements(session.access_token);
      setEntitlements(data);
    } catch (err: any) {
      console.error("Error fetching entitlements:", err);
      setError(err.message || "Failed to load entitlements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.access_token) {
      fetchEntitlements();
    } else {
      setEntitlements(null);
    }
  }, [session?.access_token]);

  const refresh = async () => {
    await fetchEntitlements();
  };

  const consume = async (key: string) => {
    if (!session?.access_token) return;
    try {
      await consumeEntitlement(session.access_token, key);
      await fetchEntitlements();
    } catch (err: any) {
      console.error(`Error consuming entitlement ${key}:`, err);
      throw err;
    }
  };

  return (
    <EntitlementsContext.Provider value={{ entitlements, loading, error, refresh, consume }}>
      {children}
    </EntitlementsContext.Provider>
  );
};

export const useEntitlements = () => {
  const context = useContext(EntitlementsContext);
  if (!context) {
    throw new Error("useEntitlements must be used within an EntitlementsProvider");
  }
  return context;
};
