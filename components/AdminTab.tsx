"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Download,
  Search,
  Building2,
  CheckCircle2,
  XCircle,
  Euro,
  RotateCcw,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

interface BusinessProfile {
  id: string;
  business_name: string | null;
  slug: string | null;
  email: string | null;
  phone_number: string | null;
  city: string | null;
  country: string | null;
  role: string | null;
  subscription_status: string | null;
  subscription_end: string | null;
  subscription_plan: string | null;
  plan_type: string | null;
  created_at: string;
}

interface PaymentRecord {
  id: string;
  profile_id: string | null;
  customer_email: string | null;
  plan_name: string | null;
  amount: string | number | null;
  currency: string | null;
  status: string;
  created_at: string;
}

interface DeletedBackup {
  backup_id: string;
  deleted_at: string;
  original_profile_id: string;
  profile_data: BusinessProfile;
}

export default function AdminTab({ currentRole }: { currentRole?: string | null }) {
  const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [backups, setBackups] = useState<DeletedBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/overview");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gabim gjatë ngarkimit");

      setProfiles(data.profiles || []);
      setPayments(data.payments || []);
      setBackups(data.backups || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentRole === "admin") {
      fetchAdminData();
    }
  }, [currentRole]);

  // Guard: never render for non-admins
  if (currentRole !== "admin") {
    return null;
  }

  // KPIs
  const stats = useMemo(() => {
    const businesses = profiles.filter((p) => p.role !== "admin");
    const activeCount = businesses.filter((p) => p.subscription_status === "active").length;
    const inactiveCount = businesses.length - activeCount;

    const totalRevenue = payments
      .filter((pay) => pay.status === "processed")
      .reduce((sum, pay) => sum + Number(pay.amount || 0), 0);

    return {
      totalBusinesses: businesses.length,
      activeCount,
      inactiveCount,
      totalRevenue,
    };
  }, [profiles, payments]);

  // Filtered business list
  const filteredBusinesses = useMemo(() => {
    return profiles.filter((p) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && p.subscription_status === "active") ||
        (statusFilter === "inactive" && p.subscription_status !== "active");

      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesStatus;

      return (
        matchesStatus &&
        [p.business_name, p.slug, p.email, p.phone_number, p.city]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(q))
      );
    });
  }, [profiles, searchQuery, statusFilter]);

  const handleRestore = async (backupId: string) => {
    if (!confirm("Dëshironi ta riktheni këtë profil në tabelën kryesore?")) return;
    setRestoringId(backupId);
    try {
      const res = await fetch("/api/admin/overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rikthimi dështoi");

      await fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRestoringId(null);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("sq-AL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Paneli i Administratorit</h2>
          <p className="text-sm text-gray-500">
            Pasqyra e bizneseve të regjistruara, abonimeve dhe kopjeve rezervë.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Rifresko
          </button>

          <a
            href="/api/admin/export"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition"
          >
            <Download className="w-4 h-4" />
            Shkarko Raportin (CSV)
          </a>
        </div>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-gray-200 rounded-2xl">
          <div className="flex items-center justify-between text-gray-500 text-sm">
            <span>Biznese të Regjistruara</span>
            <Building2 className="w-4 h-4 text-gray-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{stats.totalBusinesses}</p>
        </div>

        <div className="p-5 bg-white border border-gray-200 rounded-2xl">
          <div className="flex items-center justify-between text-gray-500 text-sm">
            <span>Abonime Aktive</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{stats.activeCount}</p>
        </div>

        <div className="p-5 bg-white border border-gray-200 rounded-2xl">
          <div className="flex items-center justify-between text-gray-500 text-sm">
            <span>Jo-Aktive / Skaduara</span>
            <XCircle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{stats.inactiveCount}</p>
        </div>

        <div className="p-5 bg-white border border-gray-200 rounded-2xl">
          <div className="flex items-center justify-between text-gray-500 text-sm">
            <span>Të Ardhura Totale</span>
            <Euro className="w-4 h-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            €{stats.totalRevenue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filters & Business Directory Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kërko sipas emrit, email-it, qytetit, telefonit..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl self-start">
            {(["all", "active", "inactive"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  statusFilter === tab
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab === "all" ? "Të gjitha" : tab === "active" ? "Aktive" : "Jo-aktive"}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Biznesi</th>
                <th className="px-4 py-3 font-medium">Kontakti</th>
                <th className="px-4 py-3 font-medium">Qyteti</th>
                <th className="px-4 py-3 font-medium">Statusi</th>
                <th className="px-4 py-3 font-medium">Plani</th>
                <th className="px-4 py-3 font-medium">Skadon më</th>
                <th className="px-4 py-3 font-medium">Regjistruar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    Duke ngarkuar të dhënat...
                  </td>
                </tr>
              ) : filteredBusinesses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    Nuk u gjet asnjë biznes.
                  </td>
                </tr>
              ) : (
                filteredBusinesses.map((biz) => {
                  const isActive = biz.subscription_status === "active";
                  return (
                    <tr key={biz.id} className="hover:bg-gray-50/70">
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-gray-900">
                          {biz.business_name || "Pa emër"}
                          {biz.role === "admin" && (
                            <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold bg-purple-100 text-purple-700 rounded-full">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">/{biz.slug || "—"}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-gray-800">{biz.email || "—"}</div>
                        <div className="text-xs text-gray-400">{biz.phone_number || "—"}</div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600">{biz.city || "—"}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {isActive ? "Aktiv" : "Jo-aktiv"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-700 capitalize">
                        {biz.subscription_plan || biz.plan_type || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-gray-600">
                        {formatDate(biz.subscription_end)}
                      </td>
                      <td className="px-4 py-3.5 text-gray-400 text-xs">
                        {formatDate(biz.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deleted Profiles Backup & Restore Section */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <h3 className="font-semibold text-gray-900 text-sm">
              Kopjet Rezervë të Profileve të Fshira ({backups.length})
            </h3>
          </div>
          <span className="text-xs text-gray-400">
            Ruhen automatikisht nëse një profil fshihet gabimisht
          </span>
        </div>

        {backups.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-400">
            Asnjë profil i fshirë në kopjet rezervë.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {backups.map((b) => (
              <div
                key={b.backup_id}
                className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {b.profile_data?.business_name || "Profil pa emër"}{" "}
                    <span className="text-xs font-normal text-gray-400">
                      ({b.original_profile_id})
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Fshirë më: {formatDate(b.deleted_at)} · Qyteti:{" "}
                    {b.profile_data?.city || "—"} · Tel:{" "}
                    {b.profile_data?.phone_number || "—"}
                  </p>
                </div>

                <button
                  onClick={() => handleRestore(b.backup_id)}
                  disabled={restoringId === b.backup_id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition self-start sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {restoringId === b.backup_id ? "Duke rikthyer..." : "Rikthe Profilin"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}