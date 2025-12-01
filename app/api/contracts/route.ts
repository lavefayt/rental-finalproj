import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Helper function to calculate total rent based on contract duration
function calculateTotalRent(
  startDate: string,
  endDate: string,
  monthlyRent: number,
  storedTotalRent?: number,
  dailyRate?: number
): number {
  // Use stored total_rent if available (for extended contracts)
  if (storedTotalRent) {
    return storedTotalRent;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Daily rate calculation
  const calculatedDailyRate = dailyRate || Math.round(monthlyRent / 30);

  // Determine total rent based on duration
  if (diffDays === 365 || diffDays === 366) {
    // Yearly contract
    return monthlyRent * 12;
  } else if (diffDays >= 28 && diffDays <= 31) {
    // Monthly contract (standard month)
    return monthlyRent;
  } else if (diffDays < 28) {
    // Custom contract (less than a month) - use daily rate
    return diffDays * calculatedDailyRate;
  } else {
    // More than one month - calculate full months + remaining days
    const fullMonths = Math.floor(diffDays / 30);
    const remainingDays = diffDays % 30;
    return (fullMonths * monthlyRent) + (remainingDays * calculatedDailyRate);
  }
}

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

    // Calculate payment status if requested OR if fetching active/completed/evicted contracts
    if (
      (paymentStatus ||
        status === "active" ||
        status === "completed" ||
        status === "evicted") &&
      contracts
    ) {
      const contractsWithPayments = await Promise.all(
        contracts.map(async (contract) => {
          // Get total paid by querying payments directly
          const { data: payments } = await supabase
            .from("payments")
            .select("amount")
            .eq("contract_id", contract.id);

          const totalPaid =
            payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

          // Calculate total rent using the same formula as room calculation
          const totalRent = calculateTotalRent(
            contract.start_date,
            contract.end_date,
            contract.monthly_rent,
            contract.total_rent,
            contract.room?.daily_rate
          );
          const remaining = Math.max(0, totalRent - totalPaid);

          let paymentStatusValue = "unpaid";
          if (totalPaid >= totalRent) {
            paymentStatusValue = "paid";
          } else if (totalPaid > 0) {
            paymentStatusValue = "partial";
          }

          // Check if overdue
          const isOverdue =
            new Date(contract.end_date) < new Date() && remaining > 0;

          return {
            ...contract,
            total_rent: totalRent, // Include calculated total_rent
            total_paid: totalPaid,
            balance: remaining,
            payment_status: paymentStatusValue,
            is_overdue: isOverdue,
          };
        })
      );

      // Filter by payment status if specified
      if (paymentStatus) {
        const filtered =
          paymentStatus === "overdue"
            ? contractsWithPayments.filter((c) => c.is_overdue)
            : paymentStatus === "unpaid"
            ? contractsWithPayments.filter(
                (c) =>
                  c.payment_status === "unpaid" ||
                  c.payment_status === "partial"
              )
            : paymentStatus === "paid"
            ? contractsWithPayments.filter((c) => c.payment_status === "paid")
            : contractsWithPayments;

        return NextResponse.json({ data: filtered }, { status: 200 });
      }

      return NextResponse.json(
        { data: contractsWithPayments },
        { status: 200 }
      );
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
