"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Trash2, UserPlus } from "lucide-react";

import { Room, ConfirmDialogState, initialConfirmDialogState } from "@/types/app.types";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { VacantRoomView } from "./VacantRoomView";
import { OccupiedRoomView } from "./OccupiedRoomView";
import { truncateName } from "@/utils/textUtils";
import { isContractExpired, formatDate } from "@/utils/dateUtils";
import { isPastDue, getTotalRent } from "@/utils/paymentUtils";
import { NewTenantFormData } from "@/lib/schemas/tenant.schema";
import { PaymentFormData } from "@/lib/schemas/payment.schema";
import { RenewalFormData } from "@/lib/schemas/renewal.schema";
import { calculateBalance, calculateLateFee } from "@/utils/paymentUtils";

interface RoomTableProps {
  rooms: Room[];
  onUpdatePayment: (roomId: string, amountPaid: number) => void;
  onRenewContract: (
    roomId: string,
    newEndDate: string,
    contractType?: "monthly" | "yearly" | "custom",
    additionalRent?: number
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

export function RoomTable({
  rooms,
  onUpdatePayment,
  onRenewContract,
  onVacateRoom,
  onOccupyRoom,
  onUpdateRenter,
  onDeleteRoom,
}: RoomTableProps) {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isEditingRenter, setIsEditingRenter] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(
    initialConfirmDialogState
  );

  // Handle marking as fully paid
  const handleMarkFullyPaid = () => {
    if (!selectedRoom || !selectedRoom.renter) return;

    const remainingBalance = calculateBalance(selectedRoom);
    if (remainingBalance <= 0) return;

    const lateFee = calculateLateFee(selectedRoom);
    const paymentAmount = remainingBalance + lateFee;

    setConfirmDialog({
      open: true,
      title: "Mark as Fully Paid?",
      description: `Are you sure you want to mark Room ${
        selectedRoom.roomNumber
      } as fully paid? This will add a payment of ₱${paymentAmount.toLocaleString()}${
        lateFee > 0 ? ` (including ₱${lateFee.toLocaleString()} interest)` : ""
      }.`,
      onConfirm: async () => {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        onUpdatePayment(selectedRoom.id, paymentAmount);
        setIsLoading(false);
        setConfirmDialog(initialConfirmDialogState);
      },
    });
  };

  // Handle adding payment
  const handleUpdatePayment = (data: PaymentFormData) => {
    if (!selectedRoom) return;

    const amount = parseFloat(data.amount);
    setConfirmDialog({
      open: true,
      title: "Add Payment?",
      description: `Are you sure you want to add ₱${amount.toLocaleString()} to Room ${
        selectedRoom.roomNumber
      }'s payment?`,
      onConfirm: async () => {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        onUpdatePayment(selectedRoom.id, amount);
        setIsLoading(false);
        setConfirmDialog(initialConfirmDialogState);
      },
    });
  };

  // Handle renewing contract
  const handleRenewContract = (data: RenewalFormData & { additionalRent: number }) => {
    if (!selectedRoom) return;

    setConfirmDialog({
      open: true,
      title: "Renew Contract?",
      description: `Are you sure you want to renew the contract for Room ${
        selectedRoom.roomNumber
      } until ${new Date(data.endDate).toLocaleDateString()}?${
        data.additionalRent > 0 
          ? ` This will add ₱${data.additionalRent.toLocaleString()} to the total rent.`
          : ""
      }`,
      onConfirm: async () => {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        onRenewContract(selectedRoom.id, data.endDate, data.contractType, data.additionalRent);
        setIsLoading(false);
        setConfirmDialog(initialConfirmDialogState);
        setSelectedRoom(null);
      },
    });
  };

  // Handle not renewing contract
  const handleNotRenew = () => {
    if (!selectedRoom) return;

    setConfirmDialog({
      open: true,
      title: "Do Not Renew Contract?",
      description: `Are you sure you do not want to renew the contract for Room ${selectedRoom.roomNumber}? This will mark the room as vacant and remove the current tenant.`,
      variant: "destructive",
      onConfirm: async () => {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        onVacateRoom(selectedRoom.id);
        setSelectedRoom(null);
        setIsLoading(false);
        setConfirmDialog(initialConfirmDialogState);
      },
    });
  };

  // Handle occupying room with new tenant
  const handleOccupyRoom = (data: NewTenantFormData) => {
    if (!selectedRoom) return;

    setConfirmDialog({
      open: true,
      title: "Occupy Room?",
      description: `Are you sure you want to occupy Room ${selectedRoom.roomNumber} with tenant ${data.firstName} ${data.lastName}?`,
      onConfirm: async () => {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        onOccupyRoom(selectedRoom.id, {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          contactNumber: data.contactNumber,
          rentStartDate: data.rentStartDate,
          contractEndDate: data.contractEndDate,
          amountPaid: parseFloat(data.amountPaid),
          contractType: data.contractType,
        });
        setSelectedRoom(null);
        setIsLoading(false);
        setConfirmDialog(initialConfirmDialogState);
      },
    });
  };

  // Handle updating renter info
  const handleUpdateRenterInfo = (data: {
    firstName: string;
    lastName: string;
    email: string;
    contactNumber: string;
  }) => {
    if (!selectedRoom) return;

    setConfirmDialog({
      open: true,
      title: "Update Renter Information?",
      description: `Are you sure you want to update the renter information for Room ${selectedRoom.roomNumber}?`,
      onConfirm: async () => {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        onUpdateRenter(selectedRoom.id, data);
        setIsEditingRenter(false);
        setIsLoading(false);
        setConfirmDialog(initialConfirmDialogState);
      },
    });
  };

  // Handle deleting room
  const handleDeleteRoom = (room: Room) => {
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

  // Handle closing dialog
  const handleCloseDialog = () => {
    setSelectedRoom(null);
    setIsEditingRenter(false);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Room #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Monthly Rent</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.map((room) => {
              const expired = room.renter
                ? isContractExpired(room.renter.contractEndDate)
                : false;
              const pastDue = isPastDue(room);
              const tenantName = room.renter
                ? `${room.renter.firstName} ${room.renter.lastName}`
                : "-";

              return (
                <TableRow
                  key={room.id}
                  className={
                    expired ? "bg-red-50" : pastDue ? "bg-orange-50" : ""
                  }
                >
                  <TableCell>{room.roomNumber}</TableCell>
                  <TableCell>
                    {room.status === "vacant" ? (
                      <Badge
                        variant="secondary"
                        className="bg-gray-100 text-gray-700"
                      >
                        Vacant
                      </Badge>
                    ) : (
                      <Badge
                        variant="default"
                        className="bg-green-100 text-green-700"
                      >
                        Occupied
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>₱{room.price.toLocaleString()}/mo</TableCell>
                  <TableCell>
                    {tenantName === "-" ? "-" : truncateName(tenantName)}
                  </TableCell>
                  <TableCell>
                    {room.renter ? formatDate(room.renter.rentStartDate) : "-"}
                  </TableCell>
                  <TableCell>
                    {room.renter ? (
                      <div>
                        <div className={expired ? "text-red-600" : ""}>
                          {formatDate(room.renter.contractEndDate)}
                        </div>
                        {expired && (
                          <div className="text-red-600 text-xs">(Expired)</div>
                        )}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {room.renter ? (
                      <div>
                        <div>
                          ₱{room.renter.amountPaid.toLocaleString()} / ₱
                          {getTotalRent(room).toLocaleString()}
                        </div>
                        {pastDue ? (
                          <Badge variant="destructive" className="mt-1">
                            Unpaid
                          </Badge>
                        ) : (
                          <Badge className="bg-green-600 mt-1">Paid</Badge>
                        )}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {room.status === "vacant" ? (
                          <DropdownMenuItem onClick={() => setSelectedRoom(room)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add Tenant
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => setSelectedRoom(room)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDeleteRoom(room)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Room
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Room Details Dialog */}
      {selectedRoom && (
        <Dialog open={!!selectedRoom} onOpenChange={handleCloseDialog}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-3xl">
                Room {selectedRoom.roomNumber}
              </DialogTitle>
              <DialogDescription className="text-2xl text-slate-900 mt-2">
                ₱{selectedRoom.price.toLocaleString()}/month
              </DialogDescription>
            </DialogHeader>

            {selectedRoom.status === "vacant" ? (
              <VacantRoomView
                onOccupy={handleOccupyRoom}
                isLoading={isLoading}
              />
            ) : (
              selectedRoom.renter && (
                <OccupiedRoomView
                  room={selectedRoom}
                  isEditing={isEditingRenter}
                  isLoading={isLoading}
                  onEditStart={() => setIsEditingRenter(true)}
                  onEditCancel={() => setIsEditingRenter(false)}
                  onEditSave={handleUpdateRenterInfo}
                  onPaymentSubmit={handleUpdatePayment}
                  onMarkFullyPaid={handleMarkFullyPaid}
                  onRenewalSubmit={handleRenewContract}
                  onNotRenew={handleNotRenew}
                />
              )
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Dialog */}
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
