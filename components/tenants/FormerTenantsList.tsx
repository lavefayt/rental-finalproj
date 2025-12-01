"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  User,
  DollarSign,
  Mail,
  Phone,
  MoreHorizontal,
  Eye,
  Calendar,
  Home,
} from "lucide-react";
import { truncateName } from "@/utils/textUtils";

interface FormerTenantContract {
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

interface FormerTenantsListProps {
  contracts: FormerTenantContract[] | Record<string, unknown>[];
}

export function FormerTenantsList({ contracts }: FormerTenantsListProps) {
  const [selectedContract, setSelectedContract] =
    useState<FormerTenantContract | null>(null);

  // Cast contracts to proper type
  const typedContracts = contracts as FormerTenantContract[];

  if (typedContracts.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 mx-auto text-slate-400 mb-4" />
        <p className="text-slate-600">No former tenants found</p>
        <p className="text-slate-500 text-sm mt-2">
          When tenants move out, they will appear here
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRenterName = (contract: FormerTenantContract) => {
    return contract.renter?.name || "Unknown";
  };

  const getContractDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;

    if (months > 0 && days > 0) {
      return `${months} month${months > 1 ? "s" : ""}, ${days} day${
        days > 1 ? "s" : ""
      }`;
    } else if (months > 0) {
      return `${months} month${months > 1 ? "s" : ""}`;
    } else {
      return `${days} day${days > 1 ? "s" : ""}`;
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Room #</TableHead>
              <TableHead>Tenant Name</TableHead>
              <TableHead>Contract Period</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Total Rent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {typedContracts.map((contract) => {
              const renterName = getRenterName(contract);
              const totalRent = contract.total_rent || contract.monthly_rent;
              const totalPaid = contract.total_paid || 0;

              return (
                <TableRow key={contract.id}>
                  <TableCell>{contract.room?.room_number || "N/A"}</TableCell>
                  <TableCell>{truncateName(renterName)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{formatDate(contract.start_date)}</div>
                      <div className="text-slate-500">
                        to {formatDate(contract.end_date)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getContractDuration(
                      contract.start_date,
                      contract.end_date
                    )}
                  </TableCell>
                  <TableCell>₱{totalRent.toLocaleString()}</TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">
                        ₱{totalPaid.toLocaleString()} / ₱
                        {totalRent.toLocaleString()}
                      </div>
                      {totalPaid >= totalRent ? (
                        <Badge className="bg-green-600 mt-1">Fully Paid</Badge>
                      ) : (
                        <Badge variant="destructive" className="mt-1">
                          Balance: ₱{(totalRent - totalPaid).toLocaleString()}
                        </Badge>
                      )}
                    </div>
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
              <DialogTitle className="flex items-center gap-2">
                <User className="w-6 h-6" />
                Former Tenant Details
              </DialogTitle>
              <DialogDescription>
                Contract completed on {formatDate(selectedContract.end_date)}
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
                  <div>
                    <span className="text-slate-500">Duration:</span>
                    <p className="text-slate-900">
                      {getContractDuration(
                        selectedContract.start_date,
                        selectedContract.end_date
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div
                className={`p-4 rounded-lg border ${
                  (selectedContract.total_paid || 0) >=
                  (selectedContract.total_rent || selectedContract.monthly_rent)
                    ? "bg-green-50 border-green-200"
                    : "bg-orange-50 border-orange-200"
                }`}
              >
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
                    <span className="text-slate-900">
                      ₱{(selectedContract.total_paid || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-slate-600">Balance:</span>
                    <span
                      className={
                        (selectedContract.total_paid || 0) >=
                        (selectedContract.total_rent ||
                          selectedContract.monthly_rent)
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
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

              {/* Contract Status */}
              <div className="bg-slate-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Contract Status:</span>
                  <Badge className="bg-slate-600">Completed</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  This tenant has completed their rental contract
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
