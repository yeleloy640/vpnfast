import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | FastVPN",
  description: "Learn how FastVPN handles account, device, and payment information.",
};

export default function PrivacyPage() {
  return (
    <main className="legal-shell">
      <header className="legal-header"><a className="landing-brand" href="/"><span className="landing-brand-icon">✳</span><span>fast<span>vpn</span></span></a><a className="legal-back" href="/">← Back to FastVPN</a></header>
      <article className="legal-content">
        <div className="landing-eyebrow"><span /> YOUR INFORMATION, EXPLAINED</div>
        <h1>Privacy Policy</h1>
        <p className="legal-lede">This policy explains how FastVPN handles information when you use our account management service. It is a launch draft and must be completed with the operator’s legal details before publication.</p>
        <p className="legal-updated">Last updated: October 4, 2026</p>

        <section><h2>1. Who operates FastVPN</h2><p>FastVPN is operated by <strong>[Insert the legal name and address of the service operator]</strong> (“FastVPN”, “we”, “us”). Contact the privacy team at <strong>[Insert a monitored privacy contact email]</strong>. These details need to be completed before this policy is relied on.</p></section>
        <section><h2>2. Information we handle</h2><ul><li><strong>Account information:</strong> email address, password hash, account and session identifiers.</li><li><strong>Devices:</strong> device names and identifiers you register or remove from your account.</li><li><strong>Subscription and payment records:</strong> selected plan, invoice identifiers, amounts, payment status, and subscription dates. Payments are processed by Heleket; we do not store your full payment-card or wallet credentials.</li><li><strong>Technical information:</strong> information your browser and hosting provider may process to deliver, protect, and troubleshoot the site, such as IP address, request time, and basic diagnostic logs.</li><li><strong>Cookie choice:</strong> a value in local browser storage that remembers whether you selected “Essential only” or “Allow all”.</li></ul></section>
        <section><h2>3. Why we use it</h2><p>We use this information to create and secure accounts, manage sessions and registered devices, show subscription and invoice history, process payments and payment notifications, prevent abuse, and respond to support requests. We do not currently use advertising or analytics cookies.</p></section>
        <section><h2>4. VPN connectivity</h2><p>The current application manages accounts, devices, subscriptions, and payments. It does not itself create or operate a VPN tunnel. Do not rely on this dashboard as evidence that your internet traffic is routed through a VPN. If VPN connectivity or traffic processing is added later, this policy must be updated before that feature is offered.</p></section>
        <section><h2>5. Service providers and sharing</h2><p>We share information only as needed with infrastructure and database providers that host the service, Heleket to process and confirm payments, and authorities where we are legally required to respond. Provider names, locations, and applicable transfer safeguards must be confirmed by the operator before launch.</p></section>
        <section><h2>6. Retention and security</h2><p>We keep account and transaction records for as long as needed to provide the service, meet legal obligations, resolve disputes, and protect the service. Session records expire; deleting a session does not necessarily delete account or billing records. We use access controls and password hashing, but no online service can promise absolute security.</p></section>
        <section><h2>7. Your choices and rights</h2><p>You can update account details and manage registered devices in the dashboard. Depending on where you live, you may have rights to access, correct, delete, restrict, or object to certain processing, and to complain to a data protection authority. Contact <strong>[Insert privacy contact email]</strong> to make a privacy request. We may need to verify your identity before acting.</p></section>
        <section><h2>8. Cookies and browser storage</h2><p>The preference banner records your selection in local browser storage. Choosing “Essential only” stores that choice; “Allow all” is currently equivalent because optional analytics and advertising cookies are not enabled. You can clear browser storage to reset the prompt or use “Cookie settings” on the home page.</p></section>
        <section><h2>9. Children and changes</h2><p>The service is not intended for children under the minimum age required in their jurisdiction. We may update this policy when the service or legal requirements change and will revise the date above. For material changes, we will provide notice where required.</p></section>
      </article>
      <footer className="legal-footer"><a href="/terms">Terms &amp; Conditions</a><a href="/">FastVPN home</a><span>© 2026 FastVPN</span></footer>
    </main>
  );
}
