"use client";

import { Room } from "@/types/app.types";
import { Button } from "@/components/ui/button";
import { RoomDetailsCard } from "./RoomDetailsCard";
import { RenterInfoCard } from "./RenterInfoCard";
import { PaymentStatusCard } from "./PaymentStatusCard";
import { PaymentForm } from "@/components/forms/PaymentForm";
import { RenewalForm } from "@/components/forms/RenewalForm";
import { EditRenterForm } from "@/components/tenants/EditRenterForm";
import { PaymentFormData } from "@/lib/schemas/payment.schema";
import { RenewalFormData } from "@/lib/schemas/renewal.schema";
import { isPastDue, calculateBalance } from "@/utils/paymentUtils";
import { isContractExpired } from "@/utils/dateUtils";
import { UserX } from "lucide-react";

interface OccupiedRoomViewProps {
  room: Room;
  isEditing: boolean;
  isLoading: boolean;
  onEditStart: () => void;
  onEditCancel: () => void;
  onEditSave: (data: {
    firstName: string;
    lastName: string;
    email: string;
    contactNumber: string;
  }) => void;
  onPaymentSubmit: (data: PaymentFormData) => void;
  onMarkFullyPaid: () => void;
  onRenewalSubmit: (data: RenewalFormData & { additionalRent: number }) => void;
  onNotRenew: () => void;
  onEvict?: () => void;
}

export function OccupiedRoomView({
  room,
  isEditing,
  isLoading,
  onEditStart,
  onEditCancel,
  onEditSave,
  onPaymentSubmit,
  onMarkFullyPaid,
  onRenewalSubmit,
  onNotRenew,
  onEvict,
}: OccupiedRoomViewProps) {
  if (!room.renter) return null;

  const pastDue = isPastDue(room);
  const expired = isContractExpired(room.renter.contractEndDate);
  const balance = calculateBalance(room);

  if (isEditing) {
    return (
      <div className="space-y-6 mt-4">
        <div className="bg-blue-50 p-4 rounded-lg space-y-4 border border-blue-200">
          <h3 className="text-slate-900 mb-2">Edit Renter Information</h3>
          <EditRenterForm
            initialData={{
              firstName: room.renter.firstName,
              lastName: room.renter.lastName,
              email: room.renter.email,
              contactNumber: room.renter.contactNumber,
            }}
            onSave={onEditSave}
            onCancel={onEditCancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      <RoomDetailsCard room={room} />
      <RenterInfoCard renter={room.renter} onEdit={onEditStart} />
      <PaymentStatusCard room={room} />

      {pastDue && (
        <PaymentForm
          onSubmit={onPaymentSubmit}
          onMarkFullyPaid={onMarkFullyPaid}
          isLoading={isLoading}
          maxAmount={balance}
        />
      )}

      {expired && (
        <RenewalForm
          room={room}
          onSubmit={onRenewalSubmit}
          onNotRenew={onNotRenew}
          isLoading={isLoading}
        />
      )}

      {/* Evict Button - shown when there's unpaid balance */}
      {pastDue && onEvict && (
        <div className="border-t pt-4">
          <Button
            variant="destructive"
            className="w-full"
            onClick={onEvict}
            disabled={isLoading}
          >
            <UserX className="w-4 h-4 mr-2" />
            Evict Tenant
          </Button>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Evicting will vacate the room but keep the outstanding balance on
            record
          </p>
        </div>
      )}
    </div>
  );
}
