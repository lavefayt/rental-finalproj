// Core application types used across all components

export interface Renter {
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  rentStartDate: string;
  contractEndDate: string;
  amountPaid: number;
  contractType?: ContractType;
}

export type ContractType = "monthly" | "yearly" | "custom";
export type RoomStatus = "occupied" | "vacant";

export interface Room {
  id: string;
  roomNumber: string;
  price: number;
  status: RoomStatus;
  renter?: Renter;
}

export interface DueContract {
  id: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  total_paid: number;
  balance: number;
  is_overdue: boolean;
  payment_status: string;
  room?: {
    id: string;
    room_number: string;
  };
  renter?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

// Form data types
export interface NewTenantFormData {
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  contractType: ContractType;
  rentStartDate: string;
  contractEndDate: string;
  amountPaid: string;
}

export interface EditRenterFormData {
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
}

export interface PaymentFormData {
  amount: string;
}

export interface RenewalFormData {
  contractType: ContractType;
  startDate: string;
  endDate: string;
}

// Callback types for room operations
export interface RoomCallbacks {
  onUpdatePayment: (roomId: string, amountPaid: number) => void;
  onRenewContract: (
    roomId: string,
    newEndDate: string,
    contractType?: ContractType
  ) => void;
  onVacateRoom: (roomId: string) => void;
  onOccupyRoom: (
    roomId: string,
    renterDetails: {
      firstName: string;
      lastName: string;
      email: string;
      contactNumber: string;
      rentStartDate: string;
      contractEndDate: string;
      amountPaid: number;
      contractType?: ContractType;
    }
  ) => void;
  onUpdateRenter: (
    roomId: string,
    renterDetails: {
      firstName: string;
      lastName: string;
      email: string;
      contactNumber: string;
    }
  ) => void;
  onDeleteRoom: (roomId: string) => void;
}

// Confirmation dialog state
export interface ConfirmDialogState {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  variant?: "default" | "destructive";
}

export const initialConfirmDialogState: ConfirmDialogState = {
  open: false,
  title: "",
  description: "",
  onConfirm: () => {},
};
