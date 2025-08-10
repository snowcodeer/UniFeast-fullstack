import southKensingtonOutlets, { Outlet } from "../data/outletsSouthKensington";

export class LocalOutletService {
  getSouthKensingtonOutlets(): Outlet[] {
    return southKensingtonOutlets;
  }

  findOutletById(id: string): Outlet | undefined {
    return southKensingtonOutlets.find((o) => o.id === id);
  }

  searchOutlets(query: string): Outlet[] {
    const lower = query.trim().toLowerCase();
    if (!lower) return southKensingtonOutlets;
    return southKensingtonOutlets.filter((o) =>
      [o.name, o.description, o.buildingOrArea, ...(o.tags ?? [])]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(lower))
    );
  }
}

export const localOutletService = new LocalOutletService();

