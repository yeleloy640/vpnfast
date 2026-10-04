"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "fastvpn-cookie-choice-v1";

export default function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(window.localStorage.getItem(CONSENT_KEY) === null);
    const reopen = () => setVisible(true);
    window.addEventListener("fastvpn:cookie-settings", reopen);
    return () => window.removeEventListener("fastvpn:cookie-settings", reopen);
  }, []);

  function choose(choice: "essential" | "all") {
    window.localStorage.setItem(CONSENT_KEY, choice);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside className="cookie-notice" aria-label="Cookie preferences" aria-live="polite">
      <div className="cookie-notice-copy">
        <span className="cookie-notice-kicker">YOUR PRIVACY</span>
        <h2>Cookies, kept simple.</h2>
        <p>FastVPN uses essential browser storage to remember this choice and keep your account working. We do not currently use advertising or analytics cookies. <a href="/privacy">Read our Privacy Policy</a>.</p>
      </div>
      <div className="cookie-notice-actions">
        <button className="cookie-essential" onClick={() => choose("essential")}>Essential only</button>
        <button className="cookie-accept" onClick={() => choose("all")}>Allow all</button>
      </div>
    </aside>
  );
}
