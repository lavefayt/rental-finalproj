import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { CreateRoomRequest } from "@/types/room.types";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const status = searchParams.get("status");
    const includeContract = searchParams.get("includeContract") === "true";

    let query = supabase
      .from("rooms")
      .select("*")
      .order("room_number", { ascending: true });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: rooms, error } = await query;

    if (error) throw error;

    if (!includeContract) {
      return NextResponse.json({ data: rooms }, { status: 200 });
    }

    // Fetch active contracts for each room
    const roomsWithContracts = await Promise.all(
      (rooms || []).map(async (room) => {
        const { data: contracts } = await supabase
          .from("contracts")
          .select(
            `
            *,
            renter:renters(*)
          `
          )
          .eq("room_id", room.id)
          .eq("status", "active")
          .single();

        // Calculate total paid if contract exists
        let total_paid = 0;
        if (contracts) {
          const { data: payments } = await supabase
            .from("payments")
            .select("amount")
            .eq("contract_id", contracts.id);

          total_paid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        }

        return {
          ...room,
          current_contract: contracts
            ? {
                ...contracts,
                total_paid,
                balance: contracts.monthly_rent - total_paid,
              }
            : undefined,
        };
      })
    );

    return NextResponse.json({ data: roomsWithContracts }, { status: 200 });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: CreateRoomRequest = await request.json();

    const { room_number, base_price, status = "vacant" } = body;

    if (!room_number || !base_price) {
      return NextResponse.json(
        { error: "room_number and base_price are required" },
        { status: 400 }
      );
    }

    if (base_price <= 0) {
      return NextResponse.json(
        { error: "base_price must be greater than 0" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("rooms")
      .insert({
        room_number,
        base_price,
        status,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Room number already exists" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
}
