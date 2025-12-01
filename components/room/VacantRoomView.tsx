"use client";

import { DoorOpen } from "lucide-react";
import { NewTenantForm } from "@/components/forms/NewTenantForm";
import { NewTenantFormData } from "@/lib/schemas/tenant.schema";

interface VacantRoomViewProps {
  onOccupy: (data: NewTenantFormData) => void;
  isLoading?: boolean;
}

export function VacantRoomView({
  onOccupy,
  isLoading = false,
}: VacantRoomViewProps) {
  return (
    <div className="py-8 text-center">
      <DoorOpen className="w-16 h-16 mx-auto text-slate-400 mb-4" />
      <p className="text-slate-600 mb-6">This room is currently vacant</p>

      <div className="bg-slate-50 p-6 rounded-lg text-left">
        <h3 className="text-slate-900 mb-4">Enter New Tenant Details</h3>
        <NewTenantForm onSubmit={onOccupy} isLoading={isLoading} />
      </div>
    </div>
  );
}
