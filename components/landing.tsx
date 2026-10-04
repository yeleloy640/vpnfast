"use client";

import { useState } from "react";

type LandingProps = {
  onLogin: () => void;
  onRegister: () => void;
  signedIn?: boolean;
};

const features = [
  { icon: "◈", title: "Everything in one place", copy: "Your subscription, payments, and devices, all together." },
  { icon: "⌘", title: "Up to five devices", copy: "View and manage the devices connected to your account." },
  { icon: "↗", title: "Simple checkout", copy: "Choose a subscription term and continue to secure payment." },
];

export default function LandingPage({ onLogin, onRegister, signedIn = false }: LandingProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="landing-shell">
      <header className="landing-nav-wrap">
        <nav className="landing-nav" aria-label="Main navigation">
          <a className="landing-brand" href="#top" aria-label="FastVPN — home">
            <span className="landing-brand-icon">✳</span><span>fast<span>vpn</span></span>
          </a>
          <button className="landing-menu-toggle" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "×" : "☰"}</button>
          <div className={`landing-nav-links ${menuOpen ? "is-open" : ""}`}>
            <a href="#benefits" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
            <button className="landing-nav-login" onClick={onLogin}>{signedIn ? "Dashboard" : "Sign in"}</button>
            <button className="landing-nav-cta" onClick={signedIn ? onLogin : onRegister}>{signedIn ? "Open dashboard" : "Open your account"} <span>↗</span></button>
          </div>
        </nav>
      </header>

      <section className="landing-hero" id="top">
        <div className="landing-hero-copy">
          <div className="landing-eyebrow"><span/> FASTVPN ACCOUNT MANAGEMENT, MADE SIMPLE</div>
          <h1>Your online life.<br/><em>Under your control.</em></h1>
          <p>Manage your FastVPN subscription, devices, and payments in one simple dashboard.</p>
          <div className="landing-hero-actions">
            <button className="landing-primary" onClick={signedIn ? onLogin : onRegister}>{signedIn ? "Open dashboard" : "Create an account"} <span>↗</span></button>
            {!signedIn && <button className="landing-secondary" onClick={onLogin}>I already have an account</button>}
          </div>
          <div className="landing-trust"><div className="landing-avatars"><i>F</i><i>V</i><i>+</i></div><span>Your devices and plan<br/><strong>in one place</strong></span><b className="landing-trust-divider"/><span className="landing-lock">⌑</span><span>Your personal<br/><strong>secure account</strong></span></div>
        </div>

        <div className="landing-preview-wrap" aria-label="FastVPN dashboard preview">
          <div className="landing-orb landing-orb-one"/><div className="landing-orb landing-orb-two"/>
          <div className="landing-preview">
            <div className="preview-top"><div className="preview-brand"><span>✳</span> fastvpn</div><div className="preview-user"><i>A</i><span>My account</span><b>⌄</b></div></div>
            <div className="preview-welcome"><div><small>YOUR FASTVPN</small><h3>Welcome back, Alex <span>✳</span></h3><p>Your account, all in one place.</p></div><div className="preview-date">YOUR PRIVATE SPACE</div></div>
            <div className="preview-plan"><div className="preview-plan-icon">✳</div><div className="preview-plan-copy"><small>SUBSCRIPTION</small><strong>Manage your plan</strong><span>Check your status or choose a term</span></div><span className="preview-arrow">↗</span></div>
            <div className="preview-stats"><div><span className="preview-stat-icon lilac">◈</span><small>DEVICES</small><strong>03 <i>/ 5</i></strong><div className="preview-pips"><i/><i/><i/><i/><i/></div></div><div><span className="preview-stat-icon peach">▤</span><small>PAYMENTS</small><strong>History</strong><span className="preview-stat-sub">All your invoices in one place</span></div></div>
            <div className="preview-bottom"><span><i/> ACCOUNT SET UP</span><span>Manage access <b>↗</b></span></div>
          </div>
          <div className="preview-float"><span>⌘</span><div><strong>Your devices</strong><small>Easy to view and manage</small></div><i>✓</i></div>
          <div className="landing-side-note"><i/> A SPACE THAT WORKS FOR YOU</div>
        </div>
      </section>

      <section className="landing-proof" id="benefits"><div><span className="proof-star">✳</span><p>Less account hassle.<br/><strong>More control over the details.</strong></p></div><span className="proof-line"/><div className="proof-micro"><span>ONE DASHBOARD</span><span>UP TO 5 DEVICES</span><span>EASY CHECKOUT</span></div></section>

      <section className="landing-benefits" id="how-it-works">
        <div className="landing-section-heading"><div><div className="landing-eyebrow"><span/> SIMPLE BY DESIGN</div><h2>Everything you need.<br/><em>All in one place.</em></h2></div><p>FastVPN helps you keep your account organized, so you can focus on what matters.</p></div>
        <div className="landing-feature-grid">{features.map((feature, index) => <article className="landing-feature" key={feature.title}><span className={`feature-icon feature-icon-${index}`}>{feature.icon}</span><span className="feature-number">0{index + 1}</span><h3>{feature.title}</h3><p>{feature.copy}</p><button aria-label={`${feature.title}: continue to FastVPN`} onClick={signedIn ? onLogin : onRegister}>{signedIn ? "Open dashboard" : "Get started"} <span>↗</span></button></article>)}</div>
      </section>

      <section className="landing-cta-band"><div className="cta-band-glow"/><div><div className="landing-eyebrow"><span/> {signedIn ? "YOUR FASTVPN ACCOUNT" : "GET STARTED TODAY"}</div><h2>{signedIn ? <>Your FastVPN.<br/><em>All in one place.</em></> : <>Ready to take control<br/>of your <em>FastVPN?</em></>}</h2><p>{signedIn ? "Continue to your dashboard to manage your account." : "Create an account and manage everything from one place."}</p><button className="landing-primary" onClick={signedIn ? onLogin : onRegister}>{signedIn ? "Open dashboard" : "Go to your account"} <span>↗</span></button></div></section>

      <footer className="landing-footer"><a className="landing-brand" href="#top"><span className="landing-brand-icon">✳</span><span>fast<span>vpn</span></span></a><span>© 2026 FastVPN. Your account, under your control.</span><nav className="footer-links" aria-label="Legal information"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="#cookie-settings" onClick={(event) => { event.preventDefault(); window.dispatchEvent(new Event("fastvpn:cookie-settings")); }}>Cookie settings</a></nav><button onClick={onLogin}>{signedIn ? "Open dashboard" : "Sign in to your account"} <span>↗</span></button></footer>
    </main>
  );
}
