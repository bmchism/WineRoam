// Format utilities for Wine Roam.

// Format a vintage year (returns empty string for NV wines).
export function formatVintage(vintage?: number): string {
  return vintage ? String(vintage) : "NV";
}

// Clean up a region string for display.
export function cleanRegion(region: string): string {
  return region.trim();
}

// Keep cleanNom as a no-op for backward compatibility during transition.
export function cleanNom(val: string): string {
  return val.trim();
}
