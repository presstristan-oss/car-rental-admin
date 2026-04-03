"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Car = {
  id: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  weekly_price: number | null;
  plate_number: string | null;
  customer_name: string | null;
  rented_from: string | null;
  rental_days: number | null;
  status: "available" | "rented" | string;
  created_at?: string;
  rego_expiry: string | null;
  insurance_expiry: string | null;
  odometer_km: number | null;
  last_service_date: string | null;
  last_service_km: number | null;
};

type RentalHistoryItem = {
  id: string;
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
  "h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition focus:border-blue-400/50 focus:bg-white/10";

function parseDateSafe(value?: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatDate(value?: string | null) {
  const date = parseDateSafe(value);
  if (!date) return "—";
  return date.toLocaleDateString("en-GB");
}

function formatKm(value?: number | null) {
  if (value === null || value === undefined) return "—";
  return `${Number(value).toLocaleString()} km`;
}

function addDaysToDateString(dateString: string, days: number) {
  const date = parseDateSafe(dateString);
  if (!date || Number.isNaN(days)) return null;
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function getAvailableAgain(
  rentedFrom?: string | null,
  rentalDays?: number | string | null
) {
  if (!rentedFrom || rentalDays === null || rentalDays === undefined) {
    return "—";
  }

  const days = Number(rentalDays);
  if (Number.isNaN(days)) return "—";

  const date = parseDateSafe(rentedFrom);
  if (!date) return "—";

  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("en-GB");
}

export default function CarDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const carId = params?.id;

  const [car, setCar] = useState<Car | null>(null);
  const [history, setHistory] = useState<RentalHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRental, setEditingRental] = useState<RentalHistoryItem | null>(null);
  const [savingRental, setSavingRental] = useState(false);

  useEffect(() => {
    if (!carId) return;
    fetchAll();
  }, [carId]);

  async function fetchAll() {
    if (!carId) return;

    setLoading(true);

    const [{ data: carData, error: carError }, { data: historyData, error: historyError }] =
      await Promise.all([
        supabase.from("cars").select("*").eq("id", carId).single(),
        supabase
          .from("rentals")
          .select("*")
          .eq("car_id", carId)
          .order("created_at", { ascending: false }),
      ]);

    if (carError || !carData) {
      router.push("/");
      return;
    }

    if (historyError) {
      alert(historyError.message);
    }

    setCar(carData as Car);
    setHistory((historyData as RentalHistoryItem[]) || []);
    setLoading(false);
  }

  const nextServiceKm = useMemo(() => {
    if (!car) return 10000;
    return Number(car.last_service_km || 0) + 10000;
  }, [car]);

  const kmLeft = useMemo(() => {
    if (!car) return 0;
    return nextServiceKm - Number(car.odometer_km || 0);
  }, [car, nextServiceKm]);

  const overdue = kmLeft <= 0;
  const availableAgain = car
    ? getAvailableAgain(car.rented_from, car.rental_days)
    : "—";

  function handleOpenEdit(item: RentalHistoryItem) {
    setEditingRental({
      ...item,
      available_again:
        item.available_again ||
        addDaysToDateString(item.rented_from || "", Number(item.rental_days || 0)),
    });
  }

  async function handleSaveRentalEdit() {
    if (!editingRental) return;

    setSavingRental(true);

    const payload = {
      customer_name: editingRental.customer_name || "",
      rented_from: editingRental.rented_from || null,
      rental_days:
        editingRental.rental_days === null || editingRental.rental_days === undefined
          ? null
          : Number(editingRental.rental_days),
      available_again: editingRental.available_again || null,
      returned_on: editingRental.returned_on || null,
      actual_rental_days:
        editingRental.actual_rental_days === null ||
        editingRental.actual_rental_days === undefined
          ? null
          : Number(editingRental.actual_rental_days),
      weekly_price:
        editingRental.weekly_price === null || editingRental.weekly_price === undefined
          ? null
          : Number(editingRental.weekly_price),
      plate_number: editingRental.plate_number || null,
    };

    const { error } = await supabase
      .from("rentals")
      .update(payload)
      .eq("id", editingRental.id);

    setSavingRental(false);

    if (error) {
      alert(error.message);
      return;
    }

    setEditingRental(null);
    await fetchAll();
  }

  async function handleDeleteRentalHistory(id: string) {
    const confirmed = window.confirm("Delete this rental history entry?");
    if (!confirmed) return;

    const { error } = await supabase.from("rentals").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    if (editingRental?.id === id) {
      setEditingRental(null);
    }

    await fetchAll();
  }

  if (loading || !car) {
    return (
      <main className="min-h-screen bg-[#020f2d] text-white px-6 py-8 md:px-10">
        <div className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-white/5 p-8 text-white/60">
          Loading vehicle details...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020f2d] text-white px-6 py-8 md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-white/50">
              Vehicle details
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              {car.brand || "Car"} {car.model || ""}
            </h1>
          </div>

          <Link
            href="/"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            Back
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-xl font-semibold">Basic info</h2>
            <div className="space-y-3 text-white/85">
              <p><span className="text-white/50">Vehicle ID:</span> {car.id}</p>
              <p><span className="text-white/50">Plate number:</span> {car.plate_number || "—"}</p>
              <p><span className="text-white/50">Year:</span> {car.year || "—"}</p>
              <p><span className="text-white/50">Weekly price:</span> {car.weekly_price ? `$${car.weekly_price}` : "—"}</p>
              <p><span className="text-white/50">Status:</span> {car.status || "—"}</p>
              <p><span className="text-white/50">Odometer:</span> {formatKm(car.odometer_km)}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-xl font-semibold">Registration & insurance</h2>
            <div className="space-y-3 text-white/85">
              <p><span className="text-white/50">Rego expiry:</span> {formatDate(car.rego_expiry)}</p>
              <p><span className="text-white/50">Insurance expiry:</span> {formatDate(car.insurance_expiry)}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-xl font-semibold">Current rental</h2>
            <div className="space-y-3 text-white/85">
              <p><span className="text-white/50">Customer:</span> {car.customer_name || "—"}</p>
              <p><span className="text-white/50">Rented from:</span> {formatDate(car.rented_from)}</p>
              <p><span className="text-white/50">Rental days:</span> {car.rental_days ?? "—"}</p>
              <p><span className="text-white/50">Available again:</span> {availableAgain}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-xl font-semibold">Service info</h2>
            <div className="space-y-3 text-white/85">
              <p><span className="text-white/50">Last service date:</span> {formatDate(car.last_service_date)}</p>
              <p><span className="text-white/50">Last service km:</span> {formatKm(car.last_service_km)}</p>
              <p><span className="text-white/50">Next service due:</span> {formatKm(nextServiceKm)}</p>
              <p>
                <span className="text-white/50">Service status:</span>{" "}
                <span className={overdue ? "text-rose-400" : "text-emerald-400"}>
                  {overdue
                    ? `Overdue by ${Math.abs(kmLeft).toLocaleString()} km`
                    : `${kmLeft.toLocaleString()} km left`}
                </span>
              </p>
              <p className="text-sm text-white/50">Service interval: every 10,000 km</p>
            </div>
          </div>
        </div>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-5">
            <p className="text-sm uppercase tracking-[0.22em] text-white/45">
              Rental history
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Previous rentals</h2>
          </div>

          {history.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/55">
              No rental history yet.
            </div>
          ) : (
            <div className="grid gap-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-[#0b1a2f] p-5"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {item.customer_name}
                      </h3>
                      <p className="mt-1 text-sm text-white/45">
                        {item.car_brand || car.brand} {item.car_model || car.model}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <div className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-sm text-blue-200">
                        Planned: {item.rental_days ?? "—"} days
                      </div>

                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="rounded-full border border-amber-400/20 bg-amber-400/15 px-3 py-1 text-sm text-amber-200 hover:bg-amber-400/25"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDeleteRentalHistory(item.id)}
                        className="rounded-full border border-rose-400/20 bg-rose-500/15 px-3 py-1 text-sm text-rose-200 hover:bg-rose-500/25"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-white/80 md:grid-cols-2 lg:grid-cols-5">
                    <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                        Rented from
                      </p>
                      <p className="mt-2 font-medium">{formatDate(item.rented_from)}</p>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                        Planned end
                      </p>
                      <p className="mt-2 font-medium">
                        {item.available_again
                          ? formatDate(item.available_again)
                          : getAvailableAgain(item.rented_from, item.rental_days)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                        Returned on
                      </p>
                      <p className="mt-2 font-medium">{formatDate(item.returned_on)}</p>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                        Actual days
                      </p>
                      <p className="mt-2 font-medium">
                        {item.actual_rental_days ?? "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                        Weekly price
                      </p>
                      <p className="mt-2 font-medium">
                        {item.weekly_price ? `$${item.weekly_price}` : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-white/55">
                    Plate: {item.plate_number || "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {editingRental && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0b1a2f] p-6 shadow-2xl shadow-black/40">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                  Rental history
                </p>
                <h3 className="mt-2 text-2xl font-semibold">Edit entry</h3>
              </div>

              <button
                onClick={() => setEditingRental(null)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Customer Name">
                <input
                  className={inputStyle}
                  value={editingRental.customer_name || ""}
                  onChange={(e) =>
                    setEditingRental({
                      ...editingRental,
                      customer_name: e.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Plate Number">
                <input
                  className={inputStyle}
                  value={editingRental.plate_number || ""}
                  onChange={(e) =>
                    setEditingRental({
                      ...editingRental,
                      plate_number: e.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Rented From">
                <input
                  type="date"
                  className={inputStyle}
                  value={editingRental.rented_from || ""}
                  onChange={(e) =>
                    setEditingRental({
                      ...editingRental,
                      rented_from: e.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Rental Days">
                <input
                  type="number"
                  className={inputStyle}
                  value={editingRental.rental_days ?? ""}
                  onChange={(e) => {
                    const rentalDays = e.target.value ? Number(e.target.value) : null;
                    const availableAgain =
                      editingRental.rented_from && rentalDays
                        ? addDaysToDateString(editingRental.rented_from, rentalDays)
                        : editingRental.available_again;

                    setEditingRental({
                      ...editingRental,
                      rental_days: rentalDays,
                      available_again: availableAgain || null,
                    });
                  }}
                />
              </Field>

              <Field label="Planned End">
                <input
                  type="date"
                  className={inputStyle}
                  value={editingRental.available_again || ""}
                  onChange={(e) =>
                    setEditingRental({
                      ...editingRental,
                      available_again: e.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Returned On">
                <input
                  type="date"
                  className={inputStyle}
                  value={editingRental.returned_on || ""}
                  onChange={(e) =>
                    setEditingRental({
                      ...editingRental,
                      returned_on: e.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Actual Rental Days">
                <input
                  type="number"
                  className={inputStyle}
                  value={editingRental.actual_rental_days ?? ""}
                  onChange={(e) =>
                    setEditingRental({
                      ...editingRental,
                      actual_rental_days: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                />
              </Field>

              <Field label="Weekly Price">
                <input
                  type="number"
                  className={inputStyle}
                  value={editingRental.weekly_price ?? ""}
                  onChange={(e) =>
                    setEditingRental({
                      ...editingRental,
                      weekly_price: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </Field>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleSaveRentalEdit}
                disabled={savingRental}
                className="h-12 rounded-2xl bg-emerald-500 px-6 font-medium text-white transition hover:bg-emerald-400 disabled:opacity-60"
              >
                {savingRental ? "Saving..." : "Save changes"}
              </button>

              <button
                onClick={() => setEditingRental(null)}
                className="h-12 rounded-2xl border border-white/10 bg-white/5 px-6 font-medium text-white transition hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-white/45">
        {label}
      </span>
      {children}
    </label>
  );
}