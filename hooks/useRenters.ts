import { useState, useEffect, useCallback } from "react";

export function useRenters(
  options: { status?: string; autoFetch?: boolean } = {}
) {
  const { status, autoFetch = true } = options;

  const [renters, setRenters] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRenters = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (status) params.append("status", status);

      const response = await fetch(`/api/renters?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch renters");
      }

      setRenters(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching renters:", err);
    } finally {
      setLoading(false);
    }
  }, [status]);

  const createRenter = async (renterData: Record<string, unknown>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/renters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(renterData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create renter");
      }

      await fetchRenters();
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error creating renter:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateRenter = async (
    renterId: string,
    updates: Record<string, unknown>
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/renters/${renterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update renter");
      }

      await fetchRenters();
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error updating renter:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteRenter = async (renterId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/renters/${renterId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete renter");
      }

      await fetchRenters();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error deleting renter:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchRenters();
    }
  }, [autoFetch, fetchRenters]);

  return {
    renters,
    loading,
    error,
    fetchRenters,
    createRenter,
    updateRenter,
    deleteRenter,
  };
}
