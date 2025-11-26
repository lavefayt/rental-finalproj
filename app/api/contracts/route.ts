import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const status = searchParams.get("status");
    const roomId = searchParams.get("roomId");
    const renterId = searchParams.get("renterId");
    const paymentStatus = searchParams.get("paymentStatus");

    let query = supabase
      .from("contracts")
      .select(
        `
        *,
        room:rooms(*),
        renter:renters(*)
      `
      )
      .order("start_date", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }
    if (roomId) {
      query = query.eq("room_id", roomId);
    }
    if (renterId) {
      query = query.eq("renter_id", renterId);
    }

    const { data: contracts, error } = await query;

    if (error) throw error;

    // Calculate payment status if requested
    if (paymentStatus && contracts) {
      const contractsWithPayments = await Promise.all(
        contracts.map(async (contract) => {
          const { data: payments } = await supabase
            .from("payments")
            .select("amount, payment_date")
            .eq("contract_id", contract.id);

          const totalPaid =
            payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
          const balance = contract.monthly_rent - totalPaid;

          let status = "unpaid";
          if (totalPaid >= contract.monthly_rent) {
            status = "paid";
          } else if (totalPaid > 0) {
            status = "partial";
          }

          // Check if overdue
          const isOverdue =
            new Date(contract.end_date) < new Date() && balance > 0;

          return {
            ...contract,
            total_paid: totalPaid,
            balance,
            payment_status: status,
            is_overdue: isOverdue,
          };
        })
      );

      // Filter by payment status if specified
      const filtered =
        paymentStatus === "overdue"
          ? contractsWithPayments.filter((c) => c.is_overdue)
          : paymentStatus === "unpaid"
          ? contractsWithPayments.filter(
              (c) =>
                c.payment_status === "unpaid" || c.payment_status === "partial"
            )
          : paymentStatus === "paid"
          ? contractsWithPayments.filter((c) => c.payment_status === "paid")
          : contractsWithPayments;

      return NextResponse.json({ data: filtered }, { status: 200 });
    }

    return NextResponse.json({ data: contracts }, { status: 200 });
  } catch (error) {
    console.error("Error fetching contracts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contracts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      room_id,
      renter_id,
      start_date,
      end_date,
      monthly_rent,
      status = "active",
    } = body;

    if (!room_id || !renter_id || !start_date || !end_date || !monthly_rent) {
      return NextResponse.json(
        {
          error:
            "room_id, renter_id, start_date, end_date, and monthly_rent are required",
        },
        { status: 400 }
      );
    }

    if (monthly_rent <= 0) {
      return NextResponse.json(
        { error: "monthly_rent must be greater than 0" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("contracts")
      .insert({
        room_id,
        renter_id,
        start_date,
        end_date,
        monthly_rent,
        status,
      })
      .select()
      .single();

    if (error) throw error;

    // Update room status to occupied
    await supabase
      .from("rooms")
      .update({ status: "occupied" })
      .eq("id", room_id);

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Error creating contract:", error);
    return NextResponse.json(
      { error: "Failed to create contract" },
      { status: 500 }
    );
  }
}
