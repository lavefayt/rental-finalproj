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
import {
  newTenantSchema,
  NewTenantFormData,
} from "@/lib/schemas/tenant.schema";
import { ContractType } from "@/types/app.types";
import {
  calculateEndDate,
  getToday,
  getDefaultEndDate,
} from "@/utils/dateUtils";

interface NewTenantFormProps {
  onSubmit: (data: NewTenantFormData) => void;
  isLoading?: boolean;
}

export function NewTenantForm({
  onSubmit,
  isLoading = false,
}: NewTenantFormProps) {
  const form = useForm<NewTenantFormData>({
    resolver: zodResolver(newTenantSchema),
    defaultValues: {
      contractType: "monthly",
      amountPaid: "",
      rentStartDate: getToday(),
      contractEndDate: getDefaultEndDate(),
    },
  });

  const contractType = useWatch({
    control: form.control,
    name: "contractType",
  });
  const contractEndDate = useWatch({
    control: form.control,
    name: "contractEndDate",
  });

  const handleContractTypeChange = (value: ContractType) => {
    form.setValue("contractType", value);
    const startDate = form.getValues("rentStartDate");
    if (startDate && value !== "custom") {
      const calculatedEndDate = calculateEndDate(startDate, value);
      form.setValue("contractEndDate", calculatedEndDate);
    }
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startDate = e.target.value;
    const contractType = form.getValues("contractType");
    if (startDate && contractType !== "custom") {
      const calculatedEndDate = calculateEndDate(startDate, contractType);
      form.setValue("contractEndDate", calculatedEndDate);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="firstName">
            First Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="firstName"
            type="text"
            placeholder="First name"
            aria-invalid={!!form.formState.errors.firstName}
            {...form.register("firstName")}
          />
          {form.formState.errors.firstName && (
            <p className="text-red-500 text-sm">
              {form.formState.errors.firstName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">
            Last Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Last name"
            aria-invalid={!!form.formState.errors.lastName}
            {...form.register("lastName")}
          />
          {form.formState.errors.lastName && (
            <p className="text-red-500 text-sm">
              {form.formState.errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="email@example.com"
          aria-invalid={!!form.formState.errors.email}
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactNumber">
          Contact Number <span className="text-red-500">*</span>
        </Label>
        <Input
          id="contactNumber"
          type="tel"
          placeholder="123-456-7890"
          aria-invalid={!!form.formState.errors.contactNumber}
          {...form.register("contactNumber")}
        />
        {form.formState.errors.contactNumber && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.contactNumber.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contractType">
          Contract Type <span className="text-red-500">*</span>
        </Label>
        <Select value={contractType} onValueChange={handleContractTypeChange}>
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
        <Label>
          Contract Period <span className="text-red-500">*</span>
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="rentStartDate"
            type="date"
            min={getToday()}
            className="flex-1"
            aria-invalid={!!form.formState.errors.rentStartDate}
            {...form.register("rentStartDate", {
              onChange: handleStartDateChange,
            })}
          />
          <span className="text-slate-500">-</span>
          <Input
            id="contractEndDate"
            type="date"
            min={getToday()}
            disabled={contractType !== "custom"}
            className="flex-1"
            aria-invalid={!!form.formState.errors.contractEndDate}
            {...form.register("contractEndDate")}
          />
        </div>
        {form.formState.errors.rentStartDate && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.rentStartDate.message}
          </p>
        )}
        {form.formState.errors.contractEndDate && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.contractEndDate.message}
          </p>
        )}
        {contractType !== "custom" && contractEndDate && (
          <p className="text-sm text-slate-500">
            End date auto-calculated based on {contractType} contract
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="amountPaid">Initial Payment (Optional)</Label>
        <Input
          id="amountPaid"
          type="number"
          min="0"
          step="any"
          placeholder="0"
          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          aria-invalid={!!form.formState.errors.amountPaid}
          onFocus={(e) => e.target.select()}
          {...form.register("amountPaid")}
        />
        {form.formState.errors.amountPaid && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.amountPaid.message}
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
  );
}
