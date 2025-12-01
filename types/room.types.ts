export type RoomStatusAPI = "vacant" | "occupied" | "maintenance";

export interface RoomAPI {
  id: string;
  room_number: string;
  base_price: number;
  status: RoomStatusAPI;
  created_at: string;
  updated_at: string;
}

export interface RoomWithCurrentContract extends RoomAPI {
  current_contract?: ContractWithRenter;
}

export interface RoomSummary {
  id: string;
  room_number: string;
  base_price: number;
  status: RoomStatusAPI;
  total_contracts: number;
  active_contracts: number;
  total_revenue: number;
}

// API Request/Response Types
export interface CreateRoomRequest {
  room_number: string;
  base_price: number;
  status?: RoomStatusAPI;
}

export interface UpdateRoomRequest {
  room_number?: string;
  base_price?: number;
  status?: RoomStatusAPI;
}

export interface RoomFilters {
  status?: RoomStatusAPI;
  min_price?: number;
  max_price?: number;
  search?: string;
}

// Import types needed from other files
import { ContractWithRenter } from "./contract.types";
