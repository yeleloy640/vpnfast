"use client";

import { useEffect, useState } from "react";
import LandingPage from "@/components/landing";

type IconName = "grid" | "shield" | "devices" | "wallet" | "help" | "settings" | "arrow" | "globe" | "lock" | "download" | "plus" | "dots" | "check" | "copy" | "close";
function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const shapes: Record<IconName, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></>,
    devices: <><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/></>,
    wallet: <><rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18m-5 6h2"/></>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9.6 9a2.5 2.5 0 0 1 4.8 1c0 2-2.4 2-2.4 4m0 3h.01"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.8Z" transform="translate(-1 -1) scale(.92)"/></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6"/></>, globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3m-4 5v2"/></>, download: <><path d="M12 3v12m-5-5 5 5 5-5M4 20h16"/></>, plus: <path d="M12 5v14m-7-7h14"/>, dots: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>, check: <path d="m5 12 4 4L19 6"/>, copy: <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>, close: <path d="m18 6-12 12M6 6l12 12" />,
  };
  return <svg {...common}>{shapes[name]}</svg>;
}

const nav = [{ label: "Overview", icon: "grid" as const }, { label: "Devices", icon: "devices" as const }, { label: "Subscription", icon: "shield" as const }, { label: "Billing", icon: "wallet" as const }];
const locations = [{ flag: "🇳🇱", city: "Amsterdam", region: "Netherlands", ping: "24 ms" }, { flag: "🇩🇪", city: "Frankfurt", region: "Germany", ping: "31 ms" }, { flag: "🇵🇱", city: "Warsaw", region: "Poland", ping: "18 ms" }];

type AccountUser = { id: string; name: string; email: string };
type DashboardPayload = {
  user: AccountUser;
  subscription: { plan: string; status: string; expiresAt: string | null };
  devices: { id: string; name: string; platform: string; createdAt: string }[];
  payments: { orderId: string; amount: string; status: string; createdAt: string }[];
};

export default function Home() {
  const [authLoading, setAuthLoading] = useState(true);
  const [signedInUser, setSignedInUser] = useState<AccountUser | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardPayload | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [showAuth, setShowAuth] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [section, setSection] = useState("Overview");
  const [modal, setModal] = useState("");
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("12");
  const [server, setServer] = useState("Netherlands");

  async function refreshDashboard() {
    const res = await fetch("/api/dashboard", { cache: "no-store" });
    if (res.ok) setDashboardData(await res.json());
    else if (res.status === 401) { setSignedInUser(null); setDashboardData(null); }
  }

  useEffect(() => {
    fetch("/api/auth", { cache: "no-store" }).then((res) => res.json()).then(async (data) => {
      if (data.user) { setSignedInUser(data.user); const result = await fetch("/api/dashboard", { cache: "no-store" }); if (result.ok) setDashboardData(await result.json()); }
    }).catch(() => {}).finally(() => setAuthLoading(false));
  }, []);

  async function submitAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setAuthError(""); setAuthBusy(true);
    const fields = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: authMode === "login" ? "login" : "register", name: fields.get("name"), email: fields.get("email"), password: fields.get("password") }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not sign in.");
      setSignedInUser(result.user); setShowDashboard(true); await refreshDashboard();
    } catch (error) { setAuthError(error instanceof Error ? error.message : "Could not sign in."); }
    finally { setAuthBusy(false); }
  }

  async function signOut() {
    await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) });
    setSignedInUser(null); setDashboardData(null); setModal(""); setShowDashboard(false);
  }

  async function registerDevice() {
    const platform = navigator.platform || "Browser";
    const name = /Mac/i.test(platform) ? "Mac device" : /Win/i.test(platform) ? "Windows device" : "My device";
    const res = await fetch("/api/devices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, platform }) });
    const result = await res.json();
    if (!res.ok) { setNotice(result.error); return; }
    await refreshDashboard(); setNotice("Device added to your account."); setTimeout(() => setNotice(""), 2500);
  }

  async function startPayment() {
    setPaymentBusy(true); setNotice("");
    try {
      const res = await fetch("/api/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: selectedPlan }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create an invoice.");
      if (data.url) window.location.href = data.url;
      else setNotice("Invoice created.");
    } catch (e) { setNotice(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setPaymentBusy(false); }
  }

  if (authLoading) return <main className="auth-shell"><div className="auth-loading"><span className="brand-mark"><Icon name="shield" size={21}/></span><span>Loading your secure workspace…</span></div></main>;
  if (!signedInUser) {
    if (!showAuth) return <LandingPage onLogin={() => { setAuthMode("login"); setShowAuth(true); }} onRegister={() => { setAuthMode("register"); setShowAuth(true); }} />;
    return <main className="auth-shell"><button className="auth-back" onClick={() => setShowAuth(false)}>← Back to home</button><div className="auth-card"><a className="brand auth-brand" href="#"><span className="brand-mark"><Icon name="shield" size={21}/></span><span>fast<span className="brand-light">vpn</span></span></a><span className="section-kicker">YOUR PRIVATE INTERNET</span><h1>{authMode === "login" ? "Welcome back" : "Create your account"}</h1><p className="auth-subtitle">{authMode === "login" ? "Sign in to manage your FastVPN account." : "Sign up to keep your devices and subscription in sync."}</p><form className="auth-form" onSubmit={submitAuth}>{authMode === "register" && <label>Your name<input name="name" autoComplete="name" placeholder="Alex Morgan" required minLength={2}/></label>}<label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required/></label><label>Password<input name="password" type="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} placeholder="At least 8 characters" required minLength={8}/></label>{authError&&<p className="auth-error">{authError}</p>}<button className="pay-button" disabled={authBusy}>{authBusy ? "Please wait…" : authMode === "login" ? "Sign in" : "Create account"}<Icon name="arrow" size={16}/></button></form><p className="auth-toggle">{authMode === "login" ? "New to FastVPN?" : "Already have an account?"} <button onClick={()=>{setAuthMode(authMode === "login" ? "register" : "login");setAuthError("")}}>{authMode === "login" ? "Create account" : "Sign in"}</button></p><div className="auth-security"><Icon name="lock" size={14}/> Passwords are securely hashed · Private by design</div></div><div className="auth-side-note"><span className="live-dot"/> YOUR CONNECTION. YOUR RULES.</div></main>;
  }
  if (!showDashboard) return <LandingPage signedIn onLogin={() => setShowDashboard(true)} onRegister={() => setShowDashboard(true)} />;

  return <main className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#"><span className="brand-mark"><Icon name="shield" size={21}/></span><span>fast<span className="brand-light">vpn</span></span></a>
      <div className="workspace-label">ACCOUNT</div>
      <nav className="main-nav">{nav.map((item) => <button key={item.label} className={`nav-link ${section === item.label ? "active" : ""}`} onClick={() => setSection(item.label)}><Icon name={item.icon}/><span>{item.label}</span>{item.label === "Subscription" && <span className="nav-dot"/>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><Icon name="help" size={18}/></div><div><strong>Need a hand?</strong><span>Support is here</span></div><Icon name="arrow" size={15}/></div><button className="nav-link settings-link" onClick={() => setSection("Settings")}><Icon name="settings"/><span>Settings</span></button><div className="profile"><div className="avatar">{signedInUser.name.charAt(0).toUpperCase()}</div><div className="profile-copy"><strong>{signedInUser.name}</strong><span>{signedInUser.email}</span></div><button className="icon-button" aria-label="Sign out" title="Sign out" onClick={signOut}><Icon name="close" size={15}/></button></div></div>
    </aside>

    <section className="main-area"><header className="topbar"><div className="breadcrumb">Account <span>/</span> <strong>{section}</strong></div><div className="topbar-right"><span className="secure-label"><span/>ACCOUNT SECURE</span><button className="icon-button notification" aria-label="Notifications">♧<i/></button><div className="avatar top-avatar">{signedInUser.name.charAt(0).toUpperCase()}</div></div></header>
      <div className="content-wrap"><div className="welcome-row"><div><div className="eyebrow"><span className="live-dot"/> YOUR PRIVATE INTERNET</div><h1>{section === "Overview" ? <>Hello, {signedInUser.name.split(" ")[0]} <span className="wave">✳</span></> : section}</h1><p className="page-subtitle">Your account, devices and subscription — all in one place.</p></div><button className="date-pill">⌑ &nbsp; {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date())}</button></div>
        {section !== "Overview" && <section className="section-view">{section === "Devices" ? <><div className="section-page-head"><div><span className="section-kicker">ACCOUNT ACCESS</span><h2>Registered devices</h2><p>Manage devices linked to your account.</p></div><button className="pay-button" disabled={(dashboardData?.devices.length ?? 0)>=5} onClick={registerDevice}><Icon name="plus" size={16}/> Add this device</button></div><div className="managed-devices">{dashboardData?.devices.length ? dashboardData.devices.map(device=><div className="device-modal-row" key={device.id}><span className="device-modal-icon"><Icon name="devices" size={17}/></span><span><strong>{device.name}</strong><small>{device.platform} · Added {new Date(device.createdAt).toLocaleDateString("en")}</small></span><button className="device-remove" onClick={async()=>{await fetch(`/api/devices?id=${device.id}`,{method:"DELETE"});await refreshDashboard()}}>Remove</button></div>) : <div className="empty-activity">No devices registered yet.</div>}</div><p className="section-hint">{dashboardData?.devices.length ?? 0} of 5 device slots used</p></> : section === "Subscription" ? <><span className="section-kicker">YOUR PLAN</span><h2>{dashboardData?.subscription.plan === "premium" ? "FastVPN Premium" : "FastVPN Free"}</h2><p className="section-view-desc">{dashboardData?.subscription.expiresAt ? `Active through ${new Date(dashboardData.subscription.expiresAt).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}` : "Choose a plan to start your subscription."}</p><div className="subscription-details"><div><small>STATUS</small><strong>{dashboardData?.subscription.status ?? "inactive"}</strong></div><div><small>CONNECTED ACCOUNT</small><strong>{signedInUser.email}</strong></div><div><small>DEVICE SLOTS</small><strong>{dashboardData?.devices.length ?? 0} / 5 used</strong></div></div><button className="pay-button section-cta" onClick={()=>setModal("plans")}>{dashboardData?.subscription.status === "active" ? "Extend subscription" : "Choose a plan"}<Icon name="arrow" size={16}/></button></> : section === "Billing" ? <><span className="section-kicker">PAYMENT HISTORY</span><h2>Billing</h2><p className="section-view-desc">Your Heleket invoice status and payment history.</p>{dashboardData?.payments.length ? <div className="managed-devices">{dashboardData.payments.map(payment=><div className="device-modal-row" key={payment.orderId}><span className="device-modal-icon"><Icon name="wallet" size={17}/></span><span><strong>{payment.amount} USD · {payment.status}</strong><small>{payment.orderId} · {new Date(payment.createdAt).toLocaleDateString("en")}</small></span></div>)}</div> : <div className="empty-activity">No invoices yet. Your payment history will appear here.</div>}<button className="pay-button section-cta" onClick={()=>setModal("plans")}>View plans <Icon name="arrow" size={16}/></button></> : <><span className="section-kicker">ACCOUNT SETTINGS</span><h2>Profile</h2><p className="section-view-desc">Your account details are stored securely in MongoDB.</p><div className="subscription-details"><div><small>NAME</small><strong>{signedInUser.name}</strong></div><div><small>EMAIL</small><strong>{signedInUser.email}</strong></div></div><button className="device-remove settings-logout" onClick={signOut}>Sign out</button></>}</section>}
        <div className={section === "Overview" ? "overview-content" : "hidden-view"}>
        <section className="hero-card"><div className="hero-glow"/><div className="hero-copy"><div className="connection-state"><span className="live-dot"/> {dashboardData?.subscription.status === "active" ? "SUBSCRIPTION ACTIVE" : "ACCOUNT READY"}</div><h2>{dashboardData?.subscription.status === "active" ? "Your plan is active" : "Your VPN workspace"}<span>.</span></h2><p>Manage your secure connection, subscription and registered devices from one place.</p><div className="hero-meta"><span><Icon name="lock" size={15}/> Private account</span><i/><span><Icon name="globe" size={15}/> {server}</span></div></div><div className="orbit-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit orbit-three"/><div className="orbit-core"><Icon name="shield" size={34}/><span/></div><div className="orbit-node node-one">✳</div><div className="orbit-node node-two">⌁</div></div><div className="hero-footer"><span><span className="signal-bars"><i/><i/><i/><i/></span>{dashboardData?.subscription.status === "active" ? "Subscription is active" : "Account is protected"}</span><span className="hero-ip">{dashboardData?.subscription.expiresAt ? `Renews ${new Date(dashboardData.subscription.expiresAt).toLocaleDateString("en")}` : "Choose a plan to get started"}</span><button onClick={()=>setModal("plans")}>{dashboardData?.subscription.status === "active" ? "Manage plan" : "View plans"} <Icon name="arrow" size={15}/></button></div></section>

        <div className="stats-grid"><article className="stat-card"><div className="stat-top"><span className="stat-icon purple"><Icon name="globe"/></span><span className="stat-label">PAYMENTS THIS ACCOUNT</span><span className="stat-more">···</span></div><div className="stat-number">{dashboardData?.payments.length ?? 0} <small>payments</small></div><div className="stat-foot"><span>Billing history</span></div><div className="mini-chart"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></article><article className="stat-card"><div className="stat-top"><span className="stat-icon mint"><Icon name="devices"/></span><span className="stat-label">DEVICES</span><span className="stat-more">···</span></div><div className="stat-number">{dashboardData?.devices.length ?? 0} <small className="muted">/ 5</small></div><div className="stat-foot"><span>Registered devices</span></div><div className="device-avatars"><span>{dashboardData?.devices[0]?.platform.slice(0,1) ?? "—"}</span><span>{dashboardData?.devices[1]?.platform.slice(0,1) ?? "—"}</span><span>{dashboardData?.devices[2]?.platform.slice(0,1) ?? "—"}</span><button onClick={()=>setModal("devices")}><Icon name="plus" size={15}/></button></div></article><article className="stat-card subscription-stat"><div className="stat-top"><span className="stat-icon orange"><Icon name="shield"/></span><span className="stat-label">YOUR SUBSCRIPTION</span><span className="stat-more">···</span></div><div className="stat-number">{dashboardData?.subscription.plan === "premium" ? "Premium" : "Free"}</div><div className="stat-foot"><span>{dashboardData?.subscription.expiresAt ? <>Active until <strong>{new Date(dashboardData.subscription.expiresAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</strong></> : "No active subscription"}</span></div><div className="progress-track"><span/></div><div className="progress-caption"><span>{dashboardData?.subscription.status === "active" && dashboardData.subscription.expiresAt ? `Active until ${new Date(dashboardData.subscription.expiresAt).toLocaleDateString("en", { month: "short", day: "numeric" })}` : "Choose a plan"}</span><button onClick={()=>setModal("plans")}>Renew <Icon name="arrow" size={13}/></button></div></article></div>

        <div className="lower-grid"><section className="panel locations-panel"><div className="panel-heading"><div><span className="section-kicker">GLOBAL NETWORK</span><h3>Server preference</h3></div><button className="text-button" onClick={()=>setSection("Devices")}>Change location <Icon name="arrow" size={14}/></button></div><div className="location-list">{locations.map((loc)=> <button key={loc.city} className={`location-row ${server===loc.region?"selected-location":""}`} onClick={()=>{setServer(loc.region);setNotice(`Preferred server set to ${loc.city}. VPN gateway integration is not configured yet.`);setTimeout(()=>setNotice(""),2500)}}><span className="flag">{loc.flag}</span><span className="location-name"><strong>{loc.city}</strong><small>{loc.region}</small></span><span className="ping"><i/>{loc.ping}</span><span className="connect-arrow"><Icon name="arrow" size={16}/></span></button>)}</div><button className="all-locations" onClick={()=>setSection("Devices")}><Icon name="globe" size={16}/> Browse all 48 locations</button></section>
          <section className="panel activity-panel"><div className="panel-heading"><div><span className="section-kicker">YOUR ACCOUNT</span><h3>Recent payments</h3></div><button className="icon-button" aria-label="More options"><Icon name="dots"/></button></div><div className="activity-list">{dashboardData?.payments.length ? dashboardData.payments.slice(0,3).map((payment)=><div className="activity-item" key={payment.orderId}><span className="activity-icon amber"><Icon name="wallet" size={16}/></span><div><strong>{payment.status === "paid" ? "Subscription payment" : "Payment " + payment.status}</strong><small>{payment.amount} USD · {payment.orderId.slice(0,18)}</small></div><time>{new Date(payment.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" })}</time></div>) : <div className="empty-activity">No payments yet. Your billing activity will appear here.</div>}</div><button className="activity-more" onClick={()=>setSection("Billing")}>All payments <Icon name="arrow" size={14}/></button></section></div>

        <section className="download-banner"><div className="download-art"><div className="download-orbit"/><span>⌘</span></div><div className="download-copy"><span className="section-kicker">GET STARTED WITH FASTVPN</span><h3>Set up FastVPN on your devices</h3><p>Register devices to keep track of your account access.</p></div><div className="download-actions"><button className="platform-button" onClick={registerDevice}><Icon name="plus" size={16}/>Add this device</button><button className="platform-link" onClick={()=>setModal("devices")}>Manage devices <Icon name="arrow" size={14}/></button></div></section>
        </div>
        <footer className="footer"><span>© 2026 FastVPN. Private by design.</span><div><button>Privacy</button><button>Terms</button><span className="footer-status"><i/>ACCOUNT SECURE</span></div></footer>
      </div>
    </section>

    {notice && <div className="toast"><span className="toast-check"><Icon name="check" size={14}/></span>{notice}<button onClick={()=>setNotice("")}><Icon name="close" size={15}/></button></div>}
    {modal && <div className="modal-backdrop" onClick={()=>setModal("")}><section className="modal-card" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setModal("")}><Icon name="close"/></button>{modal === "plans" ? <><span className="section-kicker">CHOOSE A PLAN</span><h2>Choose your plan</h2><p className="modal-desc">Choose a subscription term. Secure cryptocurrency checkout is provided by Heleket.</p><div className="plan-options">{[{months:"1",price:"$9.99",caption:"per month"},{months:"12",price:"$59.99",caption:"$5.00 / month · −50%"},{months:"24",price:"$89.99",caption:"$3.75 / month · −62%"}].map(p=><button key={p.months} className={`plan-option ${selectedPlan===p.months?"chosen":""}`} onClick={()=>setSelectedPlan(p.months)}><span className="plan-radio"/ ><span><strong>{p.months} {p.months==="1"?"month":"months"}</strong><small>{p.caption}</small></span><b>{p.price}</b></button>)}</div>{notice&&<p className="modal-error">{notice}</p>}<button className="pay-button" onClick={startPayment} disabled={paymentBusy}>{paymentBusy?"Creating invoice…":<>Continue to checkout <Icon name="arrow" size={16}/></>}</button><div className="payment-note"><Icon name="lock" size={14}/> Secure checkout by <strong>Heleket</strong></div></> : <><span className="section-kicker">FASTVPN</span><h2>{modal === "devices" ? "Your devices" : modal}</h2><p className="modal-desc">Set up FastVPN on your devices with one account.</p>{dashboardData?.devices.map((device)=><div className="device-modal-row" key={device.id}><span className="device-modal-icon"><Icon name="devices" size={17}/></span><span><strong>{device.name}</strong><small>{device.platform} · Added {new Date(device.createdAt).toLocaleDateString("en")}</small></span><button className="device-remove" onClick={async()=>{await fetch(`/api/devices?id=${device.id}`,{method:"DELETE"});await refreshDashboard()}}>Remove</button></div>)}<button className="pay-button" disabled={(dashboardData?.devices.length ?? 0)>=5} onClick={registerDevice}><Icon name="plus" size={16}/> Add this device</button></>}</section></div>}
  </main>;
}
