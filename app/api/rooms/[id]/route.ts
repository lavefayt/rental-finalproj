import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { UpdateRoomRequest } from "@/types/room.types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: room, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Room not found" }, { status: 404 });
      }
      throw error;
    }

    // Get active contract with renter
    const { data: contract } = await supabase
      .from("contracts")
      .select(
        `
        *,
        renter:renters(*)
      `
      )
      .eq("room_id", id)
      .eq("status", "active")
      .single();

    let roomWithContract;
    if (contract) {
      // Get total paid by querying payments directly
      const { data: payments } = await supabase
        .from("payments")
        .select("amount")
        .eq("contract_id", contract.id);

      const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      // Calculate balance using total_rent for custom contracts, monthly_rent otherwise
      const contractTotal = contract.total_rent || contract.monthly_rent;
      const balance = contractTotal - totalPaid;

      roomWithContract = {
        ...room,
        current_contract: {
          ...contract,
          total_paid: totalPaid,
          balance: Math.max(0, balance),
        },
      };
    } else {
      roomWithContract = { ...room, current_contract: undefined };
    }

    return NextResponse.json({ data: roomWithContract }, { status: 200 });
  } catch (error) {
    console.error("Error fetching room:", error);
    return NextResponse.json(
      { error: "Failed to fetch room" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body: UpdateRoomRequest = await request.json();

    const { room_number, base_price, status } = body;

    if (base_price !== undefined && base_price <= 0) {
      return NextResponse.json(
        { error: "base_price must be greater than 0" },
        { status: 400 }
      );
    }

    const updateData: {
      room_number?: string;
      base_price?: number;
      status?: string;
    } = {};
    if (room_number !== undefined) updateData.room_number = room_number;
    if (base_price !== undefined) updateData.base_price = base_price;
    if (status !== undefined) updateData.status = status;

    const { data, error } = await supabase
      .from("rooms")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Room not found" }, { status: 404 });
      }
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Room number already exists" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Error updating room:", error);
    return NextResponse.json(
      { error: "Failed to update room" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check if room has any contracts (active or completed)
    const { data: contracts } = await supabase
      .from("contracts")
      .select("id, status")
      .eq("room_id", id);

    // Check for active contracts
    const activeContracts =
      contracts?.filter((c) => c.status === "active") || [];
    if (activeContracts.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete room with active contracts. Please vacate the room first.",
        },
        { status: 400 }
      );
    }

    // Delete associated completed/terminated contracts and their payments first
    if (contracts && contracts.length > 0) {
      const contractIds = contracts.map((c) => c.id);

      // Delete payments for these contracts
      await supabase.from("payments").delete().in("contract_id", contractIds);

      // Delete the contracts
      await supabase.from("contracts").delete().eq("room_id", id);
    }

    // Now delete the room
    const { error } = await supabase.from("rooms").delete().eq("id", id);

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Room not found" }, { status: 404 });
      }
      if (error.code === "23503") {
        // Foreign key violation
        return NextResponse.json(
          {
            error:
              "Cannot delete room due to existing references. Please contact support.",
          },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json(
      { message: "Room deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting room:", error);
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 }
    );
  }
}
