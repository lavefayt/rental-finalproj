"use client";

import { Badge } from "@/components/ui/badge";
import { Room } from "@/types/app.types";

interface RoomDetailsCardProps {
  room: Room;
}

export function RoomDetailsCard({ room }: RoomDetailsCardProps) {
  return (
    <div className="bg-slate-50 p-4 rounded-lg space-y-3">
      <h3 className="text-slate-900 mb-2">Room Details</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-slate-500">Room Number:</span>
          <p className="text-slate-900">{room.roomNumber}</p>
        </div>
        <div>
          <span className="text-slate-500">Monthly Rent:</span>
          <p className="text-slate-900">₱{room.price.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-slate-500">Status:</span>
          <p className="text-slate-900">
            {room.status === "occupied" ? (
              <Badge variant="default" className="bg-green-100 text-green-700">
                Occupied
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                Vacant
              </Badge>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
