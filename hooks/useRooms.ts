import { useState, useEffect, useCallback } from "react";
import {
  RoomWithCurrentContract,
  CreateRoomRequest,
  UpdateRoomRequest,
} from "@/types/room.types";

interface UseRoomsOptions {
  status?: "vacant" | "occupied" | "maintenance";
  includeContract?: boolean;
  autoFetch?: boolean;
}

export function useRooms(options: UseRoomsOptions = {}) {
  const { status, includeContract = true, autoFetch = true } = options;

  const [rooms, setRooms] = useState<RoomWithCurrentContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      if (includeContract) params.append("includeContract", "true");

      const response = await fetch(`/api/rooms?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch rooms");
      }

      setRooms(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching rooms:", err);
    } finally {
      setLoading(false);
    }
  }, [status, includeContract]);

  const createRoom = async (roomData: CreateRoomRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roomData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create room");
      }

      await fetchRooms(); // Refresh the list
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error creating room:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateRoom = async (roomId: string, updates: UpdateRoomRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update room");
      }

      await fetchRooms(); // Refresh the list
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error updating room:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteRoom = async (roomId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete room");
      }

      await fetchRooms(); // Refresh the list
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error deleting room:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getRoom = async (roomId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/rooms/${roomId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch room");
      }

      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching room:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchRooms();
    }
  }, [autoFetch, fetchRooms]);

  return {
    rooms,
    loading,
    error,
    fetchRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    getRoom,
  };
}
