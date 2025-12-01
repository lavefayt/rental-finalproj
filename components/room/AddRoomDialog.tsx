"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Room } from "@/types/app.types";

interface AddRoomDialogProps {
  onAddRoom: (room: { roomNumber: string; price: number }) => void;
  existingRooms: Room[];
}

const addRoomSchema = z.object({
  roomNumber: z.string().min(1, "Room number is required"),
  price: z
    .string()
    .min(1, "Price is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Price must be a positive number",
    }),
});

type AddRoomFormData = z.infer<typeof addRoomSchema>;

export function AddRoomDialog({
  onAddRoom,
  existingRooms,
}: AddRoomDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddRoomFormData>({
    resolver: zodResolver(addRoomSchema),
  });

  const checkDuplicateRoom = (roomNum: string) => {
    return existingRooms.some((room) => room.roomNumber === roomNum);
  };

  const onSubmit = (data: AddRoomFormData) => {
    const isDuplicate = checkDuplicateRoom(data.roomNumber);

    if (isDuplicate) {
      setConfirmDialog({
        open: true,
        title: "Room Number Already Exists",
        description: `A room with number "${data.roomNumber}" already exists in the system. Do you want to continue adding this room anyway?`,
        onConfirm: () => {
          addRoom(data);
          setConfirmDialog({ ...confirmDialog, open: false });
        },
      });
    } else {
      // Always show confirmation for adding a room
      setConfirmDialog({
        open: true,
        title: "Add New Room?",
        description: `Are you sure you want to add Room ${
          data.roomNumber
        } with monthly rent of ₱${parseFloat(data.price).toLocaleString()}?`,
        onConfirm: () => {
          addRoom(data);
          setConfirmDialog({ ...confirmDialog, open: false });
        },
      });
    }
  };

  const addRoom = async (data: AddRoomFormData) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    onAddRoom({
      roomNumber: data.roomNumber,
      price: parseFloat(data.price),
    });
    reset();
    setIsOpen(false);
    setIsLoading(false);
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

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="roomNumber">
                  Room Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="roomNumber"
                  type="text"
                  placeholder="e.g., 107"
                  aria-invalid={!!errors.roomNumber}
                  {...register("roomNumber")}
                />
                {errors.roomNumber && (
                  <p className="text-red-500 text-sm">
                    {errors.roomNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">
                  Monthly Rent Price <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="e.g., 2500"
                  aria-invalid={!!errors.price}
                  {...register("price")}
                />
                {errors.price && (
                  <p className="text-red-500 text-sm">{errors.price.message}</p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Room"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
      />
    </>
  );
}
