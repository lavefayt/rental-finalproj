export interface Payment {
  id: string;
  contract_id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
}

export interface PaymentWithContract extends Payment {
  contract: ContractWithDetails;
}

export interface PaymentHistoryView {
  payment_id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  notes: string | null;
  room_number: string;
  renter_name: string;
  monthly_rent: number;
  start_date: string;
  end_date: string;
}

// API Request/Response Types
export interface CreatePaymentRequest {
  contract_id: string;
  amount: number;
  payment_date?: string;
  payment_method?: string;
  notes?: string;
}

export interface UpdatePaymentRequest {
  amount?: number;
  payment_date?: string;
  payment_method?: string;
  notes?: string;
}

export interface PaymentFilters {
  contract_id?: string;
  date_from?: string;
  date_to?: string;
  payment_method?: string;
  min_amount?: number;
  max_amount?: number;
}

export interface PaymentSummary {
  total_payments: number;
  total_amount: number;
  payment_count: number;
  average_payment: number;
}

// Import types needed from other files
import { ContractWithDetails } from './contract.types';