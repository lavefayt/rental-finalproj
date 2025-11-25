import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Room } from '@/app/page';

interface RoomTableProps {
  rooms: Room[];
  onUpdatePayment: (roomId: string, amountPaid: number) => void;
  onRenewContract: (roomId: string, newEndDate: string) => void;
  onVacateRoom: (roomId: string) => void;
  onOccupyRoom: (roomId: string, renterDetails: {
    name: string;
    rentStartDate: string;
    contractEndDate: string;
    amountPaid: number;
  }) => void;
}

export function RoomTable({ rooms, onUpdatePayment, onRenewContract, onVacateRoom, onOccupyRoom }: RoomTableProps) {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [newTenant, setNewTenant] = useState({
    name: '',
    rentStartDate: '',
    contractEndDate: '',
    amountPaid: '',
  });

  const isContractExpired = (room: Room) => {
    return room.renter 
      ? new Date(room.renter.contractEndDate) < new Date()
      : false;
  };

  const isPastDue = (room: Room) => {
    return room.renter && room.renter.amountPaid < room.price;
  };

  const calculateInterest = (room: Room) => {
    if (!room.renter || !isPastDue(room) || !isContractExpired(room)) return 0;
    const balance = room.price - room.renter.amountPaid;
    return Math.round(balance * 0.1);
  };

  const handleMarkFullyPaid = () => {
    if (selectedRoom && selectedRoom.renter) {
      const interest = calculateInterest(selectedRoom);
      const totalDue = isPastDue(selectedRoom) && isContractExpired(selectedRoom) 
        ? selectedRoom.price + interest
        : selectedRoom.price;
      onUpdatePayment(selectedRoom.id, totalDue);
      setSelectedRoom(null);
    }
  };

  const handleUpdatePayment = () => {
    if (selectedRoom && selectedRoom.renter) {
      const amount = parseFloat(paymentAmount);
      if (!isNaN(amount) && amount > 0) {
        const currentPaid = selectedRoom.renter.amountPaid || 0;
        onUpdatePayment(selectedRoom.id, currentPaid + amount);
        setPaymentAmount('');
      }
    }
  };

  const handleRenewContract = () => {
    if (selectedRoom && renewalDate) {
      onRenewContract(selectedRoom.id, renewalDate);
      setRenewalDate('');
      setSelectedRoom(null);
    }
  };

  const handleNotRenew = () => {
    if (selectedRoom) {
      onVacateRoom(selectedRoom.id);
      setSelectedRoom(null);
    }
  };

  const handleOccupyRoom = () => {
    if (selectedRoom) {
      const { name, rentStartDate, contractEndDate, amountPaid } = newTenant;
      if (name && rentStartDate && contractEndDate && !isNaN(parseFloat(amountPaid))) {
        onOccupyRoom(selectedRoom.id, {
          name,
          rentStartDate,
          contractEndDate,
          amountPaid: parseFloat(amountPaid),
        });
        setNewTenant({
          name: '',
          rentStartDate: '',
          contractEndDate: '',
          amountPaid: '',
        });
        setSelectedRoom(null);
      }
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Room #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Renter</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.map(room => {
              const expired = isContractExpired(room);
              const pastDue = isPastDue(room);
              
              return (
                <TableRow 
                  key={room.id}
                  className={expired ? 'bg-red-50' : pastDue ? 'bg-orange-50' : ''}
                >
                  <TableCell>{room.roomNumber}</TableCell>
                  <TableCell>
                    {room.status === 'vacant' ? (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                        Vacant
                      </Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-100 text-green-700">
                        Occupied
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>₱{room.price.toLocaleString()}</TableCell>
                  <TableCell>{room.renter?.name || '-'}</TableCell>
                  <TableCell>
                    {room.renter 
                      ? new Date(room.renter.rentStartDate).toLocaleDateString() 
                      : '-'}
                  </TableCell>
                  <TableCell className={expired ? 'text-red-600' : ''}>
                    {room.renter 
                      ? new Date(room.renter.contractEndDate).toLocaleDateString() 
                      : '-'}
                    {expired && ' (Expired)'}
                  </TableCell>
                  <TableCell>
                    {room.renter ? (
                      <div>
                        <div>₱{room.renter.amountPaid.toLocaleString()} / ₱{room.price.toLocaleString()}</div>
                        {pastDue ? (
                          <Badge variant="destructive" className="mt-1">Unpaid</Badge>
                        ) : (
                          <Badge className="bg-green-600 mt-1">Paid</Badge>
                        )}
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Button 
                      onClick={() => setSelectedRoom(room)}
                      variant="outline"
                      size="sm"
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {selectedRoom && (
        <Dialog open={!!selectedRoom} onOpenChange={() => setSelectedRoom(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-3xl">Room {selectedRoom.roomNumber}</DialogTitle>
              <DialogDescription className="text-2xl text-slate-900 mt-2">
                ₱{selectedRoom.price.toLocaleString()}/month
              </DialogDescription>
            </DialogHeader>

            {selectedRoom.status === 'vacant' ? (
              <div className="space-y-4 mt-4">
                <Label htmlFor="name">Renter Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter renter name"
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                />
                <Label htmlFor="rentStartDate">Rent Start Date</Label>
                <Input
                  id="rentStartDate"
                  type="date"
                  value={newTenant.rentStartDate}
                  onChange={(e) => setNewTenant({ ...newTenant, rentStartDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
                <Label htmlFor="contractEndDate">Contract End Date</Label>
                <Input
                  id="contractEndDate"
                  type="date"
                  value={newTenant.contractEndDate}
                  onChange={(e) => setNewTenant({ ...newTenant, contractEndDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
                <Label htmlFor="amountPaid">Amount Paid</Label>
                <Input
                  id="amountPaid"
                  type="number"
                  placeholder="Enter amount paid"
                  value={newTenant.amountPaid}
                  onChange={(e) => setNewTenant({ ...newTenant, amountPaid: e.target.value })}
                />
                <Button onClick={handleOccupyRoom} className="w-full" variant="default">
                  Occupy Room
                </Button>
              </div>
            ) : selectedRoom.renter && (
              <div className="space-y-6 mt-4">
                {/* Payment Status */}
                <div className={`p-4 rounded-lg ${
                  isPastDue(selectedRoom) 
                    ? isContractExpired(selectedRoom) 
                      ? 'bg-red-50 border border-red-200' 
                      : 'bg-orange-50 border border-orange-200'
                    : 'bg-green-50 border border-green-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-700">Payment Status:</span>
                    {isPastDue(selectedRoom) ? (
                      <Badge variant="destructive">Unpaid Balance</Badge>
                    ) : (
                      <Badge className="bg-green-600">Paid</Badge>
                    )}
                  </div>
                  <p className="text-2xl">
                    ₱{selectedRoom.renter.amountPaid.toLocaleString()} out of ₱{selectedRoom.price.toLocaleString()}
                  </p>
                  {isContractExpired(selectedRoom) && isPastDue(selectedRoom) && calculateInterest(selectedRoom) > 0 && (
                    <div className="mt-2 text-red-600">
                      <p>Late Fee: ₱{calculateInterest(selectedRoom).toLocaleString()}</p>
                      <p>Total Due: ₱{(selectedRoom.price + calculateInterest(selectedRoom)).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {/* Payment Actions */}
                {isPastDue(selectedRoom) && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label htmlFor="payment">Add Payment</Label>
                        <Input
                          id="payment"
                          type="number"
                          placeholder="Enter amount"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <Button onClick={handleUpdatePayment} className="mt-6">
                        Add
                      </Button>
                    </div>
                    <Button onClick={handleMarkFullyPaid} className="w-full" variant="default">
                      Mark as Fully Paid
                    </Button>
                  </div>
                )}

                {/* Contract Renewal */}
                {isContractExpired(selectedRoom) && (
                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="text-red-600">Contract Expired - Action Required</h3>
                    <div className="space-y-2">
                      <Label htmlFor="renewal">New Contract End Date</Label>
                      <Input
                        id="renewal"
                        type="date"
                        value={renewalDate}
                        onChange={(e) => setRenewalDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleRenewContract} 
                        className="flex-1"
                        disabled={!renewalDate}
                      >
                        Renew Contract
                      </Button>
                      <Button 
                        onClick={handleNotRenew} 
                        variant="destructive"
                        className="flex-1"
                      >
                        Do Not Renew
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
