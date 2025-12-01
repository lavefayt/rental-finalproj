"use client";

import { Badge } from "@/components/ui/badge";
import { DollarSign } from "lucide-react";
import { Room } from "@/types/app.types";
import {
  isPastDue,
  calculateBalance,
  calculateLateFee,
  calculateTotalDue,
} from "@/utils/paymentUtils";
import { isContractExpired } from "@/utils/dateUtils";

interface PaymentStatusCardProps {
  room: Room;
}

export function PaymentStatusCard({ room }: PaymentStatusCardProps) {
  if (!room.renter) return null;

  const pastDue = isPastDue(room);
  const expired = isContractExpired(room.renter.contractEndDate);
  const balance = calculateBalance(room);
  const lateFee = calculateLateFee(room);
  const totalDue = calculateTotalDue(room);

  const cardClassName = `p-4 rounded-lg border ${
    pastDue
      ? expired
        ? "bg-red-50 border-red-200"
        : "bg-orange-50 border-orange-200"
      : "bg-green-50 border-green-200"
  }`;

  return (
    <div className={cardClassName}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-slate-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Payment Status
        </h3>
        {pastDue ? (
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
          <span className="text-slate-900">₱{room.price.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Balance:</span>
          <span className={pastDue ? "text-red-600" : "text-green-600"}>
            ₱{balance.toLocaleString()}
          </span>
        </div>
        {expired && pastDue && lateFee > 0 && (
          <>
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="text-red-600">Late Fee (10%):</span>
              <span className="text-red-600">₱{lateFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-600">Total Due:</span>
              <span className="text-red-600">₱{totalDue.toLocaleString()}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
