"use client";

import { useState } from "react";
import { RoomCard } from "@/components/room/RoomCard";
import { RoomTable } from "@/components/room/RoomTable";
import { AddRoomDialog } from "@/components/room/AddRoomDialog";
import { TenantsList } from "@/components/tenants/TenantsList";
import { PaymentsList } from "@/components/PaymentsList";
import { DueList } from "@/components/DueList";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Table } from "lucide-react";
import { useRooms } from "@/hooks/useRooms";
import { useRenters } from "@/hooks/useRenters";
import { useContracts } from "@/hooks/useContracts";
import { usePayments } from "@/hooks/usePayments";
import { RoomWithCurrentContract } from "@/types/room.types";
import { Room } from "@/types/app.types";

// Helper function to transform API data to local Room interface
function transformRoomData(apiRoom: RoomWithCurrentContract): Room {
  return {
    id: apiRoom.id,
    roomNumber: apiRoom.room_number,
    price: apiRoom.base_price,
    status: apiRoom.status as "occupied" | "vacant",
    renter: apiRoom.current_contract
      ? {
          firstName:
            apiRoom.current_contract.renter?.name?.split(" ")[0] || "Unknown",
          lastName:
            apiRoom.current_contract.renter?.name
              ?.split(" ")
              .slice(1)
              .join(" ") || "",
          email: apiRoom.current_contract.renter?.email || "",
          contactNumber: apiRoom.current_contract.renter?.phone || "",
          rentStartDate: apiRoom.current_contract.start_date,
          contractEndDate: apiRoom.current_contract.end_date,
          amountPaid: apiRoom.current_contract.total_paid || 0,
          contractType: "monthly",
        }
      : undefined,
  };
}

export default function App() {
  const {
    rooms: apiRooms,
    loading,
    error,
    fetchRooms,
    createRoom,
    deleteRoom,
  } = useRooms({
    includeContract: true,
    autoFetch: true,
  });

  const { createRenter, updateRenter: updateRenterAPI } = useRenters({
    autoFetch: false,
  });
  const { contracts: dueContracts, fetchContracts: fetchDueContracts } =
    useContracts({
      status: "active",
      paymentStatus: "unpaid",
      autoFetch: true,
    });
  const { createContract, updateContract } = useContracts({ autoFetch: false });
  const { payments, fetchPayments, createPayment } = usePayments({
    autoFetch: true,
  });

  // Transform API rooms to local Room interface
  const rooms: Room[] = apiRooms.map(transformRoomData);

  const [selectedView, setSelectedView] = useState("all-rooms");
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const addRoom = async (newRoom: { roomNumber: string; price: number }) => {
    await createRoom({
      room_number: newRoom.roomNumber,
      base_price: newRoom.price,
      status: "vacant",
    });
  };

  const updateRoomPayment = async (roomId: string, paymentAmount: number) => {
    try {
      const room = apiRooms.find((r) => r.id === roomId);
      if (!room?.current_contract) {
        console.error("No active contract found");
        return;
      }

      // paymentAmount should be the incremental amount to add, not the total
      await createPayment({
        contract_id: room.current_contract.id,
        amount: paymentAmount,
        payment_date: new Date().toISOString().split("T")[0],
        payment_method: "cash",
      });

      // Refresh all data
      fetchRooms();
      fetchPayments();
      fetchDueContracts();
    } catch (err) {
      console.error("Error updating payment:", err);
    }
  };

  const renewContract = async (roomId: string, newEndDate: string) => {
    try {
      const room = apiRooms.find((r) => r.id === roomId);
      if (!room?.current_contract) {
        console.error("No active contract found");
        return;
      }

      await updateContract(room.current_contract.id, {
        end_date: newEndDate,
      });

      fetchRooms();
    } catch (err) {
      console.error("Error renewing contract:", err);
    }
  };

  const vacateRoom = async (roomId: string) => {
    try {
      const room = apiRooms.find((r) => r.id === roomId);
      if (!room?.current_contract) {
        console.error("No active contract found");
        return;
      }

      await updateContract(room.current_contract.id, {
        status: "terminated",
      });

      fetchRooms();
    } catch (err) {
      console.error("Error vacating room:", err);
    }
  };

  const occupyRoom = async (
    roomId: string,
    renterDetails: {
      firstName: string;
      lastName: string;
      email: string;
      contactNumber: string;
      rentStartDate: string;
      contractEndDate: string;
      amountPaid: number;
      contractType?: "monthly" | "yearly" | "custom";
    }
  ) => {
    try {
      const renter = await createRenter({
        name: `${renterDetails.firstName} ${renterDetails.lastName}`,
        phone: renterDetails.contactNumber,
        email: renterDetails.email,
      });

      const room = apiRooms.find((r) => r.id === roomId);
      if (!room) return;

      const contract = await createContract({
        room_id: roomId,
        renter_id: renter.id,
        start_date: renterDetails.rentStartDate,
        end_date: renterDetails.contractEndDate,
        monthly_rent: room.base_price,
        status: "active",
      });

      if (renterDetails.amountPaid > 0) {
        await createPayment({
          contract_id: contract.id,
          amount: renterDetails.amountPaid,
          payment_date: renterDetails.rentStartDate,
          payment_method: "cash",
        });
      }

      fetchRooms();
    } catch (err) {
      console.error("Error occupying room:", err);
    }
  };

  const updateRenter = async (
    roomId: string,
    renterDetails: {
      firstName: string;
      lastName: string;
      email: string;
      contactNumber: string;
    }
  ) => {
    try {
      const room = apiRooms.find((r) => r.id === roomId);
      if (!room?.current_contract?.renter?.id) {
        console.error("No renter found for this room");
        return;
      }

      await updateRenterAPI(room.current_contract.renter.id, {
        name: `${renterDetails.firstName} ${renterDetails.lastName}`,
        phone: renterDetails.contactNumber,
        email: renterDetails.email,
      });

      fetchRooms();
    } catch (err) {
      console.error("Error updating renter:", err);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await deleteRoom(roomId);
      fetchRooms();
    } catch (err) {
      console.error("Error deleting room:", err);
    }
  };

  // Filter functions
  const getFilteredRooms = () => {
    switch (selectedView) {
      case "all-rooms":
        return rooms;
      case "vacant":
        return rooms.filter((room) => room.status === "vacant");
      case "occupied":
        return rooms.filter((room) => room.status === "occupied");
      default:
        return rooms;
    }
  };

  const getFilteredTenants = () => {
    const occupiedRooms = rooms.filter((room) => room.status === "occupied");

    switch (selectedView) {
      case "all-tenants":
        return occupiedRooms;
      case "fully-paid":
        return occupiedRooms.filter(
          (room) => room.renter && room.renter.amountPaid >= room.price
        );
      case "not-fully-paid":
        return occupiedRooms.filter(
          (room) => room.renter && room.renter.amountPaid < room.price
        );
      default:
        return occupiedRooms;
    }
  };

  // Determine if current view is tenant-based or room-based
  const isTenantView = ["all-tenants", "fully-paid", "not-fully-paid"].includes(
    selectedView
  );
  const isRoomView = ["all-rooms", "vacant", "occupied"].includes(selectedView);
  const isPaymentsView = selectedView === "payments";
  const isDueView = selectedView === "due";

  // Get title based on selected view
  const getViewTitle = () => {
    const titles: Record<string, string> = {
      "all-tenants": "All Tenants",
      "fully-paid": "Fully Paid Tenants",
      "not-fully-paid": "Not Fully Paid Tenants",
      "all-rooms": "All Rooms",
      vacant: "Vacant Rooms",
      occupied: "Occupied Rooms",
      payments: "Payment History",
      due: "Due Payments",
    };
    return titles[selectedView] || "Property Management";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar
          selectedView={selectedView}
          onViewChange={setSelectedView}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          paymentsCount={payments.length}
          dueCount={dueContracts.length}
        />
        <main className="flex-1 p-8 md:ml-0 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading rooms...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar
          selectedView={selectedView}
          onViewChange={setSelectedView}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          paymentsCount={payments.length}
          dueCount={dueContracts.length}
        />
        <main className="flex-1 p-8 md:ml-0 flex items-center justify-center">
          <div className="text-center text-red-600">
            <p className="text-xl mb-2">Error loading rooms</p>
            <p className="text-sm">{error}</p>
            <Button onClick={() => fetchRooms()} className="mt-4">
              Try Again
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        selectedView={selectedView}
        onViewChange={setSelectedView}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        paymentsCount={payments.length}
        dueCount={dueContracts.length}
      />

      <main className="flex-1 p-8 md:ml-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8 mt-12 md:mt-0">
            <div>
              <h2 className="text-slate-900 text-2xl">{getViewTitle()}</h2>
            </div>
            <AddRoomDialog onAddRoom={addRoom} existingRooms={rooms} />
          </div>

          {/* Tenant Views */}
          {isTenantView && (
            <div className="space-y-4">
              <TenantsList
                rooms={getFilteredTenants()}
                onUpdateRenter={updateRenter}
                onVacateRoom={vacateRoom}
              />
            </div>
          )}

          {/* Room Views */}
          {isRoomView && (
            <div className="space-y-4">
              <div className="flex justify-end gap-2">
                <Button
                  variant={viewMode === "card" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("card")}
                >
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Card View
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                >
                  <Table className="w-4 h-4 mr-2" />
                  Table View
                </Button>
              </div>

              {getFilteredRooms().length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <div className="w-16 h-16 mx-auto mb-4 text-slate-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                      />
                    </svg>
                  </div>
                  <p className="text-slate-600">No rooms found</p>
                </div>
              ) : viewMode === "card" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getFilteredRooms().map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      onUpdatePayment={updateRoomPayment}
                      onRenewContract={renewContract}
                      onVacateRoom={vacateRoom}
                      onOccupyRoom={occupyRoom}
                      onUpdateRenter={updateRenter}
                      onDeleteRoom={handleDeleteRoom}
                    />
                  ))}
                </div>
              ) : (
                <RoomTable
                  rooms={getFilteredRooms()}
                  onUpdatePayment={updateRoomPayment}
                  onRenewContract={renewContract}
                  onVacateRoom={vacateRoom}
                  onOccupyRoom={occupyRoom}
                  onUpdateRenter={updateRenter}
                  onDeleteRoom={handleDeleteRoom}
                />
              )}
            </div>
          )}

          {/* Payments View */}
          {isPaymentsView && (
            <div className="space-y-4">
              <PaymentsList
                payments={
                  payments as unknown as Parameters<
                    typeof PaymentsList
                  >[0]["payments"]
                }
              />
            </div>
          )}

          {/* Due View */}
          {isDueView && (
            <div className="space-y-4">
              <DueList
                contracts={
                  dueContracts as unknown as Parameters<
                    typeof DueList
                  >[0]["contracts"]
                }
                onRecordPayment={updateRoomPayment}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
