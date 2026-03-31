"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Car = {
  id: string;
  brand: string;
  model: string;
  year: number;
  daily_price: number;
  customer_name: string | null;
  rented_from: string | null;
  rental_days: number | null;
  status: "available" | "rented";
  created_at?: string;
};

const inputStyle =
  "h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-blue-400/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10";

export default function Home() {
  const [cars, setCars] = useState<Car[]>([]);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [price, setPrice] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [rentStartDate, setRentStartDate] = useState("");
  const [rentalDays, setRentalDays] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCars();
  }, []);

  async function fetchCars() {
    setLoading(true);

    const { data, error } = await supabase
      .from("cars")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setCars((data as Car[]) || []);
    }

    setLoading(false);
  }

  function resetForm() {
    setBrand("");
    setModel("");
    setYear("");
    setPrice("");
    setCustomerName("");
    setRentStartDate("");
    setRentalDays("");
    setEditingId(null);
  }

  async function handleAddCar() {
    if (!brand || !model || !year || !price) {
      alert("Fill in brand, model, year and daily price");
      return;
    }

    const { data, error } = await supabase
      .from("cars")
      .insert([
        {
          brand,
          model,
          year: Number(year),
          daily_price: Number(price),
          customer_name: customerName || null,
          rented_from: rentStartDate || null,
          rental_days: rentalDays ? Number(rentalDays) : null,
          status:
            customerName || rentStartDate || rentalDays
              ? "rented"
              : "available",
        },
      ])
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setCars((prev) => [data as Car, ...prev]);
    resetForm();
  }

  function handleStartEdit(car: Car) {
    setEditingId(car.id);
    setBrand(car.brand);
    setModel(car.model);
    setYear(String(car.year));
    setPrice(String(car.daily_price));
    setCustomerName(car.customer_name || "");
    setRentStartDate(car.rented_from || "");
    setRentalDays(car.rental_days ? String(car.rental_days) : "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleUpdateCar() {
    if (!editingId) return;

    const { data, error } = await supabase
      .from("cars")
      .update({
        brand,
        model,
        year: Number(year),
        daily_price: Number(price),
        customer_name: customerName || null,
        rented_from: rentStartDate || null,
        rental_days: rentalDays ? Number(rentalDays) : null,
        status:
          customerName || rentStartDate || rentalDays
            ? "rented"
            : "available",
      })
      .eq("id", editingId)
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setCars((prev) =>
      prev.map((car) => (car.id === editingId ? (data as Car) : car))
    );

    resetForm();
  }

  async function handleDeleteCar(id: string) {
    const confirmed = window.confirm("Delete this car?");
    if (!confirmed) return;

    const { error } = await supabase.from("cars").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setCars((prev) => prev.filter((car) => car.id !== id));

    if (editingId === id) {
      resetForm();
    }
  }

  async function handleToggleStatus(car: Car) {
    const nextStatus = car.status === "rented" ? "available" : "rented";

    const updates =
      nextStatus === "available"
        ? {
            status: "available",
            customer_name: null,
            rented_from: null,
            rental_days: null,
          }
        : {
            status: "rented",
          };

    const { data, error } = await supabase
      .from("cars")
      .update(updates)
      .eq("id", car.id)
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setCars((prev) =>
      prev.map((c) => (c.id === (data as Car).id ? (data as Car) : c))
    );
  }

  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      const s = search.toLowerCase();

      const matchesSearch =
        car.brand.toLowerCase().includes(s) ||
        car.model.toLowerCase().includes(s) ||
        (car.customer_name || "").toLowerCase().includes(s);

      const matchesStatus =
        filterStatus === "all" || car.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [cars, search, filterStatus]);

  const totalCars = cars.length;
  const availableCars = cars.filter((c) => c.status === "available").length;
  const rentedCars = cars.filter((c) => c.status === "rented").length;

  function getAvailableAgain(car: Car) {
    if (!car.rented_from || !car.rental_days) return "-";
    const date = new Date(car.rented_from);
    date.setDate(date.getDate() + car.rental_days);
    return date.toLocaleDateString("en-GB");
  }

  function formatDate(date: string | null) {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-GB");
  }

  return (
    <div className="min-h-screen bg-[#061224] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-8">
        <div className="mb-8 flex flex-col gap-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-300/70">
            Car Rental Admin
          </p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Fleet dashboard
          </h1>
          <p className="max-w-2xl text-sm text-white/55 md:text-base">
            Manage inventory, track rentals, update car availability and keep
            your fleet organized in one place.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                  {editingId ? "Update existing car" : "Create new entry"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  {editingId ? "Edit car" : "Add new car"}
                </h2>
              </div>
              {editingId ? (
                <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300">
                  Editing
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <input
                className={inputStyle}
                placeholder="Brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
              <input
                className={inputStyle}
                placeholder="Model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
              <input
                className={inputStyle}
                placeholder="Year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
              <input
                className={inputStyle}
                placeholder="Daily Price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <input
                className={inputStyle}
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <input
                className={inputStyle}
                type="date"
                value={rentStartDate}
                onChange={(e) => setRentStartDate(e.target.value)}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
              <input
                className={inputStyle}
                placeholder="Rental Days"
                type="number"
                value={rentalDays}
                onChange={(e) => setRentalDays(e.target.value)}
              />

              <div className="flex flex-wrap gap-3">
                {editingId ? (
                  <>
                    <button
                      onClick={handleUpdateCar}
                      className="h-12 rounded-2xl bg-amber-400 px-6 font-medium text-slate-950 transition hover:bg-amber-300"
                    >
                      Update car
                    </button>
                    <button
                      onClick={resetForm}
                      className="h-12 rounded-2xl border border-white/10 bg-white/5 px-6 font-medium text-white transition hover:bg-white/10"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleAddCar}
                    className="h-12 rounded-2xl bg-blue-500 px-6 font-medium text-white transition hover:bg-blue-400"
                  >
                    Add car
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <StatCard
              label="Total Cars"
              value={String(totalCars)}
              helper="All vehicles in your system"
            />
            <StatCard
              label="Available"
              value={String(availableCars)}
              helper="Ready for the next booking"
              valueClassName="text-emerald-400"
            />
            <StatCard
              label="Rented"
              value={String(rentedCars)}
              helper="Currently out with customers"
              valueClassName="text-rose-400"
            />
          </div>
        </div>

        <div className="mt-6 rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                Search and control
              </p>
              <h3 className="mt-2 text-2xl font-semibold">Fleet overview</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px]">
            <input
              className={inputStyle}
              placeholder="Search by brand, model or customer"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className={inputStyle}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all" className="text-black">
                All
              </option>
              <option value="available" className="text-black">
                Available
              </option>
              <option value="rented" className="text-black">
                Rented
              </option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="rounded-[28px] border border-white/10 bg-white/6 p-10 text-center text-white/60 backdrop-blur">
              Loading cars...
            </div>
          ) : filteredCars.length === 0 ? (
            <div className="rounded-[28px] border border-white/10 bg-white/6 p-10 text-center text-white/60 backdrop-blur">
              No cars found.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {filteredCars.map((car) => (
                <div
                  key={car.id}
                  className="rounded-[28px] border border-white/10 bg-[#0b1a2f] p-6 shadow-2xl shadow-black/20 transition hover:-translate-y-0.5 hover:border-white/15"
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-2xl font-semibold text-white">
                        {car.brand} {car.model}
                      </h4>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/35">
                        Vehicle ID
                      </p>
                      <p className="mt-1 break-all text-sm text-white/55">
                        {car.id}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                        car.status === "rented"
                          ? "bg-rose-400/12 text-rose-300 ring-1 ring-rose-400/20"
                          : "bg-emerald-400/12 text-emerald-300 ring-1 ring-emerald-400/20"
                      }`}
                    >
                      {car.status === "rented" ? "Rented" : "Available"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <InfoBox label="Year" value={String(car.year)} />
                    <InfoBox label="Daily Price" value={`$${car.daily_price}`} />
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/8 bg-white/4 p-4">
                    <div className="grid gap-2 text-sm">
                      <DetailRow label="Customer" value={car.customer_name || "-"} />
                      <DetailRow label="Rented from" value={formatDate(car.rented_from)} />
                      <DetailRow
                        label="Rental days"
                        value={car.rental_days ? String(car.rental_days) : "-"}
                      />
                      <DetailRow
                        label="Available again"
                        value={getAvailableAgain(car)}
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleStartEdit(car)}
                      className="rounded-2xl bg-amber-400 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-amber-300"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleToggleStatus(car)}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                    >
                      Mark {car.status === "rented" ? "available" : "rented"}
                    </button>

                    <button
                      onClick={() => handleDeleteCar(car.id)}
                      className="rounded-2xl bg-rose-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
  valueClassName = "text-white",
}: {
  label: string;
  value: string;
  helper: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-2xl shadow-black/20 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.2em] text-white/45">{label}</p>
      <p className={`mt-4 text-5xl font-semibold ${valueClassName}`}>{value}</p>
      <p className="mt-3 text-sm text-white/45">{helper}</p>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/35">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-white/45">{label}</span>
      <span className="text-right font-medium text-white">{value}</span>
    </div>
  );
}