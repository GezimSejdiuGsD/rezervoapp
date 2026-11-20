import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyAdmin() {
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

  if (!user) return null;

  const { data: callerProfile } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (callerProfile?.role !== "admin") return null;
  return user;
}

export async function GET() {
  try {
    const adminUser = await verifyAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [
      { data: profiles, error: profErr },
      { data: authData },
      { data: payments, error: payErr },
      { data: backups },
    ] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false }),
      supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
      supabaseAdmin
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
      supabaseAdmin
        .from("deleted_profiles_backup")
        .select("*")
        .order("deleted_at", { ascending: false })
        .limit(50),
    ]);

    if (profErr) throw profErr;
    if (payErr) throw payErr;

    const emailMap = new Map(
      (authData?.users || []).map((u) => [u.id, u.email || null])
    );

    const enrichedProfiles = (profiles || []).map((p) => ({
      ...p,
      email: emailMap.get(p.id) || null,
    }));

    return NextResponse.json({
      profiles: enrichedProfiles,
      payments: payments || [],
      backups: backups || [],
    });
  } catch (err: any) {
    console.error("Admin overview error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load admin data" },
      { status: 500 }
    );
  }
}

// POST: Restore a deleted profile from deleted_profiles_backup
export async function POST(req: Request) {
  try {
    const adminUser = await verifyAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { backupId } = await req.json();
    if (!backupId) {
      return NextResponse.json({ error: "Missing backupId" }, { status: 400 });
    }

    const { data: backupRow, error: fetchErr } = await supabaseAdmin
      .from("deleted_profiles_backup")
      .select("*")
      .eq("backup_id", backupId)
      .single();

    if (fetchErr || !backupRow) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    }

    const profileToRestore = backupRow.profile_data;

    // Re-insert into profiles
    const { error: restoreErr } = await supabaseAdmin
      .from("profiles")
      .upsert(profileToRestore, { onConflict: "id" });

    if (restoreErr) {
      return NextResponse.json(
        {
          error:
            restoreErr.message ||
            "Nuk u rikthye (sigurohuni që përdoruesi ekziston ende në Auth).",
        },
        { status: 400 }
      );
    }

    // Remove the backup entry once restored
    await supabaseAdmin
      .from("deleted_profiles_backup")
      .delete()
      .eq("backup_id", backupId);

    return NextResponse.json({ restored: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to restore profile" },
      { status: 500 }
    );
  }
}