export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-800 space-y-8">
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-black tracking-tight text-gray-900">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Last updated: November 2026
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">1. Data Controller & Payment Processor</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          <strong>Rezervo</strong> (<strong>rezervo.shop</strong>), operated by{" "}
          <strong>Gëzim Sejdiu</strong>, respects your privacy. Payment transactions and checkout
          billing data are processed by <strong>AgentaOS</strong> as our authorized{" "}
          <strong>Merchant of Record</strong>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">2. Information We Collect</h2>
        <ul className="list-disc pl-5 text-sm leading-relaxed text-gray-600 space-y-1">
          <li>
            <strong>Business Account Data:</strong> Name, business name, email address, phone
            number, city, working hours, and service listings.
          </li>
          <li>
            <strong>Booking Data:</strong> Customer names, phone numbers, selected services, and
            appointment dates/times submitted through public booking pages.
          </li>
          <li>
            <strong>Billing Data:</strong> Subscription status and transaction references managed via
            AgentaOS (we do not store full credit card numbers on our servers).
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">3. How We Use Your Information</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          We use collected data strictly to operate the Rezervo booking platform, display public
          business profiles, manage appointment schedules, process subscriptions through AgentaOS,
          and provide customer support.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">4. Data Sharing & Security</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          We do not sell your personal data. Data is shared only with essential infrastructure and
          payment partners (such as Supabase for database hosting and AgentaOS for payment
          processing) under strict security controls.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">5. Your Rights & Contact</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          You may request access to, correction of, or deletion of your account and personal data at
          any time by contacting <strong>Gëzim Sejdiu</strong> via <strong>rezervo.shop</strong>.
        </p>
      </section>
    </main>
  );
}