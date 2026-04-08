"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Sidebar } from "@/app/components/Sidebar";

type RentalHistoryItem = {
  id: string;
  car_id: string;
  customer_name: string;
  rented_from: string | null;
  rental_days: number | null;
  available_again: string | null;
  returned_on: string | null;
  actual_rental_days: number | null;
  weekly_price: number | null;
  plate_number: string | null;
  car_brand: string | null;
  car_model: string | null;
  created_at: string;
};

const inputStyle =
  "h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-blue-400/50 focus:bg-white/10";

function parseDateSafe(dateString: string | null) {
  if (!dateString) return null;
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatDate(date: string | null) {
  const parsed = parseDateSafe(date);
  if (!parsed) return "—";
  return parsed.toLocaleDateString("en-GB");
}

function calcEarnings(item: RentalHistoryItem): number | null {
  if (!item.weekly_price) return null;
  const days = item.actual_rental_days ?? item.rental_days;
  if (!days) return null;
  return Math.round((item.weekly_price / 7) * days);
}

export default function HistoryPage() {
  const [history, setHistory] = useState<RentalHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    setLoading(true);
    const { data, error } = await supabase
      .from("rentals")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setHistory((data as RentalHistoryItem[]) || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return history.filter(
      (item) =>
        (item.customer_name || "").toLowerCase().includes(s) ||
        (item.car_brand || "").toLowerCase().includes(s) ||
        (item.car_model || "").toLowerCase().includes(s) ||
        (item.plate_number || "").toLowerCase().includes(s)
    );
  }, [history, search]);

  const totalEarnings = useMemo(() => {
    return history.reduce((sum, item) => {
      const e = calcEarnings(item);
      return e ? sum + e : sum;
    }, 0);
  }, [history]);

  const avgDays = useMemo(() => {
    const withDays = history.filter((i) => i.actual_rental_days || i.rental_days);
    if (!withDays.length) return null;
    const total = withDays.reduce((s, i) => s + (i.actual_rental_days ?? i.rental_days ?? 0), 0);
    return Math.round(total / withDays.length);
  }, [history]);

  return (
    <div className="flex min-h-screen bg-[#061224] text-white">
      <Sidebar />

      <div className="flex-1 min-w-0">
        <div className="mx-auto max-w-6xl px-6 py-8 md:px-8">

          {/* Header */}
          <div className="mb-8 flex flex-col gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-300/70">All Rentals</p>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">History</h1>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-[24px] border border-white/10 bg-white/6 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">Total Rentals</p>
              <p className="mt-3 text-4xl font-semibold">{history.length}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/6 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">Total Earned</p>
              <p className="mt-3 text-4xl font-semibold text-emerald-400">
                {totalEarnings > 0 ? `$${totalEarnings.toLocaleString()}` : "—"}
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/6 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">Avg Rental Days</p>
              <p className="mt-3 text-4xl font-semibold text-blue-300">
                {avgDays !== null ? `${avgDays}d` : "—"}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4">
            <input
              className={inputStyle}
              placeholder="Search by customer, car, or plate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* History list */}
          {loading ? (
            <div className="rounded-[28px] border border-white/10 bg-white/6 p-10 text-center text-white/50 backdrop-blur">
              Loading history...
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-[28px] border border-white/10 bg-white/6 p-10 text-center text-white/50 backdrop-blur">
              No rental history found.
            </div>
          ) : (
            <div className="rounded-[28px] border border-white/10 bg-white/6 overflow-hidden shadow-2xl shadow-black/20 backdrop-blur">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/8">
                      <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-[0.18em] text-white/40">Customer</th>
                      <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-[0.18em] text-white/40">Vehicle</th>
                      <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-[0.18em] text-white/40">Rented From</th>
                      <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-[0.18em] text-white/40">Returned</th>
                      <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-[0.18em] text-white/40">Days</th>
                      <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-[0.18em] text-white/40">Earned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/6">
                    {filtered.map((item) => {
                      const earnings = calcEarnings(item);
                      const days = item.actual_rental_days ?? item.rental_days;
                      return (
                        <tr key={item.id} className="hover:bg-white/4 transition">
                          <td className="px-5 py-4">
                            <p className="font-semibold text-white">{item.customer_name}</p>
                            <p className="text-xs text-white/40 mt-0.5">{item.plate_number || "—"}</p>
                          </td>
                          <td className="px-5 py-4 text-white/70">
                            {item.car_brand} {item.car_model}
                          </td>
                          <td className="px-5 py-4 text-white/70">{formatDate(item.rented_from)}</td>
                          <td className="px-5 py-4 text-white/70">
                            {item.returned_on ? (
                              formatDate(item.returned_on)
                            ) : (
                              <span className="text-amber-300/70 text-xs">Not returned</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            {days !== null && days !== undefined ? (
                              <span className="text-white/80">{days}d</span>
                            ) : (
                              <span className="text-white/30">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            {earnings !== null ? (
                              <span className="text-emerald-300 font-medium">${earnings.toLocaleString()}</span>
                            ) : (
                              <span className="text-white/30">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
