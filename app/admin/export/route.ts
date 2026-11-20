import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // 1. Verify the requester is logged in and has role === 'admin'
    const cookieStore = await cookies();
    const supabaseUser = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
        },
      }
    );

    const {
      data: { user },
    } = await supabaseUser.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (callerProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Fetch all businesses, auth users (for login emails), and payments
    const [{ data: profiles }, { data: authData }, { data: payments }] =
      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false }),
        supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
        supabaseAdmin
          .from("payments")
          .select("*")
          .eq("status", "processed")
          .order("created_at", { ascending: false }),
      ]);

    const emailById = new Map(
      (authData?.users || []).map((u) => [u.id, u.email || ""])
    );

    // Aggregate total paid & last payment per business
    const statsByProfile = new Map<
      string,
      { totalPaid: number; paymentCount: number; lastPaymentAt: string }
    >();

    for (const p of payments || []) {
      if (!p.profile_id) continue;
      const existing = statsByProfile.get(p.profile_id) || {
        totalPaid: 0,
        paymentCount: 0,
        lastPaymentAt: p.created_at,
      };
      existing.totalPaid += Number(p.amount || 0);
      existing.paymentCount += 1;
      statsByProfile.set(p.profile_id, existing);
    }

    // 3. Build CSV rows
    const headers = [
      "Profile ID",
      "Business Name",
      "Slug",
      "Login Email",
      "Phone",
      "City",
      "Country",
      "Role",
      "Subscription Status",
      "Plan",
      "Subscription End",
      "Total Paid (EUR)",
      "Payments Count",
      "Last Payment Date",
      "Registered At",
    ];

    const escapeCsv = (val: unknown) => {
      if (val === null || val === undefined) return "";
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = (profiles || []).map((prof) => {
      const payStats = statsByProfile.get(prof.id);
      return [
        prof.id,
        prof.business_name,
        prof.slug,
        emailById.get(prof.id) || "",
        prof.phone_number,
        prof.city,
        prof.country,
        prof.role,
        prof.subscription_status,
        prof.subscription_plan || prof.plan_type || "",
        prof.subscription_end || "",
        payStats ? payStats.totalPaid.toFixed(2) : "0.00",
        payStats ? payStats.paymentCount : 0,
        payStats ? payStats.lastPaymentAt : "",
        prof.created_at,
      ]
        .map(escapeCsv)
        .join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const today = new Date().toISOString().slice(0, 10);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="rezervo-businesses-${today}.csv"`,
      },
    });
  } catch (err: any) {
    console.error("Admin export error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate report" },
      { status: 500 }
    );
  }
}