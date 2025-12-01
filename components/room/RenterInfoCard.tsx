"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Edit } from "lucide-react";
import { Renter } from "@/types/app.types";
import { isContractExpired, formatDate } from "@/utils/dateUtils";

interface RenterInfoCardProps {
  renter: Renter;
  onEdit?: () => void;
}

export function RenterInfoCard({ renter, onEdit }: RenterInfoCardProps) {
  const expired = isContractExpired(renter.contractEndDate);

  return (
    <div className="bg-blue-50 p-4 rounded-lg space-y-3 border border-blue-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-slate-900 flex items-center gap-2">
          <User className="w-5 h-5" />
          Renter Information
        </h3>
        {onEdit && (
          <Button onClick={onEdit} variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
        )}
      </div>
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-slate-500">First Name:</span>
            <p className="text-slate-900">{renter.firstName}</p>
          </div>
          <div>
            <span className="text-slate-500">Last Name:</span>
            <p className="text-slate-900">{renter.lastName}</p>
          </div>
        </div>
        <div>
          <span className="text-slate-500">Email:</span>
          <p className="text-slate-900">{renter.email}</p>
        </div>
        <div>
          <span className="text-slate-500">Contact Number:</span>
          <p className="text-slate-900">{renter.contactNumber}</p>
        </div>
        <div>
          <span className="text-slate-500">Contract Period:</span>
          <p className={expired ? "text-red-600" : "text-slate-900"}>
            {formatDate(renter.rentStartDate)} -{" "}
            {formatDate(renter.contractEndDate)}
            {expired && (
              <Badge variant="destructive" className="ml-2 text-xs">
                Expired
              </Badge>
            )}
          </p>
        </div>
        {renter.contractType && (
          <div>
            <span className="text-slate-500">Contract Type:</span>
            <p className="text-slate-900 capitalize">{renter.contractType}</p>
          </div>
        )}
      </div>
    </div>
  );
}
