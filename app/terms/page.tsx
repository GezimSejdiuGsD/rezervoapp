export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-800 space-y-8">
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-black tracking-tight text-gray-900">
          Terms of Service
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Last updated: November 2026
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">1. Seller & Merchant of Record</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          <strong>Rezervo</strong> (accessible at <strong>rezervo.shop</strong>) is operated and sold by{" "}
          <strong>Gëzim Sejdiu</strong> (&ldquo;Seller&rdquo;). All online order processing, payment
          collection, invoicing, and tax compliance for subscriptions on Rezervo are handled by{" "}
          <strong>AgentaOS</strong> acting as the authorized <strong>Merchant of Record</strong>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">2. Description of Service</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          Rezervo provides a cloud-based Software-as-a-Service (SaaS) appointment booking and schedule
          management platform for service-based businesses and their end customers.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">3. Subscriptions & Billing</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          Business accounts access dashboard features through recurring monthly or annual subscription
          plans billed in advance via AgentaOS. Prices are displayed clearly prior to checkout.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">4. Cancellation Policy</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          You may cancel your Rezervo subscription at any time from your account dashboard or by
          contacting support before your next billing renewal date. Upon cancellation, your account
          will remain active until the end of the current paid billing period, after which you will
          not be charged again.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">5. Refund Policy</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          If you are unsatisfied with Rezervo, you may request a full refund within{" "}
          <strong>14 days</strong> of your initial subscription purchase, provided the account has
          not been used for abusive or fraudulent activity. Renewal payments are non-refundable once
          the new billing cycle has started, except where required by applicable consumer law. To
          request a refund, contact us or AgentaOS support with your order reference.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">6. Contact Information</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          <strong>Seller:</strong> Gëzim Sejdiu (Rezervo — rezervo.shop)
          <br />
          <strong>Merchant of Record:</strong> AgentaOS (agentaos.ai)
        </p>
      </section>
    </main>
  );
}