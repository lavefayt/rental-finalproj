export type RoomStatus = 'vacant' | 'occupied' | 'maintenance';

export interface Room {
  id: string;
  room_number: string;
  base_price: number;
  status: RoomStatus;
  created_at: string;
  updated_at: string;
}

export interface RoomWithCurrentContract extends Room {
  current_contract?: ContractWithRenter;
}

export interface RoomSummary {
  id: string;
  room_number: string;
  base_price: number;
  status: RoomStatus;
  total_contracts: number;
  active_contracts: number;
  total_revenue: number;
}

// API Request/Response Types
export interface CreateRoomRequest {
  room_number: string;
  base_price: number;
  status?: RoomStatus;
}

export interface UpdateRoomRequest {
  room_number?: string;
  base_price?: number;
  status?: RoomStatus;
}

export interface RoomFilters {
  status?: RoomStatus;
  min_price?: number;
  max_price?: number;
  search?: string;
}

// Import types needed from other files
import { ContractWithRenter } from './contract.types';