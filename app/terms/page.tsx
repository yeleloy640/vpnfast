import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | FastVPN",
  description: "Terms for using the FastVPN account management service.",
};

export default function TermsPage() {
  return (
    <main className="legal-shell">
      <header className="legal-header"><a className="landing-brand" href="/"><span className="landing-brand-icon">✳</span><span>fast<span>vpn</span></span></a><a className="legal-back" href="/">← Back to FastVPN</a></header>
      <article className="legal-content">
        <div className="landing-eyebrow"><span /> CLEAR TERMS FOR YOUR ACCOUNT</div>
        <h1>Terms &amp; Conditions</h1>
        <p className="legal-lede">These terms cover use of the FastVPN account management website. They are a draft, not jurisdiction-specific legal advice. The operator and payment terms must be reviewed and completed before accepting real customers.</p>
        <p className="legal-updated">Last updated: October 4, 2026</p>

        <section><h2>1. The service provider</h2><p>FastVPN is provided by <strong>[Insert the legal name, registration details, and address of the operator]</strong> (“FastVPN”, “we”, “us”). Contact us at <strong>[Insert a monitored support email]</strong>.</p></section>
        <section><h2>2. What this service does</h2><p>The current service lets you create and manage an account, review subscription and payment information, and register or remove account devices. It does not currently provide or operate a VPN tunnel or guarantee that your internet traffic is encrypted, routed, or protected by a VPN. Do not use this account dashboard as a substitute for an active VPN connection.</p></section>
        <section><h2>3. Your account</h2><p>Provide accurate information, keep your password and sign-in links private, and promptly tell us if you suspect unauthorized access. You are responsible for activity through your account except where applicable law provides otherwise. We may limit access to protect accounts or investigate suspected abuse.</p></section>
        <section><h2>4. Plans, billing, and cancellation</h2><p>Available plans, prices, currency, duration, and renewal terms should be displayed before purchase. Payments are handled by Heleket and are subject to its checkout terms. A payment is treated as complete only after provider confirmation. Subscription periods and entitlements begin according to the status shown in your account. The operator must add the actual renewal, cancellation, refund, tax, and consumer-rights terms here before enabling paid service; nothing in these terms limits mandatory rights.</p></section>
        <section><h2>5. Acceptable use</h2><p>Do not use the service to break the law, interfere with its operation, attempt unauthorized access, submit malicious code, or infringe another person’s rights. We may suspend access where reasonably needed to protect users, the service, or comply with law, and will provide notice where appropriate and lawful.</p></section>
        <section><h2>6. Availability and changes</h2><p>We aim to keep account features available but do not guarantee uninterrupted access. We may maintain, update, or discontinue features. If a change materially affects a paid entitlement, we will provide notice and any remedy required by law.</p></section>
        <section><h2>7. Liability</h2><p>To the extent permitted by law, the service is provided without guarantees that are not expressly stated. Nothing in these terms excludes liability that cannot legally be excluded, including applicable consumer protections, or liability for fraud, intentional misconduct, or personal injury caused by negligence where exclusion is unlawful.</p></section>
        <section><h2>8. Privacy</h2><p>Our <a href="/privacy">Privacy Policy</a> explains how information is handled. Read it together with these terms.</p></section>
        <section><h2>9. Applicable law and contact</h2><p>These terms are governed by <strong>[Insert governing country/region]</strong>, subject to mandatory consumer protections in your place of residence. Disputes will be handled by the courts with jurisdiction under applicable law. Contact <strong>[Insert support email]</strong> for questions about these terms.</p></section>
      </article>
      <footer className="legal-footer"><a href="/privacy">Privacy Policy</a><a href="/">FastVPN home</a><span>© 2026 FastVPN</span></footer>
    </main>
  );
}
