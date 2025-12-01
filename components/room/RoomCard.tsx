"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, User, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { VacantRoomView } from "./VacantRoomView";
import { OccupiedRoomView } from "./OccupiedRoomView";
import {
  Room,
  ConfirmDialogState,
  initialConfirmDialogState,
} from "@/types/app.types";
import { NewTenantFormData } from "@/lib/schemas/tenant.schema";
import { PaymentFormData } from "@/lib/schemas/payment.schema";
import { RenewalFormData } from "@/lib/schemas/renewal.schema";
import { truncateName } from "@/utils/textUtils";
import { isContractExpired } from "@/utils/dateUtils";
import {
  isPastDue,
  calculateBalance,
  calculateLateFee,
} from "@/utils/paymentUtils";

interface RoomCardProps {
  room: Room;
  onUpdatePayment: (roomId: string, amountPaid: number) => void;
  onRenewContract: (
    roomId: string,
    newEndDate: string,
    contractType?: "monthly" | "yearly" | "custom",
    additionalRent?: number
  ) => void;
  onVacateRoom: (roomId: string) => void;
  onEvictTenant?: (roomId: string) => void;
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
      contractType?: "monthly" | "yearly" | "custom";
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

export function RoomCard({
  room,
  onUpdatePayment,
  onRenewContract,
  onVacateRoom,
  onEvictTenant,
  onOccupyRoom,
  onUpdateRenter,
  onDeleteRoom,
}: RoomCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingRenter, setIsEditingRenter] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(
    initialConfirmDialogState
  );

  const expired = room.renter
    ? isContractExpired(room.renter.contractEndDate)
    : false;
  const pastDue = isPastDue(room);

  const handleMarkFullyPaid = () => {
    if (!room.renter) return;

    const remainingBalance = calculateBalance(room);
    if (remainingBalance <= 0) return;

    const lateFee = calculateLateFee(room);
    const paymentAmount = remainingBalance + lateFee;

    setConfirmDialog({
      open: true,
      title: "Mark as Fully Paid?",
      description: `Are you sure you want to mark Room ${
        room.roomNumber
      } as fully paid? This will add a payment of ₱${paymentAmount.toLocaleString()}${
        lateFee > 0 ? ` (including ₱${lateFee.toLocaleString()} interest)` : ""
      }.`,
      onConfirm: async () => {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        onUpdatePayment(room.id, paymentAmount);
        setIsLoading(false);
        setConfirmDialog(initialConfirmDialogState);
      },
    });
  };

  const handleUpdatePayment = (data: PaymentFormData) => {
    const amount = parseFloat(data.amount);
    setConfirmDialog({
      open: true,
      title: "Add Payment?",
      description: `Are you sure you want to add ₱${amount.toLocaleString()} to Room ${
        room.roomNumber
      }'s payment?`,
      onConfirm: async () => {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        onUpdatePayment(room.id, amount);
        setIsLoading(false);
        setConfirmDialog(initialConfirmDialogState);
      },
    });
  };

  const handleRenewContract = (
    data: RenewalFormData & { additionalRent: number }
  ) => {
    setConfirmDialog({
      open: true,
      title: "Renew Contract?",
      description: `Are you sure you want to renew the contract for Room ${
        room.roomNumber
      } until ${new Date(data.endDate).toLocaleDateString()}?${
        data.additionalRent > 0
          ? ` This will add ₱${data.additionalRent.toLocaleString()} to the total rent.`
          : ""
      }`,
      onConfirm: async () => {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        onRenewContract(
          room.id,
          data.endDate,
          data.contractType,
          data.additionalRent
        );
        setIsLoading(false);
        setConfirmDialog(initialConfirmDialogState);
      },
    });
  };

  const handleNotRenew = () => {
    setConfirmDialog({
      open: true,
      title: "Do Not Renew Contract?",
      description: `Are you sure you do not want to renew the contract for Room ${room.roomNumber}? This will mark the room as vacant and remove the current tenant.`,
      variant: "destructive",
      onConfirm: async () => {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        onVacateRoom(room.id);
        setIsOpen(false);
        setIsLoading(false);
        setConfirmDialog(initialConfirmDialogState);
      },
    });
  };

  const handleEvict = () => {
    if (!room.renter || !onEvictTenant) return;

    const balance = calculateBalance(room);
    const lateFee = calculateLateFee(room);
    const totalDue = balance + lateFee;

    setConfirmDialog({
      open: true,
      title: "Evict Tenant?",
      description: `Are you sure you want to evict ${room.renter.firstName} ${room.renter.lastName} from Room ${room.roomNumber}? The room will become vacant but the outstanding balance of ₱${totalDue.toLocaleString()} will remain on record.`,
      variant: "destructive",
      onConfirm: async () => {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        onEvictTenant(room.id);
        setIsOpen(false);
        setIsLoading(false);
        setConfirmDialog(initialConfirmDialogState);
      },
    });
  };

  const handleOccupyRoom = (data: NewTenantFormData) => {
    setConfirmDialog({
      open: true,
      title: "Occupy Room?",
      description: `Are you sure you want to occupy Room ${room.roomNumber} with tenant ${data.firstName} ${data.lastName}?`,
      onConfirm: async () => {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        onOccupyRoom(room.id, {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          contactNumber: data.contactNumber,
          rentStartDate: data.rentStartDate,
          contractEndDate: data.contractEndDate,
          amountPaid: parseFloat(data.amountPaid),
          contractType: data.contractType,
        });
        setIsOpen(false);
        setIsLoading(false);
        setConfirmDialog(initialConfirmDialogState);
      },
    });
  };

  const handleUpdateRenterInfo = (data: {
    firstName: string;
    lastName: string;
    email: string;
    contactNumber: string;
  }) => {
    setConfirmDialog({
      open: true,
      title: "Update Renter Information?",
      description: `Are you sure you want to update the renter information for Room ${room.roomNumber}?`,
      onConfirm: async () => {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        onUpdateRenter(room.id, data);
        setIsEditingRenter(false);
        setIsLoading(false);
        setConfirmDialog(initialConfirmDialogState);
      },
    });
  };

  const handleDeleteRoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({
      open: true,
      title: "Delete Room?",
      description: `Are you sure you want to delete Room ${room.roomNumber}? This action cannot be undone.`,
      variant: "destructive",
      onConfirm: async () => {
        setIsLoading(true);
        await onDeleteRoom(room.id);
        setIsLoading(false);
        setConfirmDialog(initialConfirmDialogState);
      },
    });
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setIsEditingRenter(false);
  };

  return (
    <>
      <Card
        className={`relative cursor-pointer transition-all hover:shadow-lg ${
          expired ? "border-red-400 border-2" : ""
        } ${pastDue && !expired ? "border-orange-400 border-2" : ""}`}
        onClick={() => setIsOpen(true)}
      >
        <button
          onClick={handleDeleteRoom}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors z-10"
          aria-label="Delete room"
        >
          <X className="w-4 h-4" />
        </button>
        <CardHeader className="pt-8">
          <CardTitle className="flex items-center justify-between">
            <span>Room {room.roomNumber}</span>
            {room.status === "vacant" ? (
              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                Vacant
              </Badge>
            ) : (
              <Badge variant="default" className="bg-green-100 text-green-700">
                Occupied
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-slate-600">
            <span>₱ {room.price.toLocaleString()}/month</span>
          </div>
          {room.status === "occupied" && room.renter && (
            <div className="mt-2 flex items-center gap-2 text-slate-600">
              <User className="w-4 h-4" />
              <span className="truncate">
                {truncateName(
                  `${room.renter.firstName} ${room.renter.lastName}`
                )}
              </span>
            </div>
          )}
          {expired && (
            <div className="mt-2 flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>Contract Expired</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl">
              Room {room.roomNumber}
            </DialogTitle>
            <DialogDescription className="text-2xl text-slate-900 mt-2">
              ₱{room.price.toLocaleString()}/month
            </DialogDescription>
          </DialogHeader>

          {room.status === "vacant" ? (
            <VacantRoomView onOccupy={handleOccupyRoom} isLoading={isLoading} />
          ) : (
            room.renter && (
              <OccupiedRoomView
                room={room}
                isEditing={isEditingRenter}
                isLoading={isLoading}
                onEditStart={() => setIsEditingRenter(true)}
                onEditCancel={() => setIsEditingRenter(false)}
                onEditSave={handleUpdateRenterInfo}
                onPaymentSubmit={handleUpdatePayment}
                onMarkFullyPaid={handleMarkFullyPaid}
                onRenewalSubmit={handleRenewContract}
                onNotRenew={handleNotRenew}
                onEvict={onEvictTenant ? handleEvict : undefined}
              />
            )
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant}
      />
    </>
  );
}
