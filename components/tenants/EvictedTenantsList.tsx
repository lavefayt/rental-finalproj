"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  DollarSign,
  Mail,
  Phone,
  MoreHorizontal,
  Eye,
  Calendar,
  Home,
  UserX,
  AlertTriangle,
} from "lucide-react";
import { truncateName } from "@/utils/textUtils";

interface EvictedTenantContract {
  id: string;
  room_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  total_rent?: number;
  status: string;
  created_at: string;
  updated_at: string;
  room?: {
    id: string;
    room_number: string;
    base_price: number;
  };
  renter?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  total_paid?: number;
  balance?: number;
}

interface EvictedTenantsListProps {
  contracts: EvictedTenantContract[] | Record<string, unknown>[];
  onRecordPayment?: (contractId: string, amount: number, paymentMethod?: string, notes?: string) => void;
}

export function EvictedTenantsList({
  contracts,
  onRecordPayment,
}: EvictedTenantsListProps) {
  const [selectedContract, setSelectedContract] =
    useState<EvictedTenantContract | null>(null);
  const [paymentDialogContract, setPaymentDialogContract] =
    useState<EvictedTenantContract | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cast contracts to proper type
  const typedContracts = contracts as EvictedTenantContract[];

  // Calculate total outstanding balance
  const totalOutstanding = typedContracts.reduce((sum, contract) => {
    const totalRent = contract.total_rent || contract.monthly_rent;
    const totalPaid = contract.total_paid || 0;
    return sum + Math.max(0, totalRent - totalPaid);
  }, 0);

  if (typedContracts.length === 0) {
    return (
      <div className="text-center py-12">
        <UserX className="w-16 h-16 mx-auto text-slate-400 mb-4" />
        <p className="text-slate-600">No evicted tenants</p>
        <p className="text-slate-500 text-sm mt-2">
          Evicted tenants with outstanding balances will appear here
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRenterName = (contract: EvictedTenantContract) => {
    return contract.renter?.name || "Unknown";
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentDialogContract || !paymentAmount || !onRecordPayment) return;

    // Cap the amount at the balance
    const balance = getContractBalance(paymentDialogContract);
    const finalAmount = Math.min(parseFloat(paymentAmount), balance);

    setIsSubmitting(true);
    try {
      await onRecordPayment(
        paymentDialogContract.id, 
        finalAmount, 
        paymentMethod,
        paymentNotes || undefined
      );
      setPaymentDialogContract(null);
      setPaymentAmount("");
      setPaymentMethod("cash");
      setPaymentNotes("");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle payment amount change - cap at balance
  const handlePaymentAmountChange = (value: string) => {
    if (!paymentDialogContract) return;
    const balance = getContractBalance(paymentDialogContract);
    const numValue = parseFloat(value);
    
    if (isNaN(numValue) || numValue < 0) {
      setPaymentAmount("");
    } else if (numValue > balance) {
      setPaymentAmount(balance.toString());
    } else {
      setPaymentAmount(value);
    }
  };

  // Pay full balance for evicted tenant
  const handlePayFullBalance = () => {
    if (paymentDialogContract) {
      setPaymentAmount(getContractBalance(paymentDialogContract).toString());
    }
  };

  const getContractBalance = (contract: EvictedTenantContract) => {
    const totalRent = contract.total_rent || contract.monthly_rent;
    const totalPaid = contract.total_paid || 0;
    return Math.max(0, totalRent - totalPaid);
  };

  return (
    <>
      {/* Summary Header */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="font-medium text-red-800">
              Outstanding Balance from Evicted Tenants
            </span>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-red-700">
              ₱{totalOutstanding.toLocaleString()}
            </p>
            <p className="text-sm text-red-600">
              {typedContracts.length} evicted tenant
              {typedContracts.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Room #</TableHead>
              <TableHead>Tenant Name</TableHead>
              <TableHead>Contract Period</TableHead>
              <TableHead>Total Rent</TableHead>
              <TableHead>Amount Paid</TableHead>
              <TableHead>Outstanding Balance</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {typedContracts.map((contract) => {
              const renterName = getRenterName(contract);
              const totalRent = contract.total_rent || contract.monthly_rent;
              const totalPaid = contract.total_paid || 0;
              const balance = Math.max(0, totalRent - totalPaid);

              return (
                <TableRow key={contract.id} className="bg-red-50/50">
                  <TableCell>{contract.room?.room_number || "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserX className="w-4 h-4 text-red-500" />
                      {truncateName(renterName)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{formatDate(contract.start_date)}</div>
                      <div className="text-slate-500">
                        to {formatDate(contract.end_date)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>₱{totalRent.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className="text-green-600">
                      ₱{totalPaid.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    {balance > 0 ? (
                      <Badge variant="destructive">
                        ₱{balance.toLocaleString()}
                      </Badge>
                    ) : (
                      <Badge className="bg-green-600">Paid</Badge>
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
                        <DropdownMenuItem
                          onClick={() => setSelectedContract(contract)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {balance > 0 && onRecordPayment && (
                          <DropdownMenuItem
                            onClick={() => setPaymentDialogContract(contract)}
                          >
                            <DollarSign className="mr-2 h-4 w-4" />
                            Record Payment
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {selectedContract && (
        <Dialog
          open={!!selectedContract}
          onOpenChange={() => setSelectedContract(null)}
        >
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-700">
                <UserX className="w-6 h-6" />
                Evicted Tenant Details
              </DialogTitle>
              <DialogDescription>
                Evicted on {formatDate(selectedContract.updated_at)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* Personal Information */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="text-slate-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Personal Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-slate-500">Name:</span>
                    <p className="text-slate-900">
                      {getRenterName(selectedContract)}
                    </p>
                  </div>
                  {selectedContract.renter?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-500" />
                      <div>
                        <span className="text-slate-500">Email:</span>
                        <p className="text-slate-900 break-all">
                          {selectedContract.renter.email}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedContract.renter?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-500" />
                      <div>
                        <span className="text-slate-500">Contact:</span>
                        <p className="text-slate-900">
                          {selectedContract.renter.phone}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Room & Contract Information */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-slate-900 mb-3 flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Room & Contract Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-500">Room Number:</span>
                      <p className="text-slate-900">
                        {selectedContract.room?.room_number || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Monthly Rent:</span>
                      <p className="text-slate-900">
                        ₱{selectedContract.monthly_rent.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <div>
                      <span className="text-slate-500">Contract Period:</span>
                      <p className="text-slate-900">
                        {formatDate(selectedContract.start_date)} -{" "}
                        {formatDate(selectedContract.end_date)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="p-4 rounded-lg border bg-red-50 border-red-200">
                <h3 className="text-slate-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Payment Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Rent:</span>
                    <span className="text-slate-900">
                      ₱
                      {(
                        selectedContract.total_rent ||
                        selectedContract.monthly_rent
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Amount Paid:</span>
                    <span className="text-green-600">
                      ₱{(selectedContract.total_paid || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-red-700 font-medium">
                      Outstanding Balance:
                    </span>
                    <span className="text-red-700 font-bold">
                      ₱
                      {Math.max(
                        0,
                        (selectedContract.total_rent ||
                          selectedContract.monthly_rent) -
                          (selectedContract.total_paid || 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Eviction Status */}
              <div className="bg-red-100 p-4 rounded-lg border border-red-300">
                <div className="flex items-center justify-between">
                  <span className="text-red-700">Status:</span>
                  <Badge variant="destructive">Evicted</Badge>
                </div>
                <p className="text-xs text-red-600 mt-2">
                  This tenant was evicted. Outstanding balance remains on
                  record.
                </p>
              </div>

              {/* Record Payment Button */}
              {getContractBalance(selectedContract) > 0 && onRecordPayment && (
                <Button
                  className="w-full"
                  onClick={() => {
                    setSelectedContract(null);
                    setPaymentDialogContract(selectedContract);
                  }}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Payment Dialog */}
      {paymentDialogContract && (
        <Dialog
          open={!!paymentDialogContract}
          onOpenChange={() => {
            setPaymentDialogContract(null);
            setPaymentAmount("");
            setPaymentMethod("cash");
            setPaymentNotes("");
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Record Payment
              </DialogTitle>
              <DialogDescription>
                Record payment for {getRenterName(paymentDialogContract)} (Evicted)
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 mt-4">
              {/* Balance Info */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Outstanding Balance:</span>
                  <span className="font-semibold text-red-600">
                    ₱{getContractBalance(paymentDialogContract).toLocaleString()}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={handlePayFullBalance}
                >
                  Pay Full Balance (₱{getContractBalance(paymentDialogContract).toLocaleString()})
                </Button>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="payment-amount">Amount (₱)</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  min="0"
                  max={getContractBalance(paymentDialogContract)}
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => handlePaymentAmountChange(e.target.value)}
                  placeholder={`Max: ₱${getContractBalance(paymentDialogContract).toLocaleString()}`}
                  required
                />
                {parseFloat(paymentAmount) > 0 && (
                  <p className="text-xs text-slate-500">
                    Remaining after payment: ₱{(getContractBalance(paymentDialogContract) - parseFloat(paymentAmount || "0")).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method</Label>
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
                <Label htmlFor="payment-notes">Notes (Optional)</Label>
                <Input
                  id="payment-notes"
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Add payment notes..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPaymentDialogContract(null);
                    setPaymentAmount("");
                    setPaymentMethod("cash");
                    setPaymentNotes("");
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!paymentAmount || isSubmitting}>
                  {isSubmitting ? "Processing..." : "Record Payment"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
