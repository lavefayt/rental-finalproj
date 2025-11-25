import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DoorOpen, AlertCircle, User, DollarSign } from 'lucide-react';
import { Room } from '@/app/page';

interface RoomCardProps {
  room: Room;
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

export function RoomCard({ room, onUpdatePayment, onRenewContract, onVacateRoom, onOccupyRoom }: RoomCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [renewalDate, setRenewalDate] = useState('');

  // New tenant form state
  const [newTenant, setNewTenant] = useState({
    name: '',
    rentStartDate: '',
    contractEndDate: '',
    amountPaid: '',
  });

  const isContractExpired = room.renter 
    ? new Date(room.renter.contractEndDate) < new Date()
    : false;

  const isPastDue = room.renter && room.renter.amountPaid < room.price;

  const calculateInterest = () => {
    if (!room.renter || !isPastDue || !isContractExpired) return 0;
    const balance = room.price - room.renter.amountPaid;
    return Math.round(balance * 0.1); // 10% interest on unpaid balance
  };

  const interest = calculateInterest();
  const totalDue = isPastDue && isContractExpired 
    ? room.price + interest
    : room.price;

  const handleMarkFullyPaid = () => {
    onUpdatePayment(room.id, totalDue);
  };

  const handleUpdatePayment = () => {
    const amount = parseFloat(paymentAmount);
    if (!isNaN(amount) && amount > 0) {
      const currentPaid = room.renter?.amountPaid || 0;
      onUpdatePayment(room.id, currentPaid + amount);
      setPaymentAmount('');
    }
  };

  const handleRenewContract = () => {
    if (renewalDate) {
      onRenewContract(room.id, renewalDate);
      setRenewalDate('');
    }
  };

  const handleNotRenew = () => {
    onVacateRoom(room.id);
    setIsOpen(false);
  };

  const handleOccupyRoom = () => {
    const { name, rentStartDate, contractEndDate, amountPaid } = newTenant;
    if (name && rentStartDate && contractEndDate && !isNaN(parseFloat(amountPaid))) {
      onOccupyRoom(room.id, {
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
      setIsOpen(false);
    }
  };

  return (
    <>
      <Card 
        className={`cursor-pointer transition-all hover:shadow-lg ${
          isContractExpired ? 'border-red-400 border-2' : ''
        } ${
          isPastDue && !isContractExpired ? 'border-orange-400 border-2' : ''
        }`}
        onClick={() => setIsOpen(true)}
      >
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Room {room.roomNumber}</span>
            {room.status === 'vacant' ? (
              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                Vacant
              </Badge>
            ) : (
              <Badge variant="default" className="bg-green-100 text-green-700">
                Occupied
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-slate-600">
            <DollarSign className="w-4 h-4" />
            <span>₱{room.price.toLocaleString()}/month</span>
          </div>
          {room.status === 'occupied' && room.renter && (
            <div className="mt-2 flex items-center gap-2 text-slate-600">
              <User className="w-4 h-4" />
              <span className="truncate">{room.renter.name}</span>
            </div>
          )}
          {isContractExpired && (
            <div className="mt-2 flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>Contract Expired</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-3xl">Room {room.roomNumber}</DialogTitle>
            <DialogDescription className="text-2xl text-slate-900 mt-2">
              ₱{room.price.toLocaleString()}/month
            </DialogDescription>
          </DialogHeader>

          {room.status === 'vacant' ? (
            <div className="py-8 text-center">
              <DoorOpen className="w-16 h-16 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-600">This room is currently vacant</p>
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
            </div>
          ) : room.renter && (
            <div className="space-y-6 mt-4">
              {/* Renter Information */}
              <div className="bg-blue-50 p-4 rounded-lg space-y-3 border border-blue-200">
                <h3 className="text-slate-900 mb-2 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Renter Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-slate-500">Name:</span>
                    <p className="text-slate-900">{room.renter.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-500">Start Date:</span>
                      <p className="text-slate-900">{new Date(room.renter.rentStartDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Contract Ends:</span>
                      <p className={isContractExpired ? 'text-red-600' : 'text-slate-900'}>
                        {new Date(room.renter.contractEndDate).toLocaleDateString()}
                        {isContractExpired && (
                          <Badge variant="destructive" className="ml-2 text-xs">Expired</Badge>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Status */}
           <div className={`p-4 rounded-lg border ${ 
                isPastDue 
                  ? isContractExpired 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-orange-50 border-orange-200'
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Payment Status
                  </h3>
                  {isPastDue ? (
                    <Badge variant="destructive">Unpaid Balance</Badge>
                  ) : (
                    <Badge className="bg-green-600">Fully Paid</Badge>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Amount Paid:</span>
                    <span className="text-slate-900">₱{room.renter.amountPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Monthly Rent:</span>
                    <span className="text-slate-900">₱{room.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Balance:</span>
                    <span className={isPastDue ? 'text-red-600' : 'text-green-600'}>
                      ₱{Math.max(0, room.price - room.renter.amountPaid).toLocaleString()}
                    </span>
                  </div>
                  {isContractExpired && isPastDue && interest > 0 && (
                    <>
                      <div className="flex justify-between border-t pt-2 mt-2">
                        <span className="text-red-600">Late Fee (10%):</span>
                        <span className="text-red-600">₱{interest.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-600">Total Due:</span>
                        <span className="text-red-600">₱{totalDue.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Payment Actions */}
              {isPastDue && (
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
              {isContractExpired && (
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
    </>
  );
}