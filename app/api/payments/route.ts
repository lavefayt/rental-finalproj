import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const contractId = searchParams.get("contractId");
    const paymentMethod = searchParams.get("paymentMethod");

    let query = supabase
      .from("payments")
      .select(
        `
        *,
        contract:contracts(
          *,
          room:rooms(*),
          renter:renters(*)
        )
      `
      )
      .order("payment_date", { ascending: false });

    if (contractId) {
      query = query.eq("contract_id", contractId);
    }
    if (paymentMethod) {
      query = query.eq("payment_method", paymentMethod);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      contract_id,
      amount,
      payment_date,
      payment_method = "cash",
      notes,
    } = body;

    if (!contract_id || !amount || !payment_date) {
      return NextResponse.json(
        { error: "contract_id, amount, and payment_date are required" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "amount must be greater than 0" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("payments")
      .insert({
        contract_id,
        amount,
        payment_date,
        payment_method,
        notes,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
