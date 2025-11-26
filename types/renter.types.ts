export interface Renter {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface RenterWithContracts extends Renter {
  contracts: ContractWithRoom[];
}

// API Request/Response Types
export interface CreateRenterRequest {
  name: string;
  email?: string;
  phone?: string;
}

export interface UpdateRenterRequest {
  name?: string;
  email?: string;
  phone?: string;
}

export interface RenterFilters {
  search?: string;
  has_active_contract?: boolean;
  email?: string;
}

// Import types needed from other files
import { ContractWithRoom } from './contract.types';