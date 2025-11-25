"use client"

import { useState } from 'react';
import { RoomCard } from '@/components/room/RoomCard';
import { RoomTable } from '@/components/room/RoomTable';
import { AddRoomDialog } from '@/components/room/AddRoomDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Building2, LayoutGrid, Table } from 'lucide-react';

export interface Room {
  id: string;
  roomNumber: string;
  price: number;
  status: 'occupied' | 'vacant';
  renter?: {
    name: string;
    rentStartDate: string;
    contractEndDate: string;
    amountPaid: number;
  };
}

export default function App() {
  const [rooms, setRooms] = useState<Room[]>([
    // {
    //   id: '1',
    //   roomNumber: '101',
    //   price: 2500,
    //   status: 'occupied',
    //   renter: {
    //     name: 'John Smith',
    //     rentStartDate: '2024-01-15',
    //     contractEndDate: '2025-01-15',
    //     amountPaid: 2500,
    //   },
    // },
    // {
    //   id: '2',
    //   roomNumber: '102',
    //   price: 2500,
    //   status: 'occupied',
    //   renter: {
    //     name: 'Sarah Johnson',
    //     rentStartDate: '2024-03-01',
    //     contractEndDate: '2025-03-01',
    //     amountPaid: 1500,
    //   },
    // },
    // {
    //   id: '3',
    //   roomNumber: '103',
    //   price: 3000,
    //   status: 'occupied',
    //   renter: {
    //     name: 'Michael Brown',
    //     rentStartDate: '2023-11-01',
    //     contractEndDate: '2024-11-01',
    //     amountPaid: 3000,
    //   },
    // },
    // {
    //   id: '4',
    //   roomNumber: '104',
    //   price: 2500,
    //   status: 'vacant',
    // },
    // {
    //   id: '5',
    //   roomNumber: '105',
    //   price: 2800,
    //   status: 'vacant',
    // },
    // {
    //   id: '6',
    //   roomNumber: '106',
    //   price: 2500,
    //   status: 'occupied',
    //   renter: {
    //     name: 'Emily Davis',
    //     rentStartDate: '2024-09-01',
    //     contractEndDate: '2025-09-01',
    //     amountPaid: 2500,
    //   },
    // },
  ]);

  const [allRoomsView, setAllRoomsView] = useState<'card' | 'table'>('card');
  const [occupiedView, setOccupiedView] = useState<'card' | 'table'>('card');
  const [vacantView, setVacantView] = useState<'card' | 'table'>('card');
  const [paidView, setPaidView] = useState<'card' | 'table'>('card');
  const [unpaidView, setUnpaidView] = useState<'card' | 'table'>('card');

  // --- ROOM MANAGEMENT FUNCTIONS ---

  const addRoom = (newRoom: { roomNumber: string; price: number }) => {
    const room: Room = {
      id: Date.now().toString(),
      roomNumber: newRoom.roomNumber,
      price: newRoom.price,
      status: 'vacant',
    };
    setRooms([...rooms, room]);
  };

  const updateRoomPayment = (roomId: string, amountPaid: number) => {
    setRooms(rooms.map(room => 
      room.id === roomId && room.renter
        ? { ...room, renter: { ...room.renter, amountPaid } }
        : room
    ));
  };

  const renewContract = (roomId: string, newEndDate: string) => {
    setRooms(rooms.map(room => 
      room.id === roomId && room.renter
        ? { ...room, renter: { ...room.renter, contractEndDate: newEndDate } }
        : room
    ));
  };

  const vacateRoom = (roomId: string) => {
    setRooms(rooms.map(room => 
      room.id === roomId
        ? { ...room, status: 'vacant' as const, renter: undefined }
        : room
    ));
  };

  const occupyRoom = (roomId: string, renterDetails: {
    name: string;
    rentStartDate: string;
    contractEndDate: string;
    amountPaid: number;
  }) => {
    setRooms(rooms.map(room => 
      room.id === roomId
        ? { ...room, status: 'occupied' as const, renter: renterDetails }
        : room
    ));
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Building2 className="w-10 h-10 text-slate-700" />
            <h1 className="text-slate-900">Property Management System</h1>
          </div>
          <AddRoomDialog onAddRoom={addRoom} />
        </div>

        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All Rooms</TabsTrigger>
            <TabsTrigger value="occupied">Occupied</TabsTrigger>
            <TabsTrigger value="vacant">Vacant</TabsTrigger>
            <TabsTrigger value="paid">Fully Paid</TabsTrigger>
            <TabsTrigger value="unpaid">Not Fully Paid</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button
                variant={allRoomsView === 'card' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAllRoomsView('card')}
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Card View
              </Button>
              <Button
                variant={allRoomsView === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAllRoomsView('table')}
              >
                <Table className="w-4 h-4 mr-2" />
                Table View
              </Button>
            </div>
            
            {rooms.length === 0 ? (
                <div className="text-center p-10 border border-dashed rounded-lg bg-white text-gray-500">
                    No rooms have been added yet. Use the Add Room button to get started!
                </div>
            ) : allRoomsView === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map(room => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onUpdatePayment={updateRoomPayment}
                    onRenewContract={renewContract}
                    onVacateRoom={vacateRoom}
                    onOccupyRoom={occupyRoom}
                  />
                ))}
              </div>
            ) : (
              <RoomTable
                rooms={rooms}
                onUpdatePayment={updateRoomPayment}
                onRenewContract={renewContract}
                onVacateRoom={vacateRoom}
                onOccupyRoom={occupyRoom}
              />
            )}
          </TabsContent>

{/* occupied tab */}
          <TabsContent value="occupied" className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button
                variant={occupiedView === 'card' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOccupiedView('card')}
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Card View
              </Button>
              <Button
                variant={occupiedView === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOccupiedView('table')}
              >
                <Table className="w-4 h-4 mr-2" />
                Table View
              </Button>
            </div>
            
            {rooms.filter(room => room.status === 'occupied').length === 0 ? (
                <div className="text-center p-10 border border-dashed rounded-lg bg-white text-gray-500">
                    No rooms are currently occupied.
                </div>
            ) : occupiedView === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.filter(room => room.status === 'occupied').map(room => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onUpdatePayment={updateRoomPayment}
                    onRenewContract={renewContract}
                    onVacateRoom={vacateRoom}
                    onOccupyRoom={occupyRoom}
                  />
                ))}
              </div>
            ) : (
              <RoomTable
                rooms={rooms.filter(room => room.status === 'occupied')}
                onUpdatePayment={updateRoomPayment}
                onRenewContract={renewContract}
                onVacateRoom={vacateRoom}
                onOccupyRoom={occupyRoom}
              />
            )}
          </TabsContent>

          <TabsContent value="vacant" className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button
                variant={vacantView === 'card' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVacantView('card')}
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Card View
              </Button>
              <Button
                variant={vacantView === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVacantView('table')}
              >
                <Table className="w-4 h-4 mr-2" />
                Table View
              </Button>
            </div>
            
            {rooms.filter(room => room.status === 'vacant').length === 0 ? (
                <div className="text-center p-10 border border-dashed rounded-lg bg-white text-gray-500">
                    All rooms are currently occupied!
                </div>
            ) : vacantView === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.filter(room => room.status === 'vacant').map(room => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onUpdatePayment={updateRoomPayment}
                    onRenewContract={renewContract}
                    onVacateRoom={vacateRoom}
                    onOccupyRoom={occupyRoom}
                  />
                ))}
              </div>
            ) : (
              <RoomTable
                rooms={rooms.filter(room => room.status === 'vacant')}
                onUpdatePayment={updateRoomPayment}
                onRenewContract={renewContract}
                onVacateRoom={vacateRoom}
                onOccupyRoom={occupyRoom}
              />
            )}
          </TabsContent>

          <TabsContent value="paid" className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button
                variant={paidView === 'card' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPaidView('card')}
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Card View
              </Button>
              <Button
                variant={paidView === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPaidView('table')}
              >
                <Table className="w-4 h-4 mr-2" />
                Table View
              </Button>
            </div>
            
            {paidView === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.filter(room => room.status === 'occupied' && room.renter && room.renter.amountPaid >= room.price).map(room => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onUpdatePayment={updateRoomPayment}
                    onRenewContract={renewContract}
                    onVacateRoom={vacateRoom}
                    onOccupyRoom={occupyRoom}
                  />
                ))}
              </div>
            ) : (
              <RoomTable
                rooms={rooms.filter(room => room.status === 'occupied' && room.renter && room.renter.amountPaid >= room.price)}
                onUpdatePayment={updateRoomPayment}
                onRenewContract={renewContract}
                onVacateRoom={vacateRoom}
                onOccupyRoom={occupyRoom}
              />
            )}
          </TabsContent>

          <TabsContent value="unpaid" className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button
                variant={unpaidView === 'card' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUnpaidView('card')}
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Card View
              </Button>
              <Button
                variant={unpaidView === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUnpaidView('table')}
              >
                <Table className="w-4 h-4 mr-2" />
                Table View
              </Button>
            </div>
            
            {unpaidView === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.filter(room => room.status === 'occupied' && room.renter && room.renter.amountPaid < room.price).map(room => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onUpdatePayment={updateRoomPayment}
                    onRenewContract={renewContract}
                    onVacateRoom={vacateRoom}
                    onOccupyRoom={occupyRoom}
                  />
                ))}
              </div>
            ) : (
              <RoomTable
                rooms={rooms.filter(room => room.status === 'occupied' && room.renter && room.renter.amountPaid < room.price)}
                onUpdatePayment={updateRoomPayment}
                onRenewContract={renewContract}
                onVacateRoom={vacateRoom}
                onOccupyRoom={occupyRoom}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}