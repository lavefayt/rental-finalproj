import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from("contracts")
      .select(
        `
        *,
        room:rooms(*),
        renter:renters(*)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Contract not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    // Get total paid by querying payments directly
    const { data: payments } = await supabase
      .from("payments")
      .select("amount")
      .eq("contract_id", id);

    const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

    // Calculate balance using total_rent for custom contracts, monthly_rent otherwise
    const contractTotal = data.total_rent || data.monthly_rent;
    const balance = Math.max(0, contractTotal - totalPaid);

    return NextResponse.json(
      {
        data: {
          ...data,
          total_paid: totalPaid,
          balance: balance,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching contract:", error);
    return NextResponse.json(
      { error: "Failed to fetch contract" },
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
    const body = await request.json();

    const { start_date, end_date, monthly_rent, status } = body;

    if (monthly_rent !== undefined && monthly_rent <= 0) {
      return NextResponse.json(
        { error: "monthly_rent must be greater than 0" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (monthly_rent !== undefined) updateData.monthly_rent = monthly_rent;
    if (status !== undefined) updateData.status = status;

    const { data, error } = await supabase
      .from("contracts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Contract not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    // If contract is terminated, completed, or evicted, update room status to vacant
    if (
      status === "terminated" ||
      status === "completed" ||
      status === "evicted"
    ) {
      await supabase
        .from("rooms")
        .update({ status: "vacant" })
        .eq("id", data.room_id);
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Error updating contract:", error);
    return NextResponse.json(
      { error: "Failed to update contract" },
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

    // Get contract details before deletion
    const { data: contract } = await supabase
      .from("contracts")
      .select("room_id")
      .eq("id", id)
      .single();

    const { error } = await supabase.from("contracts").delete().eq("id", id);

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Contract not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    // Update room status to vacant
    if (contract?.room_id) {
      await supabase
        .from("rooms")
        .update({ status: "vacant" })
        .eq("id", contract.room_id);
    }

    return NextResponse.json(
      { message: "Contract deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting contract:", error);
    return NextResponse.json(
      { error: "Failed to delete contract" },
      { status: 500 }
    );
  }
}
