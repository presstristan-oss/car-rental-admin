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
  "h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-blue-400/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10";

const labelStyle =
  "mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-white/45";

function parseDateSafe(dateString: string | null) {
  if (!dateString) return null;
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatDate(date: string | null) {
  const parsed = parseDateSafe(date);
  if (!parsed) return "-";
  return parsed.toLocaleDateString("en-GB");
}

function addDaysToDateString(dateString: string, days: number) {
  const date = parseDateSafe(dateString);
  if (!date || Number.isNaN(days)) return null;
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function getDaysBetweenInclusive(startDate: string, endDate: string) {
  const start = parseDateSafe(startDate);
  const end = parseDateSafe(endDate);
  if (!start || !end) return null;
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 1;
}

function todayDateString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getDaysUntil(dateString: string | null) {
  const target = parseDateSafe(dateString);
  if (!target) return null;
  const today = new Date();
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);
  const diffMs = target.getTime() - todayMid.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function getExpiryStatus(dateString: string | null) {
  const days = getDaysUntil(dateString);
  if (days === null) return { text: "No date set", className: "text-white/45", sortValue: 999999 };
  if (days < 0) return { text: `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`, className: "text-rose-300", sortValue: days };
  if (days === 0) return { text: "Expires today", className: "text-rose-300", sortValue: 0 };
  if (days <= 14) return { text: `${days} day${days === 1 ? "" : "s"} left`, className: "text-rose-300", sortValue: days };
  if (days <= 30) return { text: `${days} day${days === 1 ? "" : "s"} left`, className: "text-amber-300", sortValue: days };
  return { text: `${days} day${days === 1 ? "" : "s"} left`, className: "text-emerald-300", sortValue: days };
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Home() {
  const [cars, setCars] = useState<Car[]>([]);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [price, setPrice] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [rentStartDate, setRentStartDate] = useState("");
  const [rentalDays, setRentalDays] = useState("");
  const [regoExpiry, setRegoExpiry] = useState("");
  const [insuranceExpiry, setInsuranceExpiry] = useState("");
  const [odometerKm, setOdometerKm] = useState("");
  const [lastServiceDate, setLastServiceDate] = useState("");
  const [lastServiceKm, setLastServiceKm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  function resetForm() {
    setBrand(""); setModel(""); setYear(""); setPrice("");
    setPlateNumber(""); setCustomerName(""); setRentStartDate("");
    setRentalDays(""); setRegoExpiry(""); setInsuranceExpiry("");
    setOdometerKm(""); setLastServiceDate(""); setLastServiceKm("");
    setEditingId(null);
  }

  async function archiveRentalToHistory(car: Car, options?: { returnedOn?: string | null; actualRentalDays?: number | null }) {
    if (!car.customer_name || !car.rented_from || !car.rental_days) return;
    const plannedAvailableAgain = addDaysToDateString(car.rented_from, Number(car.rental_days));
    const { error } = await supabase.from("rentals").insert([{
      car_id: car.id,
      customer_name: car.customer_name,
      rented_from: car.rented_from,
      rental_days: car.rental_days,
      available_again: plannedAvailableAgain,
      returned_on: options?.returnedOn || null,
      actual_rental_days: options?.actualRentalDays ?? null,
      weekly_price: car.weekly_price,
      plate_number: car.plate_number,
      car_brand: car.brand,
      car_model: car.model,
    }]);
    if (error) throw new Error(error.message);
  }

  async function handleAddCar() {
    if (!brand || !model || !year || !price) {
      alert("Fill in brand, model, year and weekly price");
      return;
    }
    const { data, error } = await supabase
      .from("cars")
      .insert([{
        brand, model,
        year: Number(year),
        weekly_price: Number(price),
        plate_number: plateNumber || null,
        customer_name: customerName || null,
        rented_from: rentStartDate || null,
        rental_days: rentalDays ? Number(rentalDays) : null,
        rego_expiry: regoExpiry || null,
        insurance_expiry: insuranceExpiry || null,
        odometer_km: odometerKm ? Number(odometerKm) : null,
        last_service_date: lastServiceDate || null,
        last_service_km: lastServiceKm ? Number(lastServiceKm) : null,
        status: customerName || rentStartDate || rentalDays ? "rented" : "available",
      }])
      .select()
      .single();
    if (error) { alert(error.message); return; }
    setCars((prev) => [data as Car, ...prev]);
    resetForm();
  }

  function handleStartEdit(car: Car) {
    setEditingId(car.id);
    setBrand(car.brand); setModel(car.model);
    setYear(String(car.year)); setPrice(String(car.weekly_price));
    setPlateNumber(car.plate_number || "");
    setCustomerName(car.customer_name || "");
    setRentStartDate(car.rented_from || "");
    setRentalDays(car.rental_days ? String(car.rental_days) : "");
    setRegoExpiry(car.rego_expiry || "");
    setInsuranceExpiry(car.insurance_expiry || "");
    setOdometerKm(car.odometer_km !== null && car.odometer_km !== undefined ? String(car.odometer_km) : "");
    setLastServiceDate(car.last_service_date || "");
    setLastServiceKm(car.last_service_km !== null && car.last_service_km !== undefined ? String(car.last_service_km) : "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleUpdateCar() {
    if (!editingId) return;
    const existingCar = cars.find((car) => car.id === editingId);
    const nextCustomerName = customerName || null;
    const nextRentStartDate = rentStartDate || null;
    const nextRentalDays = rentalDays ? Number(rentalDays) : null;
    const nextStatus = customerName || rentStartDate || rentalDays ? "rented" : "available";
    const existingHasRental = existingCar?.status === "rented" && !!existingCar.customer_name && !!existingCar.rented_from && existingCar.rental_days !== null && existingCar.rental_days !== undefined;
    const rentalChanged = !!existingCar && (existingCar.customer_name !== nextCustomerName || existingCar.rented_from !== nextRentStartDate || Number(existingCar.rental_days || 0) !== Number(nextRentalDays || 0));
    try {
      if (existingCar && existingHasRental && (nextStatus === "available" || rentalChanged)) {
        const returnedOn = todayDateString();
        const actualRentalDays = existingCar.rented_from ? getDaysBetweenInclusive(existingCar.rented_from, returnedOn) : null;
        await archiveRentalToHistory(existingCar, { returnedOn, actualRentalDays });
      }
    } catch (err: any) {
      alert(err.message || "Failed to save rental history");
      return;
    }
    const { data, error } = await supabase
      .from("cars")
      .update({
        brand, model,
        year: Number(year),
        weekly_price: Number(price),
        plate_number: plateNumber || null,
        customer_name: nextCustomerName,
        rented_from: nextRentStartDate,
        rental_days: nextRentalDays,
        rego_expiry: regoExpiry || null,
        insurance_expiry: insuranceExpiry || null,
        odometer_km: odometerKm ? Number(odometerKm) : null,
        last_service_date: lastServiceDate || null,
        last_service_km: lastServiceKm ? Number(lastServiceKm) : null,
        status: nextStatus,
      })
      .eq("id", editingId)
      .select()
      .single();
    if (error) { alert(error.message); return; }
    setCars((prev) => prev.map((car) => (car.id === editingId ? (data as Car) : car)));
    resetForm();
  }

  async function handleDeleteCar(id: string) {
    const confirmed = window.confirm("Delete this car?");
    if (!confirmed) return;
    const { error } = await supabase.from("cars").delete().eq("id", id);
    if (error) { alert(error.message); return; }
    setCars((prev) => prev.filter((car) => car.id !== id));
    if (editingId === id) resetForm();
  }

  async function handleToggleStatus(car: Car) {
    const nextStatus = car.status === "rented" ? "available" : "rented";
    try {
      if (nextStatus === "available") {
        const confirmed = window.confirm("Mark this car as returned now? This will save the current rental to history.");
        if (!confirmed) return;
        const returnedOn = todayDateString();
        const actualRentalDays = car.rented_from && car.rental_days ? getDaysBetweenInclusive(car.rented_from, returnedOn) : null;
        await archiveRentalToHistory(car, { returnedOn, actualRentalDays });
      }
    } catch (err: any) {
      alert(err.message || "Failed to save rental history");
      return;
    }
    const updates = nextStatus === "available"
      ? { status: "available", customer_name: null, rented_from: null, rental_days: null }
      : { status: "rented" };
    const { data, error } = await supabase.from("cars").update(updates).eq("id", car.id).select().single();
    if (error) { alert(error.message); return; }
    setCars((prev) => prev.map((c) => (c.id === (data as Car).id ? (data as Car) : c)));
  }

  const filteredCars = useMemo(() => {
    const filtered = cars.filter((car) => {
      const s = search.toLowerCase();
      const matchesSearch =
        car.brand.toLowerCase().includes(s) ||
        car.model.toLowerCase().includes(s) ||
        (car.customer_name || "").toLowerCase().includes(s) ||
        (car.plate_number || "").toLowerCase().includes(s);
      const matchesStatus = filterStatus === "all" || car.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
    return filtered.sort((a, b) => {
      const regoA = getExpiryStatus(a.rego_expiry).sortValue;
      const regoB = getExpiryStatus(b.rego_expiry).sortValue;
      if (regoA !== regoB) return regoA - regoB;
      return getExpiryStatus(a.insurance_expiry).sortValue - getExpiryStatus(b.insurance_expiry).sortValue;
    });
  }, [cars, search, filterStatus]);

  // Urgent cars: rego or insurance expiring within 30 days
  const urgentCars = useMemo(() => {
    return cars.filter((car) => {
      const regoDays = getDaysUntil(car.rego_expiry);
      const insuranceDays = getDaysUntil(car.insurance_expiry);
      return (regoDays !== null && regoDays <= 30) || (insuranceDays !== null && insuranceDays <= 30);
    });
  }, [cars]);

  const totalCars = cars.length;
  const availableCars = cars.filter((c) => c.status === "available").length;
  const rentedCars = cars.filter((c) => c.status === "rented").length;

  function getAvailableAgain(car: Car) {
    if (!car.rented_from || !car.rental_days) return "-";
    const date = parseDateSafe(car.rented_from);
    if (!date) return "-";
    date.setDate(date.getDate() + Number(car.rental_days));
    return date.toLocaleDateString("en-GB");
  }

  function getServiceStatus(car: Car) {
    if (car.odometer_km === null || car.odometer_km === undefined || car.last_service_km === null || car.last_service_km === undefined) {
      return { text: "No service data", className: "text-white/45" };
    }
    const nextServiceKm = car.last_service_km + 10000;
    const kmLeft = nextServiceKm - car.odometer_km;
    if (kmLeft <= 0) return { text: `Service overdue by ${Math.abs(kmLeft).toLocaleString()} km`, className: "text-rose-300" };
    if (kmLeft <= 1000) return { text: `Service due in ${kmLeft.toLocaleString()} km`, className: "text-amber-300" };
    return { text: `${kmLeft.toLocaleString()} km until service`, className: "text-emerald-300" };
  }

  return (
    <div className="flex min-h-screen bg-[#061224] text-white">
      {/* ── Sidebar ── */}
      <Sidebar />

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0">
        <div className="mx-auto max-w-6xl px-6 py-8 md:px-8">

          {/* ── Alert Banner ── */}
          {urgentCars.length > 0 && (
            <div className="mb-6 rounded-[20px] border border-rose-400/25 bg-rose-500/8 px-5 py-4">
              <div className="flex items-start gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-300 mt-0.5 shrink-0">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-rose-300">
                    {urgentCars.length} car{urgentCars.length > 1 ? "s" : ""} need{urgentCars.length === 1 ? "s" : ""} attention
                  </p>
                  <p className="mt-0.5 text-xs text-white/50">Rego or insurance expiring within 30 days</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {urgentCars.map((car) => {
                      const regoDays = getDaysUntil(car.rego_expiry);
                      const insDays = getDaysUntil(car.insurance_expiry);
                      const isUrgentRego = regoDays !== null && regoDays <= 30;
                      const isUrgentIns = insDays !== null && insDays <= 30;
                      return (
                        <span key={car.id} className="text-xs text-rose-200 bg-rose-500/12 border border-rose-400/20 rounded-full px-3 py-1">
                          {car.brand} {car.model}
                          {isUrgentRego && ` · Rego: ${regoDays !== null && regoDays < 0 ? "expired" : `${regoDays}d`}`}
                          {isUrgentIns && ` · Insurance: ${insDays !== null && insDays < 0 ? "expired" : `${insDays}d`}`}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Page header ── */}
          <div className="mb-8 flex flex-col gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-300/70">Car Rental Admin</p>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">RoadQuest Cars</h1>
          </div>

          {/* ── Form + Stats ── */}
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-2xl shadow-black/20 backdrop-blur">
              {/* Form header */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                    {editingId ? "Update existing car" : "Create new entry"}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">{editingId ? "Edit car" : "Add new car"}</h2>
                </div>
                {editingId && (
                  <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300">
                    Editing
                  </span>
                )}
              </div>

              {/* ── Section 1: Vehicle Details ── */}
              <FormSection title="Vehicle Details">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  <Field label="Brand"><input className={inputStyle} placeholder="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} /></Field>
                  <Field label="Model"><input className={inputStyle} placeholder="Model" value={model} onChange={(e) => setModel(e.target.value)} /></Field>
                  <Field label="Year"><input className={inputStyle} placeholder="Year" type="number" value={year} onChange={(e) => setYear(e.target.value)} /></Field>
                  <Field label="Weekly Price"><input className={inputStyle} placeholder="Weekly Price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
                  <Field label="Plate Number"><input className={inputStyle} placeholder="Plate Number" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} /></Field>
                </div>
              </FormSection>

              {/* ── Section 2: Rental Information ── */}
              <FormSection title="Rental Information">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  <Field label="Customer Name"><input className={inputStyle} placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></Field>
                  <Field label="Rented From"><input className={inputStyle} type="date" value={rentStartDate} onChange={(e) => setRentStartDate(e.target.value)} /></Field>
                  <Field label="Rental Days"><input className={inputStyle} placeholder="Rental Days" type="number" value={rentalDays} onChange={(e) => setRentalDays(e.target.value)} /></Field>
                </div>
              </FormSection>

              {/* ── Section 3: Maintenance & Compliance ── */}
              <FormSection title="Maintenance & Compliance">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  <Field label="Rego Expiry"><input className={inputStyle} type="date" value={regoExpiry} onChange={(e) => setRegoExpiry(e.target.value)} /></Field>
                  <Field label="Insurance Expiry"><input className={inputStyle} type="date" value={insuranceExpiry} onChange={(e) => setInsuranceExpiry(e.target.value)} /></Field>
                  <Field label="Odometer KM"><input className={inputStyle} placeholder="Odometer KM" type="number" value={odometerKm} onChange={(e) => setOdometerKm(e.target.value)} /></Field>
                  <Field label="Last Service Date"><input className={inputStyle} type="date" value={lastServiceDate} onChange={(e) => setLastServiceDate(e.target.value)} /></Field>
                  <Field label="Last Service KM"><input className={inputStyle} placeholder="Last Service KM" type="number" value={lastServiceKm} onChange={(e) => setLastServiceKm(e.target.value)} /></Field>
                </div>
              </FormSection>

              {/* Buttons */}
              <div className="mt-6 flex flex-wrap gap-3">
                {editingId ? (
                  <>
                    <button onClick={handleUpdateCar} className="h-12 rounded-2xl bg-amber-400 px-6 font-medium text-slate-950 transition hover:bg-amber-300">Update car</button>
                    <button onClick={resetForm} className="h-12 rounded-2xl border border-white/10 bg-white/5 px-6 font-medium text-white transition hover:bg-white/10">Cancel</button>
                  </>
                ) : (
                  <button onClick={handleAddCar} className="h-12 rounded-2xl bg-blue-500 px-6 font-medium text-white transition hover:bg-blue-400">Add car</button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
              <StatCard label="Total Cars" value={String(totalCars)} helper="All vehicles in your system" />
              <StatCard label="Available" value={String(availableCars)} helper="Ready for the next booking" valueClassName="text-emerald-400" />
              <StatCard label="Rented" value={String(rentedCars)} helper="Currently out with customers" valueClassName="text-rose-400" />
            </div>
          </div>

          {/* ── Fleet overview + Search/Filter ── */}
          <div className="mt-6 rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Search and control</p>
                <h3 className="mt-2 text-2xl font-semibold">Fleet overview</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px]">
              <input className={inputStyle} placeholder="Search by brand, model, plate or customer" value={search} onChange={(e) => setSearch(e.target.value)} />
              <select className={inputStyle} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all" className="text-black">All</option>
                <option value="available" className="text-black">Available</option>
                <option value="rented" className="text-black">Rented</option>
              </select>
            </div>
          </div>

          {/* ── Car cards ── */}
          <div className="mt-6">
            {loading ? (
              <div className="rounded-[28px] border border-white/10 bg-white/6 p-10 text-center text-white/60 backdrop-blur">Loading cars...</div>
            ) : filteredCars.length === 0 ? (
              <div className="rounded-[28px] border border-white/10 bg-white/6 p-10 text-center text-white/60 backdrop-blur">No cars found.</div>
            ) : (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
                {filteredCars.map((car) => {
                  const serviceStatus = getServiceStatus(car);
                  const regoStatus = getExpiryStatus(car.rego_expiry);
                  const insuranceStatus = getExpiryStatus(car.insurance_expiry);
                  const isExpanded = expandedId === car.id;

                  return (
                    <div key={car.id} className="rounded-[28px] border border-white/10 bg-[#0b1a2f] p-6 shadow-2xl shadow-black/20 transition hover:-translate-y-0.5 hover:border-white/15">

                      {/* Car name and status badge */}
                      <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-2xl font-semibold text-white">{car.brand} {car.model}</h4>
                          <p className="mt-1 text-sm text-white/40">{car.year} · {car.plate_number || "No plate"}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${car.status === "rented" ? "bg-rose-400/12 text-rose-300 ring-1 ring-rose-400/20" : "bg-emerald-400/12 text-emerald-300 ring-1 ring-emerald-400/20"}`}>
                          {car.status === "rented" ? "Rented" : "Available"}
                        </span>
                      </div>

                      {/* Always visible: price and customer */}
                      <div className="grid grid-cols-2 gap-3">
                        <InfoBox label="Weekly Price" value={`$${car.weekly_price}`} />
                        <InfoBox label="Customer" value={car.customer_name || "—"} />
                      </div>

                      {/* Expiry warning badges */}
                      {(regoStatus.sortValue < 30 || insuranceStatus.sortValue < 30) && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {regoStatus.sortValue < 30 && (
                            <span className={`rounded-full border border-white/10 px-3 py-1 text-xs ${regoStatus.className}`}>
                              Rego: {regoStatus.text}
                            </span>
                          )}
                          {insuranceStatus.sortValue < 30 && (
                            <span className={`rounded-full border border-white/10 px-3 py-1 text-xs ${insuranceStatus.className}`}>
                              Insurance: {insuranceStatus.text}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Show/hide details toggle */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : car.id)}
                        className="mt-4 w-full rounded-2xl border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white/50 hover:bg-white/8 hover:text-white/80 transition text-left flex items-center justify-between"
                      >
                        <span>{isExpanded ? "Hide details" : "Show details"}</span>
                        <span className="text-white/30">{isExpanded ? "▲" : "▼"}</span>
                      </button>

                      {/* Expandable details */}
                      {isExpanded && (
                        <div className="mt-3 space-y-3">
                          <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                            <div className="grid gap-2 text-sm">
                              <DetailRow label="Rented from" value={formatDate(car.rented_from)} />
                              <DetailRow label="Rental days" value={car.rental_days ? String(car.rental_days) : "-"} />
                              <DetailRow label="Available again" value={getAvailableAgain(car)} />
                              <DetailRow label="Odometer" value={car.odometer_km !== null && car.odometer_km !== undefined ? `${car.odometer_km.toLocaleString()} km` : "-"} />
                            </div>
                          </div>

                          <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-white/35">Rego</p>
                            <p className="mt-2 text-sm font-medium text-white">{formatDate(car.rego_expiry)}</p>
                            <p className={`mt-1 text-sm ${regoStatus.className}`}>{regoStatus.text}</p>
                          </div>

                          <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-white/35">Insurance</p>
                            <p className="mt-2 text-sm font-medium text-white">{formatDate(car.insurance_expiry)}</p>
                            <p className={`mt-1 text-sm ${insuranceStatus.className}`}>{insuranceStatus.text}</p>
                          </div>

                          <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-white/35">Service</p>
                            <p className={`mt-2 text-sm font-medium ${serviceStatus.className}`}>{serviceStatus.text}</p>
                            <p className="mt-2 text-xs text-white/40">Interval: every 10,000 km</p>
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="mt-5 flex flex-wrap gap-2">
                        <Link href={`/cars/${car.id}`} className="rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-2.5 text-sm font-medium text-blue-200 transition hover:bg-blue-500/20">
                          View details
                        </Link>
                        <button onClick={() => handleStartEdit(car)} className="rounded-2xl bg-amber-400 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-amber-300">
                          Edit
                        </button>
                        <button onClick={() => handleToggleStatus(car)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10">
                          {car.status === "rented" ? "Return car" : "Mark rented"}
                        </button>
                        <button onClick={() => handleDeleteCar(car.id)} className="rounded-2xl bg-rose-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-400">
                          Delete
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="mb-4 flex items-center gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300/70">{title}</p>
        <div className="flex-1 border-t border-white/8" />
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span className={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

function StatCard({ label, value, helper, valueClassName = "text-white" }: { label: string; value: string; helper: string; valueClassName?: string }) {
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
      <p className="mt-2 text-lg font-semibold text-white truncate">{value}</p>
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
