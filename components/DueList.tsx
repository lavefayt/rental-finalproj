"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Clock, DollarSign } from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog";

interface DueContract {
  id: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  total_rent?: number;
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

interface DueListProps {
  contracts: DueContract[];
  onRecordPayment?: (roomId: string, amount: number) => void;
}

const paymentSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be greater than 0",
    }),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export function DueList({ contracts, onRecordPayment }: DueListProps) {
  const [selectedContract, setSelectedContract] = useState<DueContract | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
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

  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: "",
    },
  });

  const totalDue = contracts.reduce((sum, c) => sum + c.balance, 0);
  const overdueCount = contracts.filter((c) => c.is_overdue).length;

  const getDaysUntilDue = (endDate: string) => {
    const today = new Date();
    const due = new Date(endDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleRowClick = (contract: DueContract) => {
    paymentForm.reset({ amount: "" });
    setSelectedContract(contract);
  };

  const handleCloseDialog = () => {
    setSelectedContract(null);
    paymentForm.reset();
  };

  const handleSubmitPayment = paymentForm.handleSubmit(async (data) => {
    if (!selectedContract || !onRecordPayment || !selectedContract.room?.id)
      return;

    const amount = parseFloat(data.amount);
    const remainingBalance = selectedContract.balance;

    // Prevent excess payment
    if (amount > remainingBalance) {
      paymentForm.setError("amount", {
        type: "manual",
        message: `Payment cannot exceed balance of ₱${remainingBalance.toLocaleString()}`,
      });
      return;
    }

    setConfirmDialog({
      open: true,
      title: "Confirm Payment",
      description: `Are you sure you want to record a payment of ₱${amount.toLocaleString()} for Room ${
        selectedContract.room.room_number
      }?`,
      onConfirm: async () => {
        setIsLoading(true);
        await onRecordPayment(selectedContract.room!.id, amount);
        setIsLoading(false);
        setConfirmDialog({ ...confirmDialog, open: false });
        handleCloseDialog();
      },
    });
  });

  const handleMarkFullyPaid = () => {
    if (!selectedContract || !onRecordPayment || !selectedContract.room?.id)
      return;

    const remainingBalance = selectedContract.balance;
    if (remainingBalance <= 0) return;

    setConfirmDialog({
      open: true,
      title: "Pay Full Balance",
      description: `Are you sure you want to pay the full remaining balance of ₱${remainingBalance.toLocaleString()} for Room ${
        selectedContract.room.room_number
      }?`,
      onConfirm: async () => {
        setIsLoading(true);
        await onRecordPayment(selectedContract.room!.id, remainingBalance);
        setIsLoading(false);
        setConfirmDialog({ ...confirmDialog, open: false });
        handleCloseDialog();
      },
    });
  };

  if (contracts.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <DollarSign className="w-16 h-16 mx-auto text-green-500 mb-4" />
        <p className="text-slate-600 font-medium">No outstanding dues</p>
        <p className="text-sm text-slate-400 mt-1">
          All payments are up to date!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <span className="font-medium text-orange-800">
              Outstanding Balance
            </span>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-orange-700">
              ₱{totalDue.toLocaleString()}
            </p>
            <p className="text-sm text-orange-600">
              {contracts.length} contract{contracts.length !== 1 ? "s" : ""} •{" "}
              {overdueCount} overdue
            </p>
          </div>
        </div>
      </div>

      {/* Due Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Room</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Total Rent</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Remaining Balance</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((contract) => {
              const daysUntilDue = getDaysUntilDue(contract.end_date);
              const isOverdue = contract.is_overdue;
              const totalRent = contract.total_rent || contract.monthly_rent;
              const remainingBalance = contract.balance;

              return (
                <TableRow
                  key={contract.id}
                  className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                    isOverdue ? "bg-red-50 hover:bg-red-100" : ""
                  }`}
                  onClick={() => handleRowClick(contract)}
                >
                  <TableCell>
                    <Badge variant="outline" className="font-medium">
                      Room {contract.room?.room_number || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-900">
                        {contract.renter?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {contract.renter?.phone || ""}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    ₱{totalRent.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <span className="text-green-600 font-medium">
                      ₱{contract.total_paid.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <span className="font-semibold text-red-600">
                        ₱{remainingBalance.toLocaleString()}
                      </span>
                      <p className="text-xs text-slate-500">
                        {contract.total_paid > 0
                          ? `${Math.round(
                              (contract.total_paid / totalRent) *
                                100
                            )}% paid`
                          : "No payment yet"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-sm">
                          {new Date(contract.end_date).toLocaleDateString()}
                        </span>
                      </div>
                      <span
                        className={`text-xs ${
                          isOverdue
                            ? "text-red-600 font-medium"
                            : "text-slate-500"
                        }`}
                      >
                        {isOverdue
                          ? `${Math.abs(daysUntilDue)} days overdue`
                          : daysUntilDue === 0
                          ? "Due today"
                          : `${daysUntilDue} days left`}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isOverdue ? (
                      <Badge variant="destructive">Overdue</Badge>
                    ) : contract.payment_status === "partial" ? (
                      <Badge className="bg-yellow-500 hover:bg-yellow-600">
                        Partial
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Unpaid</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Payment Dialog */}
      <Dialog
        open={!!selectedContract}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Record Payment</DialogTitle>
            <DialogDescription>
              Room {selectedContract?.room?.room_number} •{" "}
              {selectedContract?.renter?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedContract && (
            <div className="space-y-4">
              {/* Payment Summary */}
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Rent:</span>
                  <span className="font-medium">
                    ₱{(selectedContract.total_rent || selectedContract.monthly_rent).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Already Paid:</span>
                  <span className="font-medium text-green-600">
                    ₱{selectedContract.total_paid.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-slate-700 font-medium">
                    Remaining Balance:
                  </span>
                  <span className="font-bold text-red-600">
                    ₱{selectedContract.balance.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment Form */}
              <form onSubmit={handleSubmitPayment} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentAmount">
                    Payment Amount <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="paymentAmount"
                    type="number"
                    min="0"
                    max={selectedContract.balance}
                    step="any"
                    placeholder="Enter amount"
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    onFocus={(e) => e.target.select()}
                    aria-invalid={!!paymentForm.formState.errors.amount}
                    {...paymentForm.register("amount")}
                  />
                  {paymentForm.formState.errors.amount && (
                    <p className="text-red-500 text-sm">
                      {paymentForm.formState.errors.amount.message}
                    </p>
                  )}
                  <p className="text-slate-500 text-xs">
                    Max: ₱{selectedContract.balance.toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    <DollarSign className="w-4 h-4 mr-1" />
                    {isLoading ? "Processing..." : "Add Payment"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleMarkFullyPaid}
                    disabled={isLoading}
                  >
                    {isLoading ? "Processing..." : "Pay Full Balance"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
}
