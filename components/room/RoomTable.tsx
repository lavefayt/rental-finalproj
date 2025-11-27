"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DoorOpen,
  User,
  DollarSign,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
} from "lucide-react";
import { Room } from "../App";
import { ConfirmDialog } from "../ConfirmDialog";
import { truncateName } from "@/utils/textUtils";

interface RoomTableProps {
  rooms: Room[];
  onUpdatePayment: (roomId: string, amountPaid: number) => void;
  onRenewContract: (
    roomId: string,
    newEndDate: string,
    contractType?: "monthly" | "yearly" | "custom"
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

// Validation Schemas
const newTenantSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  contactNumber: z.string().min(1, "Contact number is required"),
  contractType: z.enum(["monthly", "yearly", "custom"]),
  rentStartDate: z.string().min(1, "Start date is required"),
  contractEndDate: z.string().min(1, "End date is required"),
  amountPaid: z
    .string()
    .refine(
      (val) => val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      {
        message: "Amount must be a valid number",
      }
    )
    .transform((val) => (val === "" ? "0" : val)),
});

const editRenterSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  contactNumber: z.string().min(1, "Contact number is required"),
});

const paymentSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be greater than 0",
    }),
});

const renewalSchema = z.object({
  contractType: z.enum(["monthly", "yearly", "custom"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

type NewTenantFormData = z.infer<typeof newTenantSchema>;
type EditRenterFormData = z.infer<typeof editRenterSchema>;
type PaymentFormData = z.infer<typeof paymentSchema>;
type RenewalFormData = z.infer<typeof renewalSchema>;

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

  // Get today's date and calculate default end date for monthly contract
  const today = new Date().toISOString().split("T")[0];
  const defaultEndDate = (() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split("T")[0];
  })();

  // New Tenant Form
  const newTenantForm = useForm<NewTenantFormData>({
    resolver: zodResolver(newTenantSchema),
    defaultValues: {
      contractType: "monthly",
      amountPaid: "",
      rentStartDate: today,
      contractEndDate: defaultEndDate,
    },
  });

  // Edit Renter Form
  const editRenterForm = useForm<EditRenterFormData>({
    resolver: zodResolver(editRenterSchema),
  });

  // Payment Form
  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
  });

  // Renewal Form
  const renewalForm = useForm<RenewalFormData>({
    resolver: zodResolver(renewalSchema),
    defaultValues: {
      contractType: "monthly",
    },
  });

  // Confirmation dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: "default" | "destructive";
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const isContractExpired = (room: Room) => {
    return room.renter
      ? new Date(room.renter.contractEndDate) < new Date()
      : false;
  };

  const isPastDue = (room: Room) => {
    return room.renter && room.renter.amountPaid < room.price;
  };

  const calculateInterest = (room: Room) => {
    if (!room.renter || !isPastDue(room) || !isContractExpired(room)) return 0;
    const balance = room.price - room.renter.amountPaid;
    return Math.round(balance * 0.1);
  };

  // Helper function to calculate end date based on contract type
  const calculateEndDate = (
    startDate: string,
    type: "monthly" | "yearly" | "custom"
  ) => {
    if (type === "custom" || !startDate) return "";

    const date = new Date(startDate);
    if (type === "monthly") {
      date.setMonth(date.getMonth() + 1);
    } else if (type === "yearly") {
      date.setFullYear(date.getFullYear() + 1);
    }
    return date.toISOString().split("T")[0];
  };

  const handleMarkFullyPaid = () => {
    if (!selectedRoom || !selectedRoom.renter) return;

    const currentPaid = selectedRoom.renter.amountPaid;
    const remainingBalance = selectedRoom.price - currentPaid;

    // If already fully paid or overpaid, do nothing
    if (remainingBalance <= 0) return;

    // Calculate interest only on the remaining balance if contract is expired
    const interestOnBalance =
      isContractExpired(selectedRoom) && isPastDue(selectedRoom)
        ? Math.round(remainingBalance * 0.1)
        : 0;

    const paymentAmount = remainingBalance + interestOnBalance;

    setConfirmDialog({
      open: true,
      title: "Mark as Fully Paid?",
      description: `Are you sure you want to mark Room ${
        selectedRoom.roomNumber
      } as fully paid? This will add a payment of ₱${paymentAmount.toLocaleString()}${
        interestOnBalance > 0
          ? ` (including ₱${interestOnBalance.toLocaleString()} interest)`
          : ""
      }.`,
      onConfirm: async () => {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        onUpdatePayment(selectedRoom.id, paymentAmount);
        setIsLoading(false);
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  };

  const handleUpdatePayment = paymentForm.handleSubmit((data) => {
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
        paymentForm.reset();
        setIsLoading(false);
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  });

  const handleRenewContract = renewalForm.handleSubmit((data) => {
    if (!selectedRoom) return;

    setConfirmDialog({
      open: true,
      title: "Renew Contract?",
      description: `Are you sure you want to renew the contract for Room ${
        selectedRoom.roomNumber
      } until ${new Date(data.endDate).toLocaleDateString()}?`,
      onConfirm: async () => {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        onRenewContract(selectedRoom.id, data.endDate, data.contractType);
        renewalForm.reset();
        setIsLoading(false);
        setConfirmDialog({ ...confirmDialog, open: false });
        setSelectedRoom(null);
      },
    });
  });

  const handleNotRenew = () => {
    if (!selectedRoom) return;

    setConfirmDialog({
      open: true,
      title: "Do Not Renew Contract?",
      description: `Are you sure you do not want to renew the contract for Room ${selectedRoom.roomNumber}? This will mark the room as vacant and remove the current tenant.`,
      onConfirm: async () => {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        onVacateRoom(selectedRoom.id);
        setSelectedRoom(null);
        setIsLoading(false);
        setConfirmDialog({ ...confirmDialog, open: false });
      },
      variant: "destructive",
    });
  };

  const handleOccupyRoom = newTenantForm.handleSubmit((data) => {
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
        newTenantForm.reset();
        setSelectedRoom(null);
        setIsLoading(false);
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  });

  const handleEditRenterOpen = () => {
    if (selectedRoom?.renter) {
      editRenterForm.reset({
        firstName: selectedRoom.renter.firstName,
        lastName: selectedRoom.renter.lastName,
        email: selectedRoom.renter.email,
        contactNumber: selectedRoom.renter.contactNumber,
      });
      setIsEditingRenter(true);
    }
  };

  const handleUpdateRenterInfo = editRenterForm.handleSubmit((data) => {
    if (!selectedRoom) return;

    setConfirmDialog({
      open: true,
      title: "Update Renter Information?",
      description: `Are you sure you want to update the renter information for Room ${selectedRoom.roomNumber}?`,
      onConfirm: async () => {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        onUpdateRenter(selectedRoom.id, {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          contactNumber: data.contactNumber,
        });
        setIsEditingRenter(false);
        setIsLoading(false);
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  });

  const handleCloseDialog = () => {
    setSelectedRoom(null);
    setIsEditingRenter(false);
    newTenantForm.reset();
    editRenterForm.reset();
    paymentForm.reset();
    renewalForm.reset();
  };

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
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Room #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.map((room) => {
              const expired = isContractExpired(room);
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
                  <TableCell>₱{room.price.toLocaleString()}</TableCell>
                  <TableCell>
                    {tenantName === "-" ? "-" : truncateName(tenantName)}
                  </TableCell>
                  <TableCell>
                    {room.renter
                      ? new Date(room.renter.rentStartDate).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {room.renter ? (
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
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {room.renter ? (
                      <div>
                        <div>
                          ₱{room.renter.amountPaid.toLocaleString()} / ₱
                          {room.price.toLocaleString()}
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
                        <DropdownMenuItem onClick={() => setSelectedRoom(room)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
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
              <div className="py-8 text-center">
                <DoorOpen className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                <p className="text-slate-600 mb-6">
                  This room is currently vacant
                </p>

                <form
                  onSubmit={handleOccupyRoom}
                  className="bg-slate-50 p-6 rounded-lg space-y-4 text-left"
                >
                  <h3 className="text-slate-900 mb-4">
                    Enter New Tenant Details
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="First name"
                        aria-invalid={
                          !!newTenantForm.formState.errors.firstName
                        }
                        {...newTenantForm.register("firstName")}
                      />
                      {newTenantForm.formState.errors.firstName && (
                        <p className="text-red-500 text-sm">
                          {newTenantForm.formState.errors.firstName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Last name"
                        aria-invalid={!!newTenantForm.formState.errors.lastName}
                        {...newTenantForm.register("lastName")}
                      />
                      {newTenantForm.formState.errors.lastName && (
                        <p className="text-red-500 text-sm">
                          {newTenantForm.formState.errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      aria-invalid={!!newTenantForm.formState.errors.email}
                      {...newTenantForm.register("email")}
                    />
                    {newTenantForm.formState.errors.email && (
                      <p className="text-red-500 text-sm">
                        {newTenantForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactNumber">Contact Number</Label>
                    <Input
                      id="contactNumber"
                      type="tel"
                      placeholder="123-456-7890"
                      aria-invalid={
                        !!newTenantForm.formState.errors.contactNumber
                      }
                      {...newTenantForm.register("contactNumber")}
                    />
                    {newTenantForm.formState.errors.contactNumber && (
                      <p className="text-red-500 text-sm">
                        {newTenantForm.formState.errors.contactNumber.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contractType">Contract Type</Label>
                    <Select
                      value={newTenantForm.watch("contractType")}
                      onValueChange={(
                        value: "monthly" | "yearly" | "custom"
                      ) => {
                        newTenantForm.setValue("contractType", value);
                        const startDate =
                          newTenantForm.getValues("rentStartDate");
                        if (startDate && value !== "custom") {
                          const calculatedEndDate = calculateEndDate(
                            startDate,
                            value
                          );
                          newTenantForm.setValue(
                            "contractEndDate",
                            calculatedEndDate
                          );
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select contract type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">
                          Monthly (1 month)
                        </SelectItem>
                        <SelectItem value="yearly">Yearly (1 year)</SelectItem>
                        <SelectItem value="custom">Custom Duration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Contract Period</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="rentStartDate"
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        className="flex-1"
                        aria-invalid={
                          !!newTenantForm.formState.errors.rentStartDate
                        }
                        {...newTenantForm.register("rentStartDate", {
                          onChange: (e) => {
                            const startDate = e.target.value;
                            const contractType =
                              newTenantForm.getValues("contractType");
                            if (startDate && contractType !== "custom") {
                              const calculatedEndDate = calculateEndDate(
                                startDate,
                                contractType
                              );
                              newTenantForm.setValue(
                                "contractEndDate",
                                calculatedEndDate
                              );
                            }
                          },
                        })}
                      />
                      <span className="text-slate-500">-</span>
                      <Input
                        id="contractEndDate"
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        disabled={
                          newTenantForm.watch("contractType") !== "custom"
                        }
                        className="flex-1"
                        aria-invalid={
                          !!newTenantForm.formState.errors.contractEndDate
                        }
                        {...newTenantForm.register("contractEndDate")}
                      />
                    </div>
                    {newTenantForm.formState.errors.rentStartDate && (
                      <p className="text-red-500 text-sm">
                        {newTenantForm.formState.errors.rentStartDate.message}
                      </p>
                    )}
                    {newTenantForm.formState.errors.contractEndDate && (
                      <p className="text-red-500 text-sm">
                        {newTenantForm.formState.errors.contractEndDate.message}
                      </p>
                    )}
                    {newTenantForm.watch("contractType") !== "custom" &&
                      newTenantForm.watch("contractEndDate") && (
                        <p className="text-sm text-slate-500">
                          End date auto-calculated based on{" "}
                          {newTenantForm.watch("contractType")} contract
                        </p>
                      )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amountPaid">Amount Paid</Label>
                    <Input
                      id="amountPaid"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Enter amount paid"
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      onFocus={(e) => e.target.select()}
                      aria-invalid={!!newTenantForm.formState.errors.amountPaid}
                      {...newTenantForm.register("amountPaid")}
                    />
                    {newTenantForm.formState.errors.amountPaid && (
                      <p className="text-red-500 text-sm">
                        {newTenantForm.formState.errors.amountPaid.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    variant="default"
                    disabled={isLoading}
                  >
                    {isLoading ? "Processing..." : "Occupy Room"}
                  </Button>
                </form>
              </div>
            ) : (
              selectedRoom.renter && (
                <div className="space-y-6 mt-4">
                  {isEditingRenter ? (
                    <form
                      onSubmit={handleUpdateRenterInfo}
                      className="bg-blue-50 p-4 rounded-lg space-y-4 border border-blue-200"
                    >
                      <h3 className="text-slate-900 mb-2">
                        Edit Renter Information
                      </h3>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="editFirstName">First Name</Label>
                          <Input
                            id="editFirstName"
                            type="text"
                            aria-invalid={
                              !!editRenterForm.formState.errors.firstName
                            }
                            {...editRenterForm.register("firstName")}
                          />
                          {editRenterForm.formState.errors.firstName && (
                            <p className="text-red-500 text-sm">
                              {
                                editRenterForm.formState.errors.firstName
                                  .message
                              }
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="editLastName">Last Name</Label>
                          <Input
                            id="editLastName"
                            type="text"
                            aria-invalid={
                              !!editRenterForm.formState.errors.lastName
                            }
                            {...editRenterForm.register("lastName")}
                          />
                          {editRenterForm.formState.errors.lastName && (
                            <p className="text-red-500 text-sm">
                              {editRenterForm.formState.errors.lastName.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="editEmail">Email</Label>
                        <Input
                          id="editEmail"
                          type="email"
                          aria-invalid={!!editRenterForm.formState.errors.email}
                          {...editRenterForm.register("email")}
                        />
                        {editRenterForm.formState.errors.email && (
                          <p className="text-red-500 text-sm">
                            {editRenterForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="editContactNumber">
                          Contact Number
                        </Label>
                        <Input
                          id="editContactNumber"
                          type="tel"
                          aria-invalid={
                            !!editRenterForm.formState.errors.contactNumber
                          }
                          {...editRenterForm.register("contactNumber")}
                        />
                        {editRenterForm.formState.errors.contactNumber && (
                          <p className="text-red-500 text-sm">
                            {
                              editRenterForm.formState.errors.contactNumber
                                .message
                            }
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={() => setIsEditingRenter(false)}
                          variant="outline"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1"
                          disabled={isLoading}
                        >
                          {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      {/* Room Details Section */}
                      <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                        <h3 className="text-slate-900 mb-2">Room Details</h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-slate-500">Room Number:</span>
                            <p className="text-slate-900">
                              {selectedRoom.roomNumber}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-500">
                              Monthly Rent:
                            </span>
                            <p className="text-slate-900">
                              ₱{selectedRoom.price.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-500">Status:</span>
                            <p className="text-slate-900">
                              <Badge
                                variant="default"
                                className="bg-green-100 text-green-700"
                              >
                                Occupied
                              </Badge>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Renter Information Section */}
                      <div className="bg-blue-50 p-4 rounded-lg space-y-3 border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-slate-900 flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Renter Information
                          </h3>
                          <Button
                            onClick={handleEditRenterOpen}
                            variant="outline"
                            size="sm"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                        <div className="space-y-3 text-sm">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <span className="text-slate-500">
                                First Name:
                              </span>
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
                          <div>
                            <span className="text-slate-500">Email:</span>
                            <p className="text-slate-900">
                              {selectedRoom.renter.email}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-500">
                              Contact Number:
                            </span>
                            <p className="text-slate-900">
                              {selectedRoom.renter.contactNumber}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-500">
                              Contract Period:
                            </span>
                            <p
                              className={
                                isContractExpired(selectedRoom)
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
                              {isContractExpired(selectedRoom) && (
                                <Badge
                                  variant="destructive"
                                  className="ml-2 text-xs"
                                >
                                  Expired
                                </Badge>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Payment Status */}
                      <div
                        className={`p-4 rounded-lg border ${
                          isPastDue(selectedRoom)
                            ? isContractExpired(selectedRoom)
                              ? "bg-red-50 border-red-200"
                              : "bg-orange-50 border-orange-200"
                            : "bg-green-50 border-green-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-slate-900 flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            Payment Status
                          </h3>
                          {isPastDue(selectedRoom) ? (
                            <Badge variant="destructive">Unpaid Balance</Badge>
                          ) : (
                            <Badge className="bg-green-600">Fully Paid</Badge>
                          )}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Amount Paid:</span>
                            <span className="text-slate-900">
                              ₱{selectedRoom.renter.amountPaid.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">
                              Monthly Rent:
                            </span>
                            <span className="text-slate-900">
                              ₱{selectedRoom.price.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Balance:</span>
                            <span
                              className={
                                isPastDue(selectedRoom)
                                  ? "text-red-600"
                                  : "text-green-600"
                              }
                            >
                              ₱
                              {Math.max(
                                0,
                                selectedRoom.price -
                                  selectedRoom.renter.amountPaid
                              ).toLocaleString()}
                            </span>
                          </div>
                          {isContractExpired(selectedRoom) &&
                            isPastDue(selectedRoom) &&
                            calculateInterest(selectedRoom) > 0 && (
                              <>
                                <div className="flex justify-between border-t pt-2 mt-2">
                                  <span className="text-red-600">
                                    Late Fee (10%):
                                  </span>
                                  <span className="text-red-600">
                                    ₱
                                    {calculateInterest(
                                      selectedRoom
                                    ).toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-red-600">
                                    Total Due:
                                  </span>
                                  <span className="text-red-600">
                                    ₱
                                    {(
                                      selectedRoom.price +
                                      calculateInterest(selectedRoom)
                                    ).toLocaleString()}
                                  </span>
                                </div>
                              </>
                            )}
                        </div>
                      </div>

                      {/* Payment Actions */}
                      {isPastDue(selectedRoom) && (
                        <form
                          onSubmit={handleUpdatePayment}
                          className="space-y-3"
                        >
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Label htmlFor="payment">Add Payment</Label>
                              <Input
                                id="payment"
                                type="number"
                                min="0"
                                step="any"
                                placeholder="Enter amount"
                                className="mt-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                onFocus={(e) => e.target.select()}
                                aria-invalid={
                                  !!paymentForm.formState.errors.amount
                                }
                                {...paymentForm.register("amount")}
                              />
                              {paymentForm.formState.errors.amount && (
                                <p className="text-red-500 text-sm mt-1">
                                  {paymentForm.formState.errors.amount.message}
                                </p>
                              )}
                            </div>
                            <Button
                              type="submit"
                              className="mt-6"
                              disabled={isLoading}
                            >
                              {isLoading ? "Adding..." : "Add"}
                            </Button>
                          </div>
                          <Button
                            type="button"
                            onClick={handleMarkFullyPaid}
                            className="w-full"
                            variant="default"
                            disabled={isLoading}
                          >
                            {isLoading ? "Processing..." : "Mark as Fully Paid"}
                          </Button>
                        </form>
                      )}

                      {/* Contract Renewal */}
                      {isContractExpired(selectedRoom) && (
                        <form
                          onSubmit={handleRenewContract}
                          className="space-y-3 pt-4 border-t"
                        >
                          <h3 className="text-red-600">
                            Contract Expired - Action Required
                          </h3>

                          <div className="space-y-2">
                            <Label htmlFor="renewContractType">
                              Contract Type
                            </Label>
                            <Select
                              value={renewalForm.watch("contractType")}
                              onValueChange={(
                                value: "monthly" | "yearly" | "custom"
                              ) => {
                                renewalForm.setValue("contractType", value);
                                const startDate =
                                  renewalForm.getValues("startDate");
                                if (value !== "custom" && startDate) {
                                  const calculatedEndDate = calculateEndDate(
                                    startDate,
                                    value
                                  );
                                  renewalForm.setValue(
                                    "endDate",
                                    calculatedEndDate
                                  );
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="monthly">
                                  Monthly (1 month)
                                </SelectItem>
                                <SelectItem value="yearly">
                                  Yearly (1 year)
                                </SelectItem>
                                <SelectItem value="custom">
                                  Custom Duration
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>New Contract Period</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="renewalStartDate"
                                type="date"
                                min={new Date().toISOString().split("T")[0]}
                                className="flex-1"
                                aria-invalid={
                                  !!renewalForm.formState.errors.startDate
                                }
                                {...renewalForm.register("startDate", {
                                  onChange: (e) => {
                                    const startDate = e.target.value;
                                    const contractType =
                                      renewalForm.getValues("contractType");
                                    if (
                                      startDate &&
                                      contractType !== "custom"
                                    ) {
                                      const calculatedEndDate =
                                        calculateEndDate(
                                          startDate,
                                          contractType
                                        );
                                      renewalForm.setValue(
                                        "endDate",
                                        calculatedEndDate
                                      );
                                    }
                                  },
                                })}
                              />
                              <span className="text-slate-500">-</span>
                              <Input
                                id="renewalEndDate"
                                type="date"
                                min={new Date().toISOString().split("T")[0]}
                                disabled={
                                  renewalForm.watch("contractType") !== "custom"
                                }
                                className="flex-1"
                                aria-invalid={
                                  !!renewalForm.formState.errors.endDate
                                }
                                {...renewalForm.register("endDate")}
                              />
                            </div>
                            {renewalForm.formState.errors.startDate && (
                              <p className="text-red-500 text-sm">
                                {renewalForm.formState.errors.startDate.message}
                              </p>
                            )}
                            {renewalForm.formState.errors.endDate && (
                              <p className="text-red-500 text-sm">
                                {renewalForm.formState.errors.endDate.message}
                              </p>
                            )}
                            {renewalForm.watch("contractType") !== "custom" &&
                              renewalForm.watch("endDate") && (
                                <p className="text-sm text-slate-500">
                                  End date auto-calculated based on{" "}
                                  {renewalForm.watch("contractType")} contract
                                </p>
                              )}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              type="submit"
                              className="flex-1"
                              disabled={isLoading}
                            >
                              {isLoading ? "Renewing..." : "Renew Contract"}
                            </Button>
                            <Button
                              type="button"
                              onClick={handleNotRenew}
                              variant="destructive"
                              className="flex-1"
                              disabled={isLoading}
                            >
                              {isLoading ? "Processing..." : "Do Not Renew"}
                            </Button>
                          </div>
                        </form>
                      )}
                    </>
                  )}
                </div>
              )
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
        variant={confirmDialog.variant}
      />
    </>
  );
}
