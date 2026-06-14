import type { SourceLink } from "@agave/shared";

// integrations: attach attributed deep-links to public wine references.
// CLEAN posture (BUILD_PLAN): official APIs where they exist, otherwise a
// linked, attributed search URL — never bulk-scraped content. Cached on the
// bottle so this runs once per bottle.

export interface IntegrationsEvent {
  brand: string;
  name: string;
  nom?: string;
}

const SOURCES = [
  {
    label: "Wine Matchmaker",
    base: "https://www.winematchmaker.com/search?q=",
  },
  {
    label: "The Wine Report",
    base: "https://www.thewinereport.com/?s=",
  },
];

export const handler = async (
  event: IntegrationsEvent
): Promise<{ sources: SourceLink[] }> => {
  const q = encodeURIComponent(event.name || event.brand);
  const sources: SourceLink[] = SOURCES.map((s) => ({
    label: s.label,
    url: `${s.base}${q}`,
  }));
  // NOTE: when an official API/key is configured, swap the linked search for a
  // direct attributed fact fetch here (respecting robots.txt / ToS).
  return { sources };
};
