// App-level types (used by components)
export type {
  Renter,
  ContractType,
  RoomStatus,
  Room,
  DueContract,
  NewTenantFormData,
  EditRenterFormData,
  PaymentFormData,
  RenewalFormData,
  RoomCallbacks,
  ConfirmDialogState,
} from "./app.types";

export { initialConfirmDialogState } from "./app.types";

// API types (used by hooks and API routes)
export type {
  RoomAPI,
  RoomStatusAPI,
  RoomWithCurrentContract,
  RoomSummary,
  CreateRoomRequest,
  UpdateRoomRequest,
  RoomFilters,
} from "./room.types";

export type {
  Renter as RenterAPI,
  CreateRenterRequest,
  UpdateRenterRequest,
  RenterFilters,
} from "./renter.types";

export type {
  ContractStatus,
  Contract,
  ContractWithRenter,
  ContractWithRoom,
  ContractWithDetails,
  CreateContractRequest,
  UpdateContractRequest,
  ContractFilters,
} from "./contract.types";

export type {
  Payment,
  PaymentWithContract,
  PaymentHistoryView,
  CreatePaymentRequest,
  UpdatePaymentRequest,
  PaymentFilters,
  PaymentSummary,
} from "./payment.types";
