import type { Bottle } from "../types";

// Generates a host talk-track + a step-by-step sensory ritual from a bottle, so
// the host has something fun to say and the room has a guided ritual to follow.

export function hostScript(b: Bottle, pour: number, total: number): string[] {
  const lines: string[] = [];
  const typeLabel = b.wineType.toLowerCase();
  const vintageStr = b.vintage ? ` ${b.vintage}` : "";
  lines.push(
    `Pour ${pour} of ${total} — this is ${b.name}${vintageStr}, a ${typeLabel} from ${b.region}, at ${b.abv}%.`
  );
  if (b.story) lines.push(b.story);
  if (b.grapes && b.grapes.length) {
    lines.push(`Made from ${b.grapes.join(", ")}${b.aging ? `, aged in ${b.aging.toLowerCase()}` : ""}.`);
  }
  const nose = b.aromas.slice(0, 3).join(", ");
  const palate = b.flavors.slice(0, 3).join(", ");
  if (nose) lines.push(`On the nose, hunt for ${nose}. On the palate, look for ${palate}.`);
  lines.push(`Pour about two ounces each. Don't rush it — let's taste together.`);
  return lines;
}

export interface RitualStep {
  key: string;
  emoji: string;
  title: string;
  say: string;
  hunt?: string[];
}

export function ritualSteps(b: Bottle): RitualStep[] {
  return [
    { key: "look", emoji: "👁️", title: "Appearance", say: "Tilt the glass over a white surface. Note the color intensity and hue — is it pale or deep? Purple-rimmed or garnet?" },
    { key: "swirl", emoji: "🌀", title: "Swirl", say: "Give it a gentle swirl and watch the legs slide down. Thicker, slower legs hint at body and alcohol." },
    { key: "smell", emoji: "👃", title: "Nose", say: "Cup the glass and take a slow sniff with lips slightly parted. Can you find these?", hunt: b.aromas.slice(0, 5) },
    { key: "sip", emoji: "👅", title: "Palate", say: "Take a sip and let it coat your whole mouth. Notice sweetness, acidity, tannin, and body.", hunt: b.flavors.slice(0, 5) },
    { key: "finish", emoji: "⏱️", title: "Finish", say: "Now wait. How long does the flavor linger — short and clean, or long and complex?" },
  ];
}
