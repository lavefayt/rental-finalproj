"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components//ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DoorOpen, AlertCircle, User, DollarSign, Edit } from "lucide-react";
import { Room } from "../App";
import { ConfirmDialog } from "../ConfirmDialog";
import { truncateName } from "@/utils/textUtils";

interface RoomCardProps {
  room: Room;
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
    .min(1, "Amount is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "Amount must be a valid number",
    }),
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

export function RoomCard({
  room,
  onUpdatePayment,
  onRenewContract,
  onVacateRoom,
  onOccupyRoom,
  onUpdateRenter,
}: RoomCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingRenter, setIsEditingRenter] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // New Tenant Form
  const newTenantForm = useForm<NewTenantFormData>({
    resolver: zodResolver(newTenantSchema),
    defaultValues: {
      contractType: "monthly",
      amountPaid: "0",
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

  const isContractExpired = room.renter
    ? new Date(room.renter.contractEndDate) < new Date()
    : false;

  const isPastDue = room.renter && room.renter.amountPaid < room.price;

  const calculateInterest = () => {
    if (!room.renter || !isPastDue || !isContractExpired) return 0;
    const balance = room.price - room.renter.amountPaid;
    return Math.round(balance * 0.1);
  };

  const interest = calculateInterest();
  const totalDue =
    isPastDue && isContractExpired ? room.price + interest : room.price;

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
    if (!room.renter) return;
    
    const currentPaid = room.renter.amountPaid;
    const remainingBalance = room.price - currentPaid;
    
    // If already fully paid or overpaid, do nothing
    if (remainingBalance <= 0) return;
    
    // Calculate interest only on the remaining balance if contract is expired
    const interestOnBalance = isContractExpired && isPastDue 
      ? Math.round(remainingBalance * 0.1) 
      : 0;
    
    const paymentAmount = remainingBalance + interestOnBalance;
    
    setConfirmDialog({
      open: true,
      title: "Mark as Fully Paid?",
      description: `Are you sure you want to mark Room ${
        room.roomNumber
      } as fully paid? This will add a payment of ₱${paymentAmount.toLocaleString()}${interestOnBalance > 0 ? ` (including ₱${interestOnBalance.toLocaleString()} interest)` : ''}.`,
      onConfirm: async () => {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        onUpdatePayment(room.id, paymentAmount);
        setIsLoading(false);
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  };

  const handleUpdatePayment = paymentForm.handleSubmit((data) => {
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
        paymentForm.reset();
        setIsLoading(false);
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  });

  const handleRenewContract = renewalForm.handleSubmit((data) => {
    setConfirmDialog({
      open: true,
      title: "Renew Contract?",
      description: `Are you sure you want to renew the contract for Room ${
        room.roomNumber
      } until ${new Date(data.endDate).toLocaleDateString()}?`,
      onConfirm: async () => {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        onRenewContract(room.id, data.endDate, data.contractType);
        renewalForm.reset();
        setIsLoading(false);
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  });

  const handleNotRenew = () => {
    setConfirmDialog({
      open: true,
      title: "Do Not Renew Contract?",
      description: `Are you sure you do not want to renew the contract for Room ${room.roomNumber}? This will mark the room as vacant and remove the current tenant.`,
      onConfirm: async () => {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        onVacateRoom(room.id);
        setIsOpen(false);
        setIsLoading(false);
        setConfirmDialog({ ...confirmDialog, open: false });
      },
      variant: "destructive",
    });
  };

  const handleOccupyRoom = newTenantForm.handleSubmit((data) => {
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
        newTenantForm.reset();
        setIsOpen(false);
        setIsLoading(false);
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  });

  const handleEditRenterOpen = () => {
    if (room.renter) {
      editRenterForm.reset({
        firstName: room.renter.firstName,
        lastName: room.renter.lastName,
        email: room.renter.email,
        contactNumber: room.renter.contactNumber,
      });
      setIsEditingRenter(true);
    }
  };

  const handleUpdateRenterInfo = editRenterForm.handleSubmit((data) => {
    setConfirmDialog({
      open: true,
      title: "Update Renter Information?",
      description: `Are you sure you want to update the renter information for Room ${room.roomNumber}?`,
      onConfirm: async () => {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        onUpdateRenter(room.id, {
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

  return (
    <>
      <Card
        className={`cursor-pointer transition-all hover:shadow-lg ${
          isContractExpired ? "border-red-400 border-2" : ""
        } ${
          isPastDue && !isContractExpired ? "border-orange-400 border-2" : ""
        }`}
        onClick={() => setIsOpen(true)}
      >
        <CardHeader>
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
          {isContractExpired && (
            <div className="mt-2 flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>Contract Expired</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          // Reset all forms when dialog closes
          newTenantForm.reset();
          editRenterForm.reset();
          paymentForm.reset();
          renewalForm.reset();
          setIsEditingRenter(false);
        }
      }}>
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
                      aria-invalid={!!newTenantForm.formState.errors.firstName}
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
                    onValueChange={(value: "monthly" | "yearly" | "custom") => {
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
                      <SelectItem value="monthly">Monthly (1 month)</SelectItem>
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
                    placeholder="Enter amount paid"
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
            room.renter && (
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
                            {editRenterForm.formState.errors.firstName.message}
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
                      <Label htmlFor="editContactNumber">Contact Number</Label>
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
                          <p className="text-slate-900">{room.roomNumber}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Monthly Rent:</span>
                          <p className="text-slate-900">
                            ₱{room.price.toLocaleString()}
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
                            <span className="text-slate-500">First Name:</span>
                            <p className="text-slate-900">
                              {room.renter.firstName}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-500">Last Name:</span>
                            <p className="text-slate-900">
                              {room.renter.lastName}
                            </p>
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500">Email:</span>
                          <p className="text-slate-900">{room.renter.email}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">
                            Contact Number:
                          </span>
                          <p className="text-slate-900">
                            {room.renter.contactNumber}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500">
                            Contract Period:
                          </span>
                          <p
                            className={
                              isContractExpired
                                ? "text-red-600"
                                : "text-slate-900"
                            }
                          >
                            {new Date(
                              room.renter.rentStartDate
                            ).toLocaleDateString()}{" "}
                            -{" "}
                            {new Date(
                              room.renter.contractEndDate
                            ).toLocaleDateString()}
                            {isContractExpired && (
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
                        isPastDue
                          ? isContractExpired
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
                        {isPastDue ? (
                          <Badge variant="destructive">Unpaid Balance</Badge>
                        ) : (
                          <Badge className="bg-green-600">Fully Paid</Badge>
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Amount Paid:</span>
                          <span className="text-slate-900">
                            ₱{room.renter.amountPaid.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Monthly Rent:</span>
                          <span className="text-slate-900">
                            ₱{room.price.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Balance:</span>
                          <span
                            className={
                              isPastDue ? "text-red-600" : "text-green-600"
                            }
                          >
                            ₱
                            {Math.max(
                              0,
                              room.price - room.renter.amountPaid
                            ).toLocaleString()}
                          </span>
                        </div>
                        {isContractExpired && isPastDue && interest > 0 && (
                          <>
                            <div className="flex justify-between border-t pt-2 mt-2">
                              <span className="text-red-600">
                                Late Fee (10%):
                              </span>
                              <span className="text-red-600">
                                ₱{interest.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-red-600">Total Due:</span>
                              <span className="text-red-600">
                                ₱{totalDue.toLocaleString()}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Payment Actions */}
                    {isPastDue && (
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
                              placeholder="Enter amount"
                              className="mt-1"
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
                    {isContractExpired && (
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
                                  if (startDate && contractType !== "custom") {
                                    const calculatedEndDate = calculateEndDate(
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
