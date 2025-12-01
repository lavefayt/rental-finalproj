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

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        {
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        },
        { status: 500 }
      );
    }

    if (!includeContract) {
      return NextResponse.json({ data: rooms }, { status: 200 });
    }

    // Fetch active contracts for each room
    const roomsWithContracts = await Promise.all(
      (rooms || []).map(async (room) => {
        const { data: contract } = await supabase
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

        if (!contract) {
          return { ...room, current_contract: undefined };
        }

        // Get total paid by querying payments directly
        const { data: payments } = await supabase
          .from("payments")
          .select("amount")
          .eq("contract_id", contract.id);

        const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

        // Calculate balance using total_rent for custom contracts, monthly_rent otherwise
        const contractTotal = contract.total_rent || contract.monthly_rent;
        const balance = contractTotal - totalPaid;

        return {
          ...room,
          current_contract: {
            ...contract,
            total_paid: totalPaid,
            balance: Math.max(0, balance),
          },
        };
      })
    );

    return NextResponse.json({ data: roomsWithContracts }, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorDetails = error instanceof Error ? error.stack : String(error);
    console.error("Error fetching rooms:", {
      message: errorMessage,
      details: errorDetails,
      hint: "",
      code: "",
    });
    return NextResponse.json(
      {
        error: "Failed to fetch rooms",
        message: errorMessage,
        details: errorDetails,
      },
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
