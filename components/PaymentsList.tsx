"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, CreditCard, Banknote, Building2 } from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  notes?: string;
  contract?: {
    id: string;
    monthly_rent: number;
    room?: {
      room_number: string;
    };
    renter?: {
      name: string;
      email: string;
    };
  };
}

interface PaymentsListProps {
  payments: Payment[];
}

export function PaymentsList({ payments }: PaymentsListProps) {
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case "card":
      case "credit_card":
        return <CreditCard className="w-4 h-4" />;
      case "bank":
      case "bank_transfer":
        return <Building2 className="w-4 h-4" />;
      default:
        return <Banknote className="w-4 h-4" />;
    }
  };

  const formatPaymentMethod = (method: string) => {
    return method
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (payments.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <DollarSign className="w-16 h-16 mx-auto text-slate-400 mb-4" />
        <p className="text-slate-600">No payments recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-800">Total Payments</span>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-700">
              ₱{totalPayments.toLocaleString()}
            </p>
            <p className="text-sm text-green-600">
              {payments.length} payment{payments.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  {new Date(payment.payment_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    Room {payment.contract?.room?.room_number || "N/A"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">
                      {payment.contract?.renter?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {payment.contract?.renter?.email || ""}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-green-600">
                    ₱{payment.amount.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getPaymentMethodIcon(payment.payment_method)}
                    <span className="text-sm">
                      {formatPaymentMethod(payment.payment_method)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-500">
                    {payment.notes || "-"}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
