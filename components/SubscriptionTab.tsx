"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Check,
  CreditCard,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  X,
} from "lucide-react";

const AGENTAOS_PLANS = {
  mujore: {
    name: "Mujore",
    price: "€15 / muaj",
  },
  vjetore: {
    name: "Vjetore",
    price: "€140 / vit",
  },
};

export default function SubscriptionTab({ profile }: { profile: any }) {
  const [selectedPlan, setSelectedPlan] = useState<"mujore" | "vjetore">("mujore");
  const [loading, setLoading] = useState(false);
  const [paymentBanner, setPaymentBanner] = useState<"success" | "canceled" | null>(
    null
  );

  const searchParams = useSearchParams();
  const router = useRouter();

  // Detect return from AgentaOS checkout (?payment=success or ?payment=canceled)
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "success" || paymentStatus === "canceled") {
      setPaymentBanner(paymentStatus);

      // Refresh server data so updated subscription_end shows immediately
      if (paymentStatus === "success") {
        router.refresh();
      }

      // Clean the query parameter from the URL without reloading
      const url = new URL(window.location.href);
      url.searchParams.delete("payment");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams, router]);

  const isSubscriptionActive =
    profile?.subscription_status === "active" &&
    profile?.subscription_end &&
    new Date(profile.subscription_end) > new Date();

  const formattedEndDate = profile?.subscription_end
    ? new Date(profile.subscription_end).toLocaleDateString("sq-AL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  const handleRenew = async () => {
    if (!profile?.id) return;
    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: profile.id,
          email: profile.email,
          plan: selectedPlan,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Gabim gjatë hapjes së pagesës.");
        setLoading(false);
      }
    } catch {
      alert("Gabim në lidhje me serverin.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 max-w-2xl">
      {/* Return Status Banner */}
      {paymentBanner === "success" && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={20} className="text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-green-900">
                Pagesa u krye me sukses!
              </p>
              <p className="text-xs text-green-700 mt-0.5">
                Abonimi i biznesit tuaj është aktivizuar. Nëse data nuk
                përditësohet menjëherë, rifreskoni faqen pas pak sekondash.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPaymentBanner(null)}
            className="text-green-600 hover:text-green-800 cursor-pointer"
            aria-label="Mbyll"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {paymentBanner === "canceled" && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <XCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-red-900">
                Pagesa nuk u përfundua
              </p>
              <p className="text-xs text-red-700 mt-0.5">
                Transaksioni u anulua ose dështoi. Mund të provoni përsëri kur
                të jeni gati.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPaymentBanner(null)}
            className="text-red-600 hover:text-red-800 cursor-pointer"
            aria-label="Mbyll"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="mb-6">
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 ${
            isSubscriptionActive
              ? "bg-green-50 text-green-600"
              : "bg-red-50 text-red-600"
          }`}
        >
          Statusi:{" "}
          {isSubscriptionActive
            ? `Aktiv (deri më ${formattedEndDate})`
            : "Jo Aktiv / I Skaduar"}
        </span>
        <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">
          Abonimi i Biznesit
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Zgjidhni planin tuaj për të mbajtur faqen e rezervimeve aktive.
        </p>
      </div>

      {/* Plan Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {(["mujore", "vjetore"] as const).map((key) => {
          const plan = AGENTAOS_PLANS[key];
          const isSelected = selectedPlan === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedPlan(key)}
              className={`p-5 rounded-2xl border-2 text-left transition-all ${
                isSelected
                  ? "border-blue-600 bg-blue-50/40"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-black uppercase text-sm text-gray-900">
                  {plan.name}
                </span>
                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Check size={12} />
                  </span>
                )}
              </div>
              <p className="text-xl font-black text-gray-900">{plan.price}</p>
            </button>
          );
        })}
      </div>

      {/* Rinovoni Tani Button */}
      <button
        type="button"
        onClick={handleRenew}
        disabled={loading}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <CreditCard size={16} />
        )}
        {loading
          ? "Duke hapur pagesën..."
          : `Rinovoni Tani (${AGENTAOS_PLANS[selectedPlan].name})`}
      </button>

      <p className="mt-4 text-xs text-gray-400 flex items-center justify-center gap-1.5 font-medium">
        <ShieldCheck size={14} className="text-green-600" />
        Pagesë e sigurt përmes AgentaOS
      </p>
    </div>
  );
}