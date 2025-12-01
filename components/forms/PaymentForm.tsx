"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign } from "lucide-react";
import { paymentSchema, PaymentFormData } from "@/lib/schemas/payment.schema";

interface PaymentFormProps {
  onSubmit: (data: PaymentFormData) => void;
  onMarkFullyPaid?: () => void;
  isLoading?: boolean;
  showMarkFullyPaid?: boolean;
  maxAmount?: number; // Maximum allowed payment (balance remaining)
}

export function PaymentForm({
  onSubmit,
  onMarkFullyPaid,
  isLoading = false,
  showMarkFullyPaid = true,
  maxAmount,
}: PaymentFormProps) {
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: "",
    },
  });

  const handleSubmit = (data: PaymentFormData) => {
    const amount = parseFloat(data.amount);
    if (maxAmount !== undefined && amount > maxAmount) {
      form.setError("amount", {
        type: "manual",
        message: `Payment cannot exceed balance of ₱${maxAmount.toLocaleString()}`,
      });
      return;
    }
    onSubmit(data);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="payment">Add Payment <span className="text-red-500">*</span></Label>
          <Input
            id="payment"
            type="number"
            min="0"
            max={maxAmount}
            step="any"
            placeholder="Enter amount"
            className="mt-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            aria-invalid={!!form.formState.errors.amount}
            onFocus={(e) => e.target.select()}
            {...form.register("amount")}
          />
          {form.formState.errors.amount && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.amount.message}
            </p>
          )}
          {maxAmount !== undefined && (
            <p className="text-slate-500 text-xs mt-1">
              Max: ₱{maxAmount.toLocaleString()}
            </p>
          )}
        </div>
        <Button type="submit" className="mt-6" disabled={isLoading}>
          {isLoading ? "Adding..." : "Add"}
        </Button>
      </div>
      {showMarkFullyPaid && onMarkFullyPaid && (
        <Button
          type="button"
          onClick={onMarkFullyPaid}
          className="w-full"
          variant="default"
          disabled={isLoading}
        >
          <DollarSign className="w-4 h-4 mr-1" />
          {isLoading ? "Processing..." : "Mark as Fully Paid"}
        </Button>
      )}
    </form>
  );
}

// Standalone payment input form (used in DueList dialog)
interface StandalonePaymentFormProps {
  onSubmit: (data: PaymentFormData) => void;
  onMarkFullyPaid?: () => void;
  isLoading?: boolean;
  maxAmount?: number; // Maximum allowed payment (balance remaining)
}

export function StandalonePaymentForm({
  onSubmit,
  onMarkFullyPaid,
  isLoading = false,
  maxAmount,
}: StandalonePaymentFormProps) {
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: "",
    },
  });

  const handleSubmit = (data: PaymentFormData) => {
    const amount = parseFloat(data.amount);
    if (maxAmount !== undefined && amount > maxAmount) {
      form.setError("amount", {
        type: "manual",
        message: `Payment cannot exceed balance of ₱${maxAmount.toLocaleString()}`,
      });
      return;
    }
    onSubmit(data);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="paymentAmount">Payment Amount <span className="text-red-500">*</span></Label>
        <Input
          id="paymentAmount"
          type="number"
          min="0"
          max={maxAmount}
          step="any"
          placeholder="Enter amount"
          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          onFocus={(e) => e.target.select()}
          aria-invalid={!!form.formState.errors.amount}
          {...form.register("amount")}
        />
        {form.formState.errors.amount && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.amount.message}
          </p>
        )}
        {maxAmount !== undefined && (
          <p className="text-slate-500 text-xs">
            Max: ₱{maxAmount.toLocaleString()}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={isLoading}>
          <DollarSign className="w-4 h-4 mr-1" />
          {isLoading ? "Processing..." : "Add Payment"}
        </Button>
        {onMarkFullyPaid && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onMarkFullyPaid}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Pay Full Balance"}
          </Button>
        )}
      </div>
    </form>
  );
}
