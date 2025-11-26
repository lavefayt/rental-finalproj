import { useState, useEffect, useCallback } from "react";

export function usePayments(
  options: {
    contractId?: string;
    paymentMethod?: string;
    autoFetch?: boolean;
  } = {}
) {
  const { contractId, paymentMethod, autoFetch = true } = options;

  const [payments, setPayments] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (contractId) params.append("contractId", contractId);
      if (paymentMethod) params.append("paymentMethod", paymentMethod);

      const response = await fetch(`/api/payments?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch payments");
      }

      setPayments(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  }, [contractId, paymentMethod]);

  const createPayment = async (paymentData: Record<string, unknown>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create payment");
      }

      await fetchPayments();
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error creating payment:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePayment = async (
    paymentId: string,
    updates: Record<string, unknown>
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update payment");
      }

      await fetchPayments();
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error updating payment:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePayment = async (paymentId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete payment");
      }

      await fetchPayments();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error deleting payment:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchPayments();
    }
  }, [autoFetch, fetchPayments]);

  return {
    payments,
    loading,
    error,
    fetchPayments,
    createPayment,
    updatePayment,
    deletePayment,
  };
}
