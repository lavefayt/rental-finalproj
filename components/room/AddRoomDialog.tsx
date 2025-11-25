import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

interface AddRoomDialogProps {
  onAddRoom: (room: {
    roomNumber: string;
    price: number;
  }) => void;
}

export function AddRoomDialog({ onAddRoom }: AddRoomDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [roomNumber, setRoomNumber] = useState('');
  const [price, setPrice] = useState('');

  const handleSubmit = () => {
    if (roomNumber && !isNaN(parseFloat(price)) && parseFloat(price) > 0) {
      onAddRoom({
        roomNumber,
        price: parseFloat(price),
      });
      setRoomNumber('');
      setPrice('');
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="sm">
        <Plus className="w-4 h-4 mr-2" />
        Add Room
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Room</DialogTitle>
            <DialogDescription>
              Create a new vacant room in your property
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="roomNumber">Room Number</Label>
              <Input
                id="roomNumber"
                type="text"
                placeholder="e.g., 107"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Monthly Rent Price</Label>
              <Input
                id="price"
                type="number"
                placeholder="e.g., 2500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => setIsOpen(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                className="flex-1"
                disabled={!roomNumber || !price || isNaN(parseFloat(price)) || parseFloat(price) <= 0}
              >
                Add Room
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
