import { Room } from './room.types';
import { Renter } from './renter.types';
import { Payment } from './payment.types';

export type ContractStatus = 'active' | 'expired' | 'terminated' | 'renewed';

export interface Contract {
  id: string;
  room_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  status: ContractStatus;
  created_at: string;
  updated_at: string;
}

export interface ContractWithRenter extends Contract {
  renter: Renter;
  total_paid?: number;
  balance?: number;
}

export interface ContractWithRoom extends Contract {
  room: Room;
}

export interface ContractWithDetails extends Contract {
  room: Room;
  renter: Renter;
  payments: Payment[];
  total_paid: number;
  balance: number;
}

// API Request/Response Types
export interface CreateContractRequest {
  room_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
}

export interface UpdateContractRequest {
  start_date?: string;
  end_date?: string;
  monthly_rent?: number;
  status?: ContractStatus;
}

export interface ContractFilters {
  room_id?: string;
  renter_id?: string;
  status?: ContractStatus;
  start_date_from?: string;
  start_date_to?: string;
  end_date_from?: string;
  end_date_to?: string;
  expired?: boolean;
}