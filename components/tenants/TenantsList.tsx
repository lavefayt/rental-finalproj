"use client";

import { useState } from "react";
import { Room } from "@/types/app.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  DollarSign,
  Mail,
  Phone,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
} from "lucide-react";
import { EditRenterForm } from "./EditRenterForm";
import { truncateName } from "@/utils/textUtils";
import { getTotalRent } from "@/utils/paymentUtils";
import { ConfirmDialog } from "../ConfirmDialog";

interface TenantsListProps {
  rooms: Room[];
  onUpdateRenter: (
    roomId: string,
    renterData: {
      firstName: string;
      lastName: string;
      email: string;
      contactNumber: string;
    }
  ) => void;
  onVacateRoom: (roomId: string) => void;
}

export function TenantsList({
  rooms,
  onUpdateRenter,
  onVacateRoom,
}: TenantsListProps) {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  // Filter only occupied rooms
  const occupiedRooms = rooms.filter(
    (room) => room.status === "occupied" && room.renter
  );

  const calculateDue = (room: Room) => {
    if (!room.renter) return 0;

    const totalRent = getTotalRent(room);
    const isExpired = new Date(room.renter.contractEndDate) < new Date();
    const hasPastDue = room.renter.amountPaid < totalRent;

    if (!hasPastDue) return 0;

    const balance = totalRent - room.renter.amountPaid;

    // Add 10% late fee if contract expired
    if (isExpired) {
      const lateFee = Math.round(balance * 0.1);
      return balance + lateFee;
    }

    return balance;
  };

  const isContractExpired = (contractEndDate: string) => {
    return new Date(contractEndDate) < new Date();
  };

  const isPastDue = (room: Room) => {
    const totalRent = getTotalRent(room);
    return room.renter && room.renter.amountPaid < totalRent;
  };

  const handleSaveRenter = (data: {
    firstName: string;
    lastName: string;
    email: string;
    contactNumber: string;
  }) => {
    if (selectedRoom) {
      setConfirmDialog({
        open: true,
        title: "Update Tenant Information?",
        description: `Are you sure you want to update the information for ${data.firstName} ${data.lastName} in Room ${selectedRoom.roomNumber}?`,
        onConfirm: async () => {
          onUpdateRenter(selectedRoom.id, data);
          setIsEditing(false);
          setConfirmDialog({ ...confirmDialog, open: false });
        },
      });
    }
  };

  const handleDeleteTenant = (room: Room) => {
    if (!room.renter) return;

    const totalRent = getTotalRent(room);
    const hasUnpaidBalance = room.renter.amountPaid < totalRent;

    if (hasUnpaidBalance) {
      const remainingBalance = totalRent - room.renter.amountPaid;
      setConfirmDialog({
        open: true,
        title: "Cannot Remove Tenant",
        description: `${room.renter.firstName} ${
          room.renter.lastName
        } still has an unpaid balance of ₱${remainingBalance.toLocaleString()}. Please ensure full payment before removing the tenant.`,
        onConfirm: () => {
          setConfirmDialog({ ...confirmDialog, open: false });
        },
      });
      return;
    }

    setConfirmDialog({
      open: true,
      title: "Remove Tenant?",
      description: `Are you sure you want to remove ${room.renter.firstName} ${room.renter.lastName} from Room ${room.roomNumber}? This will vacate the room and terminate the contract.`,
      onConfirm: async () => {
        await onVacateRoom(room.id);
        setConfirmDialog({ ...confirmDialog, open: false });
        handleCloseDialog();
      },
    });
  };

  const handleCloseDialog = () => {
    setSelectedRoom(null);
    setIsEditing(false);
  };

  if (occupiedRooms.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 mx-auto text-slate-400 mb-4" />
        <p className="text-slate-600">No tenants found</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Room #</TableHead>
              <TableHead>Tenant Name</TableHead>
              <TableHead>Monthly Rent</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {occupiedRooms.map((room) => {
              if (!room.renter) return null;

              const expired = isContractExpired(room.renter.contractEndDate);
              const pastDue = isPastDue(room);
              const fullName = `${room.renter.firstName} ${room.renter.lastName}`;

              return (
                <TableRow
                  key={room.id}
                  className={
                    expired ? "bg-red-50" : pastDue ? "bg-orange-50" : ""
                  }
                >
                  <TableCell>{room.roomNumber}</TableCell>
                  <TableCell>{truncateName(fullName)}</TableCell>
                  <TableCell>₱{room.price.toLocaleString()}/mo</TableCell>
                  <TableCell>
                    {new Date(room.renter.rentStartDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className={expired ? "text-red-600" : ""}>
                        {new Date(
                          room.renter.contractEndDate
                        ).toLocaleDateString()}
                      </div>
                      {expired && (
                        <div className="text-red-600 text-xs">(Expired)</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
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
                        <DropdownMenuItem onClick={() => setSelectedRoom(room)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteTenant(room)}
                          className={
                            pastDue ? "text-slate-400" : "text-red-600"
                          }
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {pastDue ? "Has Unpaid Balance" : "Remove Tenant"}
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

      {selectedRoom && selectedRoom.renter && (
        <Dialog open={!!selectedRoom} onOpenChange={handleCloseDialog}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-6 h-6" />
                Tenant Details
              </DialogTitle>
              <DialogDescription>
                Room {selectedRoom.roomNumber}
              </DialogDescription>
            </DialogHeader>

            {!isEditing ? (
              <>
                <div className="space-y-4 mt-4">
                  {/* Personal Information */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-slate-900">Personal Information</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-slate-500">First Name:</span>
                          <p className="text-slate-900">
                            {selectedRoom.renter.firstName}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500">Last Name:</span>
                          <p className="text-slate-900">
                            {selectedRoom.renter.lastName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-500" />
                        <div className="flex-1">
                          <span className="text-slate-500">Email:</span>
                          <p className="text-slate-900 break-all">
                            {selectedRoom.renter.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-500" />
                        <div>
                          <span className="text-slate-500">Contact:</span>
                          <p className="text-slate-900">
                            {selectedRoom.renter.contactNumber}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Room & Contract Information */}
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h3 className="text-slate-900 mb-3">
                      Room & Contract Information
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-slate-500">Room Number:</span>
                          <p className="text-slate-900">
                            {selectedRoom.roomNumber}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500">Monthly Rent:</span>
                          <p className="text-slate-900">
                            ₱{selectedRoom.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Contract Period:</span>
                        <p
                          className={
                            isContractExpired(
                              selectedRoom.renter.contractEndDate
                            )
                              ? "text-red-600"
                              : "text-slate-900"
                          }
                        >
                          {new Date(
                            selectedRoom.renter.rentStartDate
                          ).toLocaleDateString()}{" "}
                          -{" "}
                          {new Date(
                            selectedRoom.renter.contractEndDate
                          ).toLocaleDateString()}
                          {isContractExpired(
                            selectedRoom.renter.contractEndDate
                          ) && (
                            <Badge
                              variant="destructive"
                              className="ml-2 text-xs"
                            >
                              Expired
                            </Badge>
                          )}
                        </p>
                      </div>
                      {selectedRoom.renter.contractType && (
                        <div>
                          <span className="text-slate-500">Contract Type:</span>
                          <p className="text-slate-900 capitalize">
                            {selectedRoom.renter.contractType}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div
                    className={`p-4 rounded-lg border ${
                      selectedRoom.renter.amountPaid < getTotalRent(selectedRoom)
                        ? isContractExpired(selectedRoom.renter.contractEndDate)
                          ? "bg-red-50 border-red-200"
                          : "bg-orange-50 border-orange-200"
                        : "bg-green-50 border-green-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-slate-900 flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Payment Information
                      </h3>
                      {selectedRoom.renter.amountPaid < getTotalRent(selectedRoom) ? (
                        <Badge variant="destructive">Unpaid Balance</Badge>
                      ) : (
                        <Badge className="bg-green-600">Fully Paid</Badge>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Amount Paid:</span>
                        <span className="text-slate-900">
                          ₱{selectedRoom.renter.amountPaid.toLocaleString()} / ₱{getTotalRent(selectedRoom).toLocaleString()}
                        </span>
                      </div>
                      {selectedRoom.renter.contractType === "custom" ? (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Daily Rate:</span>
                          <span className="text-slate-900">
                            ₱{(selectedRoom.dailyRate || Math.round(selectedRoom.price / 30)).toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Monthly Rent:</span>
                          <span className="text-slate-900">
                            ₱{selectedRoom.price.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-600">Balance:</span>
                        <span
                          className={
                            selectedRoom.renter.amountPaid < getTotalRent(selectedRoom)
                              ? "text-red-600"
                              : "text-green-600"
                          }
                        >
                          ₱
                          {Math.max(
                            0,
                            getTotalRent(selectedRoom) - selectedRoom.renter.amountPaid
                          ).toLocaleString()}
                        </span>
                      </div>
                      {isContractExpired(selectedRoom.renter.contractEndDate) &&
                        selectedRoom.renter.amountPaid < getTotalRent(selectedRoom) && (
                          <>
                            <div className="flex justify-between border-t pt-2 mt-2">
                              <span className="text-red-600">
                                Late Fee (10%):
                              </span>
                              <span className="text-red-600">
                                ₱
                                {Math.round(
                                  (getTotalRent(selectedRoom) -
                                    selectedRoom.renter.amountPaid) *
                                    0.1
                                ).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-red-600">Total Due:</span>
                              <span className="text-red-600">
                                ₱{calculateDue(selectedRoom).toLocaleString()}
                              </span>
                            </div>
                          </>
                        )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-4">
                <h3 className="text-slate-900 mb-4">Edit Tenant Information</h3>
                <EditRenterForm
                  initialData={{
                    firstName: selectedRoom.renter.firstName,
                    lastName: selectedRoom.renter.lastName,
                    email: selectedRoom.renter.email,
                    contactNumber: selectedRoom.renter.contactNumber,
                  }}
                  onSave={handleSaveRenter}
                  onCancel={() => setIsEditing(false)}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
      />
    </>
  );
}
