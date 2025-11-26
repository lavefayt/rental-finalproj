import { useState, useEffect, useCallback } from "react";

export function useContracts(
  options: {
    status?: string;
    roomId?: string;
    renterId?: string;
    paymentStatus?: "paid" | "unpaid" | "overdue";
    autoFetch?: boolean;
  } = {}
) {
  const { status, roomId, renterId, paymentStatus, autoFetch = true } = options;

  const [contracts, setContracts] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      if (roomId) params.append("roomId", roomId);
      if (renterId) params.append("renterId", renterId);
      if (paymentStatus) params.append("paymentStatus", paymentStatus);

      const response = await fetch(`/api/contracts?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch contracts");
      }

      setContracts(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching contracts:", err);
    } finally {
      setLoading(false);
    }
  }, [status, roomId, renterId, paymentStatus]);

  const createContract = async (contractData: Record<string, unknown>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contractData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create contract");
      }

      await fetchContracts();
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error creating contract:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateContract = async (
    contractId: string,
    updates: Record<string, unknown>
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/contracts/${contractId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update contract");
      }

      await fetchContracts();
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error updating contract:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteContract = async (contractId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/contracts/${contractId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete contract");
      }

      await fetchContracts();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error deleting contract:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchContracts();
    }
  }, [autoFetch, fetchContracts]);

  return {
    contracts,
    loading,
    error,
    fetchContracts,
    createContract,
    updateContract,
    deleteContract,
  };
}
