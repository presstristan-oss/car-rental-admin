"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Sidebar } from "@/app/components/Sidebar";

type Car = {
  id: string;
  brand: string;
  model: string;
  year: number;
  weekly_price: number;
  plate_number: string | null;
  customer_name: string | null;
  rented_from: string | null;
  rental_days: number | null;
  status: "available" | "rented";
  created_at?: string;
  rego_expiry: string | null;
  insurance_expiry: string | null;
  odometer_km: number | null;
  last_service_date: string | null;
  last_service_km: number | null;
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

function getDaysUntil(dateString: string | null) {
  const target = parseDateSafe(dateString);
  if (!target) return null;
  const today = new Date();
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);
  return Math.ceil((target.getTime() - todayMid.getTime()) / (1000 * 60 * 60 * 24));
}

function expiryBadge(dateString: string | null) {
  const days = getDaysUntil(dateString);
  if (days === null) return <span className="text-white/30">—</span>;
  if (days < 0) return <span className="text-rose-300 font-medium">Expired</span>;
  if (days <= 14) return <span className="text-rose-300 font-medium">{days}d left</span>;
  if (days <= 30) return <span className="text-amber-300 font-medium">{days}d left</span>;
  return <span className="text-white/60">{formatDate(dateString)}</span>;
}

export default function FleetPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchCars();
  }, []);

  async function fetchCars() {
    setLoading(true);
    const { data, error } = await supabase
      .from("cars")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setCars((data as Car[]) || []);
    setLoading(false);
  }

  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      const s = search.toLowerCase();
      const matchesSearch =
        car.brand.toLowerCase().includes(s) ||
        car.model.toLowerCase().includes(s) ||
        (car.customer_name || "").toLowerCase().includes(s) ||
        (car.plate_number || "").toLowerCase().includes(s);
      const matchesStatus = filterStatus === "all" || car.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [cars, search, filterStatus]);

  const totalCars = cars.length;
  const availableCars = cars.filter((c) => c.status === "available").length;
  const rentedCars = cars.filter((c) => c.status === "rented").length;

  return (
    <div className="flex min-h-screen bg-[#061224] text-white">
      <Sidebar />

      <div className="flex-1 min-w-0">
        <div className="mx-auto max-w-6xl px-6 py-8 md:px-8">

          {/* Header */}
          <div className="mb-8 flex flex-col gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-300/70">Fleet Management</p>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Fleet</h1>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-[24px] border border-white/10 bg-white/6 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">Total</p>
              <p className="mt-3 text-4xl font-semibold">{totalCars}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/6 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">Available</p>
              <p className="mt-3 text-4xl font-semibold text-emerald-400">{availableCars}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/6 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">Rented</p>
              <p className="mt-3 text-4xl font-semibold text-rose-400">{rentedCars}</p>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_200px]">
            <input
              className={inputStyle}
              placeholder="Search by brand, model, plate or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className={inputStyle} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all" className="text-black">All statuses</option>
              <option value="available" className="text-black">Available</option>
              <option value="rented" className="text-black">Rented</option>
            </select>
          </div>

          {/* Table */}
          <div className="rounded-[28px] border border-white/10 bg-white/6 overflow-hidden shadow-2xl shadow-black/20 backdrop-blur">
            {loading ? (
              <div className="p-10 text-center text-white/50">Loading fleet...</div>
            ) : filteredCars.length === 0 ? (
              <div className="p-10 text-center text-white/50">No cars found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/8">
                      <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-[0.18em] text-white/40">Vehicle</th>
                      <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-[0.18em] text-white/40">Plate</th>
                      <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-[0.18em] text-white/40">Status</th>
                      <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-[0.18em] text-white/40">Customer</th>
                      <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-[0.18em] text-white/40">Weekly</th>
                      <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-[0.18em] text-white/40">Rego</th>
                      <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-[0.18em] text-white/40">Insurance</th>
                      <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-[0.18em] text-white/40"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/6">
                    {filteredCars.map((car) => (
                      <tr key={car.id} className="hover:bg-white/4 transition">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-white">{car.brand} {car.model}</p>
                          <p className="text-xs text-white/40 mt-0.5">{car.year}</p>
                        </td>
                        <td className="px-5 py-4 text-white/70">{car.plate_number || "—"}</td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${car.status === "rented" ? "bg-rose-400/12 text-rose-300 ring-1 ring-rose-400/20" : "bg-emerald-400/12 text-emerald-300 ring-1 ring-emerald-400/20"}`}>
                            {car.status === "rented" ? "Rented" : "Available"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-white/70">{car.customer_name || "—"}</td>
                        <td className="px-5 py-4 text-white/70">${car.weekly_price}</td>
                        <td className="px-5 py-4">{expiryBadge(car.rego_expiry)}</td>
                        <td className="px-5 py-4">{expiryBadge(car.insurance_expiry)}</td>
                        <td className="px-5 py-4">
                          <Link
                            href={`/cars/${car.id}`}
                            className="rounded-xl border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-200 transition hover:bg-blue-500/20 whitespace-nowrap"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add car shortcut */}
          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-white/40 hover:text-white/70 transition">
              ← Go to Dashboard to add a new car
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
