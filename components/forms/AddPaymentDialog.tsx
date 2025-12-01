"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, DollarSign, UserX } from "lucide-react";

interface Contract {
  id: string;
  room_id?: string;
  renter_id: string;
  status: string;
  monthly_rent: number;
  total_rent?: number;
  total_paid?: number;
  room?: {
    id: string;
    room_number: string;
  };
  renter?: {
    id: string;
    name: string;
    email?: string;
  };
}

interface AddPaymentDialogProps {
  contracts: Contract[];
  onSubmit: (
    contractId: string,
    amount: number,
    paymentMethod: string,
    notes?: string
  ) => void;
}

export function AddPaymentDialog({
  contracts,
  onSubmit,
}: AddPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedContract = contracts.find((c) => c.id === selectedContractId);

  // Calculate balance for selected contract
  const getBalance = (contract: Contract) => {
    const totalRent = contract.total_rent || contract.monthly_rent;
    const totalPaid = contract.total_paid || 0;
    return Math.max(0, totalRent - totalPaid);
  };

  // Get the max amount allowed for current selection
  const maxAmount = selectedContract ? getBalance(selectedContract) : 0;

  // Handle amount change - cap at max balance
  const handleAmountChange = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      setAmount("");
    } else if (numValue > maxAmount) {
      setAmount(maxAmount.toString());
    } else {
      setAmount(value);
    }
  };

  // Pay full balance
  const handlePayFullBalance = () => {
    if (selectedContract) {
      setAmount(getBalance(selectedContract).toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractId || !amount) return;

    setIsSubmitting(true);
    try {
      await onSubmit(
        selectedContractId,
        parseFloat(amount),
        paymentMethod,
        notes || undefined
      );

      // Reset form and close dialog
      setSelectedContractId("");
      setAmount("");
      setPaymentMethod("cash");
      setNotes("");
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when closing
      setSelectedContractId("");
      setAmount("");
      setPaymentMethod("cash");
      setNotes("");
    }
  };

  // Filter to only show contracts with balance
  const contractsWithBalance = contracts.filter((c) => getBalance(c) > 0);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Record New Payment
          </DialogTitle>
          <DialogDescription>Record a payment for a tenant</DialogDescription>
        </DialogHeader>

        {contractsWithBalance.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <p>No contracts with outstanding balance found.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Tenant/Contract Selection */}
            <div className="space-y-2">
              <Label htmlFor="contract">Select Tenant</Label>
              <Select
                value={selectedContractId}
                onValueChange={setSelectedContractId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a tenant..." />
                </SelectTrigger>
                <SelectContent>
                  {contractsWithBalance.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      <div className="flex items-center gap-2">
                        {contract.status === "evicted" && (
                          <UserX className="w-3 h-3 text-red-500" />
                        )}
                        <span>
                          {contract.renter?.name || "Unknown"}
                          {contract.room?.room_number
                            ? ` - Room ${contract.room.room_number}`
                            : contract.status === "evicted"
                            ? " (Evicted)"
                            : ""}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Contract Info */}
            {selectedContract && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Outstanding Balance:</span>
                  <span className="font-semibold text-red-600">
                    ₱{getBalance(selectedContract).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-slate-600">Total Rent:</span>
                  <span>
                    ₱
                    {(
                      selectedContract.total_rent ||
                      selectedContract.monthly_rent
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Already Paid:</span>
                  <span className="text-green-600">
                    ₱{(selectedContract.total_paid || 0).toLocaleString()}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={handlePayFullBalance}
                >
                  Pay Full Balance (₱
                  {getBalance(selectedContract).toLocaleString()})
                </Button>
              </div>
            )}

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₱)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                max={maxAmount}
                step="0.01"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder={
                  selectedContract
                    ? `Max: ₱${maxAmount.toLocaleString()}`
                    : "Select a tenant first"
                }
                disabled={!selectedContract}
                required
              />
              {selectedContract && parseFloat(amount) > 0 && (
                <p className="text-xs text-slate-500">
                  Remaining after payment: ₱
                  {(maxAmount - parseFloat(amount || "0")).toLocaleString()}
                </p>
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="gcash">GCash</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add payment notes..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedContractId || !amount || isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Record Payment"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
