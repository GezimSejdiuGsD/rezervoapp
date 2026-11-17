"use client";

import { useState } from "react";
import { Check, CreditCard, ShieldCheck, Info } from "lucide-react";

const AGENTAOS_PLANS = {
  mujore: {
    name: "Mujore",
    price: "€15 / muaj",
    checkoutUrl: "https://app.agentaos.ai/pay/o2fni3QSPCzrSLw9w1IMkw",
  },
  vjetore: {
    name: "Vjetore",
    price: "€140 / vit",
    // Replace with your Vjetore link once created in AgentaOS
    checkoutUrl: "https://app.agentaos.ai/pay/o2fni3QSPCzrSLw9w1IMkw",
  },
};

export default function SubscriptionTab({ profile }: { profile: any }) {
  const [selectedPlan, setSelectedPlan] = useState<"mujore" | "vjetore">("mujore");

  // Check both active status and that subscription_end is in the future
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

  const handleRenew = () => {
    const plan = AGENTAOS_PLANS[selectedPlan];
    const checkoutUrl = new URL(plan.checkoutUrl);

    if (profile?.email) {
      checkoutUrl.searchParams.set("email", profile.email);
    }
    if (profile?.id) {
      checkoutUrl.searchParams.set("client_reference_id", profile.id);
    }

    window.location.href = checkoutUrl.toString();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 max-w-2xl">
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

      {/* Email Match Notice */}
      {profile?.email && (
        <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
          <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Për aktivizim automatik të menjëhershëm, sigurohuni që në faqen e
            pagesës të vendosni email-in e llogarisë tuaj:{" "}
            <span className="font-bold underline">{profile.email}</span>
          </p>
        </div>
      )}

      {/* Rinovoni Tani Button */}
      <button
        type="button"
        onClick={handleRenew}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer"
      >
        <CreditCard size={16} />
        Rinovoni Tani ({AGENTAOS_PLANS[selectedPlan].name})
      </button>

      <p className="mt-4 text-xs text-gray-400 flex items-center justify-center gap-1.5 font-medium">
        <ShieldCheck size={14} className="text-green-600" />
        Pagesë e sigurt përmes AgentaOS
      </p>
    </div>
  );
}