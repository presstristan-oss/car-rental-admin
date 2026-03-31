"use client";

type Car = {
  id: number;
  brand: string;
  model: string;
  year: number;
  plate: string;
  color?: string;
  km?: number;
  transmission?: string;
  fuel?: string;
  status?: "available" | "rented" | "maintenance";
  renter?: string;
  rentFrom?: string;
  rentTo?: string;
  regoExpiry?: string;
  insuranceExpiry?: string;
  lastService?: string;
  nextServiceKm?: number;
  notes?: string;
};

export default function CarDetailsModal({
  car,
  onClose,
}: {
  car: Car | null;
  onClose: () => void;
}) {
  if (!car) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {car.brand} {car.model} ({car.year})
          </h2>
          <button onClick={onClose} className="text-gray-500">✕</button>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Car Info</h3>
          <p>Plate: {car.plate}</p>
          <p>Color: {car.color || "-"}</p>
          <p>KM: {car.km || "-"}</p>
          <p>Transmission: {car.transmission || "-"}</p>
          <p>Fuel: {car.fuel || "-"}</p>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Rental Status</h3>
          <p>Status: {car.status}</p>
          {car.status === "rented" && (
            <>
              <p>Renter: {car.renter}</p>
              <p>From: {car.rentFrom}</p>
              <p>To: {car.rentTo}</p>
            </>
          )}
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Rego & Service</h3>
          <p>Rego Expiry: {car.regoExpiry || "-"}</p>
          <p>Insurance Expiry: {car.insuranceExpiry || "-"}</p>
          <p>Last Service: {car.lastService || "-"}</p>
          <p>Next Service KM: {car.nextServiceKm || "-"}</p>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Notes</h3>
          <p className="text-gray-600">{car.notes || "No notes"}</p>
        </div>
      </div>
    </div>
  );
}