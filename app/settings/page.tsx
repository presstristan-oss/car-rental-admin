"use client";

import { Sidebar } from "@/app/components/Sidebar";

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
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

export default function SettingsPage() {
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

          {/* Business Info */}
          <section className="mb-6 rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-2xl shadow-black/20 backdrop-blur">
            <p className="mb-1 text-xs uppercase tracking-[0.2em] text-white/40">Business</p>
            <h2 className="mb-5 text-xl font-semibold">Business Info</h2>

            <SettingRow label="Business Name" description="Displayed across the admin panel">
              <input
                className="h-10 w-64 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-blue-400/50 focus:bg-white/10 transition"
                defaultValue="RoadQuest Cars"
              />
            </SettingRow>

            <SettingRow label="Currency" description="Used for pricing display">
              <select className="h-10 w-40 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none focus:border-blue-400/50 transition">
                <option className="text-black" value="AUD">AUD ($)</option>
                <option className="text-black" value="USD">USD ($)</option>
                <option className="text-black" value="EUR">EUR (€)</option>
                <option className="text-black" value="GBP">GBP (£)</option>
              </select>
            </SettingRow>

            <SettingRow label="Service Interval" description="KM between services (default: 10,000 km)">
              <input
                className="h-10 w-40 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-blue-400/50 focus:bg-white/10 transition"
                defaultValue="10000"
                type="number"
              />
            </SettingRow>
          </section>

          {/* Alerts */}
          <section className="mb-6 rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-2xl shadow-black/20 backdrop-blur">
            <p className="mb-1 text-xs uppercase tracking-[0.2em] text-white/40">Notifications</p>
            <h2 className="mb-5 text-xl font-semibold">Alerts</h2>

            <SettingRow label="Rego warning threshold" description="Show warning when rego expires within X days">
              <input
                className="h-10 w-40 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none focus:border-blue-400/50 focus:bg-white/10 transition"
                defaultValue="30"
                type="number"
              />
            </SettingRow>

            <SettingRow label="Insurance warning threshold" description="Show warning when insurance expires within X days">
              <input
                className="h-10 w-40 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none focus:border-blue-400/50 focus:bg-white/10 transition"
                defaultValue="30"
                type="number"
              />
            </SettingRow>
          </section>

          {/* App info */}
          <section className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-2xl shadow-black/20 backdrop-blur">
            <p className="mb-1 text-xs uppercase tracking-[0.2em] text-white/40">About</p>
            <h2 className="mb-5 text-xl font-semibold">App Info</h2>

            <SettingRow label="Version">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/60">v1.0</span>
            </SettingRow>
            <SettingRow label="Database">
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">Supabase · Connected</span>
            </SettingRow>
          </section>

          <div className="mt-6 flex justify-end">
            <button className="h-11 rounded-2xl bg-blue-500 px-6 text-sm font-medium text-white transition hover:bg-blue-400">
              Save settings
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
