"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { renewalSchema, RenewalFormData } from "@/lib/schemas/renewal.schema";
import { ContractType } from "@/types/app.types";
import { calculateEndDate, getToday } from "@/utils/dateUtils";

interface RenewalFormProps {
  onSubmit: (data: RenewalFormData) => void;
  onNotRenew?: () => void;
  isLoading?: boolean;
}

export function RenewalForm({
  onSubmit,
  onNotRenew,
  isLoading = false,
}: RenewalFormProps) {
  const form = useForm<RenewalFormData>({
    resolver: zodResolver(renewalSchema),
    defaultValues: {
      contractType: "monthly",
      startDate: "",
      endDate: "",
    },
  });

  const contractType = useWatch({
    control: form.control,
    name: "contractType",
  });
  const endDate = useWatch({ control: form.control, name: "endDate" });

  const handleContractTypeChange = (value: ContractType) => {
    form.setValue("contractType", value);
    const startDate = form.getValues("startDate");
    if (value !== "custom" && startDate) {
      const calculatedEndDate = calculateEndDate(startDate, value);
      form.setValue("endDate", calculatedEndDate);
    }
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startDate = e.target.value;
    const contractType = form.getValues("contractType");
    if (startDate && contractType !== "custom") {
      const calculatedEndDate = calculateEndDate(startDate, contractType);
      form.setValue("endDate", calculatedEndDate);
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-3 pt-4 border-t"
    >
      <h3 className="text-red-600">Contract Expired - Action Required</h3>

      <div className="space-y-2">
        <Label htmlFor="renewContractType">Contract Type</Label>
        <Select value={contractType} onValueChange={handleContractTypeChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly (1 month)</SelectItem>
            <SelectItem value="yearly">Yearly (1 year)</SelectItem>
            <SelectItem value="custom">Custom Duration</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>New Contract Period</Label>
        <div className="flex items-center gap-2">
          <Input
            id="renewalStartDate"
            type="date"
            min={getToday()}
            className="flex-1"
            aria-invalid={!!form.formState.errors.startDate}
            {...form.register("startDate", {
              onChange: handleStartDateChange,
            })}
          />
          <span className="text-slate-500">-</span>
          <Input
            id="renewalEndDate"
            type="date"
            min={getToday()}
            disabled={contractType !== "custom"}
            className="flex-1"
            aria-invalid={!!form.formState.errors.endDate}
            {...form.register("endDate")}
          />
        </div>
        {form.formState.errors.startDate && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.startDate.message}
          </p>
        )}
        {form.formState.errors.endDate && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.endDate.message}
          </p>
        )}
        {contractType !== "custom" && endDate && (
          <p className="text-sm text-slate-500">
            End date auto-calculated based on {contractType} contract
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? "Renewing..." : "Renew Contract"}
        </Button>
        {onNotRenew && (
          <Button
            type="button"
            onClick={onNotRenew}
            variant="destructive"
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Do Not Renew"}
          </Button>
        )}
      </div>
    </form>
  );
}
