"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/app/components/Sidebar";

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 py-5 border-b border-white/8 last:border-0 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="mt-0.5 text-xs text-white/45">{description}</p>}
      </div>
      <div className="md:shrink-0">{children}</div>
    </div>
  );
}

const STORAGE_KEY = "roadquest-settings";

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState("RoadQuest Cars");
  const [currency, setCurrency] = useState("AUD");
  const [serviceInterval, setServiceInterval] = useState("10000");
  const [regoThreshold, setRegoThreshold] = useState("30");
  const [insThreshold, setInsThreshold] = useState("30");
  const [saved, setSaved] = useState(false);

  // Load saved settings on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const s = JSON.parse(stored);
        if (s.businessName) setBusinessName(s.businessName);
        if (s.currency) setCurrency(s.currency);
        if (s.serviceInterval) setServiceInterval(s.serviceInterval);
        if (s.regoThreshold) setRegoThreshold(s.regoThreshold);
        if (s.insThreshold) setInsThreshold(s.insThreshold);
      }
    } catch {}
  }, []);

  function handleSave() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ businessName, currency, serviceInterval, regoThreshold, insThreshold })
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
  }

  const inputClass =
    "h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-blue-400/50 focus:bg-white/10 transition";

  return (
    <div className="flex min-h-screen bg-[#061224] text-white">
      <Sidebar />

      <div className="flex-1 min-w-0">
        <div className="mx-auto max-w-3xl px-6 py-8 md:px-8">

          {/* Header */}
          <div className="mb-8 flex flex-col gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-300/70">Preferences</p>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Settings</h1>
          </div>

          {/* Saved confirmation banner */}
          {saved && (
            <div className="mb-6 flex items-center gap-3 rounded-[20px] border border-emerald-400/25 bg-emerald-500/10 px-5 py-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-300 shrink-0">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <p className="text-sm font-medium text-emerald-300">Settings saved successfully.</p>
            </div>
          )}

          {/* Business Info */}
          <section className="mb-6 rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-2xl shadow-black/20 backdrop-blur">
            <p className="mb-1 text-xs uppercase tracking-[0.2em] text-white/40">Business</p>
            <h2 className="mb-5 text-xl font-semibold">Business Info</h2>

            <SettingRow label="Business Name" description="Displayed across the admin panel">
              <input
                className={`${inputClass} w-64`}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </SettingRow>

            <SettingRow label="Currency" description="Used for pricing display">
              <select
                className={`${inputClass} w-40`}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option className="text-black" value="AUD">AUD ($)</option>
                <option className="text-black" value="USD">USD ($)</option>
                <option className="text-black" value="EUR">EUR (€)</option>
                <option className="text-black" value="GBP">GBP (£)</option>
              </select>
            </SettingRow>

            <SettingRow label="Service Interval" description="KM between services">
              <input
                className={`${inputClass} w-40`}
                type="number"
                value={serviceInterval}
                onChange={(e) => setServiceInterval(e.target.value)}
              />
            </SettingRow>
          </section>

          {/* Alerts */}
          <section className="mb-6 rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-2xl shadow-black/20 backdrop-blur">
            <p className="mb-1 text-xs uppercase tracking-[0.2em] text-white/40">Notifications</p>
            <h2 className="mb-5 text-xl font-semibold">Alerts</h2>

            <SettingRow label="Rego warning threshold" description="Warn when rego expires within X days">
              <div className="flex items-center gap-2">
                <input
                  className={`${inputClass} w-24`}
                  type="number"
                  value={regoThreshold}
                  onChange={(e) => setRegoThreshold(e.target.value)}
                />
                <span className="text-sm text-white/40">days</span>
              </div>
            </SettingRow>

            <SettingRow label="Insurance warning threshold" description="Warn when insurance expires within X days">
              <div className="flex items-center gap-2">
                <input
                  className={`${inputClass} w-24`}
                  type="number"
                  value={insThreshold}
                  onChange={(e) => setInsThreshold(e.target.value)}
                />
                <span className="text-sm text-white/40">days</span>
              </div>
            </SettingRow>
          </section>

          {/* App info */}
          <section className="mb-6 rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-2xl shadow-black/20 backdrop-blur">
            <p className="mb-1 text-xs uppercase tracking-[0.2em] text-white/40">About</p>
            <h2 className="mb-5 text-xl font-semibold">App Info</h2>

            <SettingRow label="Version">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/60">v1.0</span>
            </SettingRow>
            <SettingRow label="Database">
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
                Supabase · Connected
              </span>
            </SettingRow>
          </section>

          {/* Save button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="h-11 rounded-2xl bg-blue-500 px-8 text-sm font-medium text-white transition hover:bg-blue-400 active:scale-95"
            >
              Save settings
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
