// Wine flavor vocabulary + a tappable chip wheel. Used by the tasting
// guide (Learn) and the notes/review editor (quick-add flavors).
export interface FlavorGroup {
  label: string;
  color: string;
  notes: string[];
}
export const FLAVOR_GROUPS: FlavorGroup[] = [
  { label: "Red Fruit", color: "#C0392B", notes: ["Cherry", "Raspberry", "Strawberry", "Cranberry", "Pomegranate"] },
  { label: "Dark Fruit", color: "#6C3461", notes: ["Blackberry", "Plum", "Cassis", "Blueberry", "Fig"] },
  { label: "Citrus", color: "#C9A24B", notes: ["Lemon", "Lime", "Grapefruit", "Orange Peel", "Mandarin"] },
  { label: "Tropical", color: "#E67E22", notes: ["Passionfruit", "Pineapple", "Mango", "Lychee", "Guava"] },
  { label: "Stone Fruit", color: "#F5B041", notes: ["Peach", "Apricot", "Nectarine", "Plum"] },
  { label: "Floral", color: "#E8A0BF", notes: ["Rose", "Violet", "Jasmine", "Elderflower", "Blossom"] },
  { label: "Herbal", color: "#5c7a5a", notes: ["Mint", "Eucalyptus", "Thyme", "Sage", "Bay Leaf"] },
  { label: "Spice", color: "#8B4513", notes: ["Black Pepper", "Cinnamon", "Clove", "Vanilla", "Nutmeg", "Licorice"] },
  { label: "Earth", color: "#6B5D4A", notes: ["Leather", "Tobacco", "Truffle", "Mushroom", "Wet Stone", "Forest Floor"] },
  { label: "Oak", color: "#A66A33", notes: ["Toast", "Cedar", "Smoke", "Coconut", "Butterscotch"] },
  { label: "Mineral", color: "#9AA7B2", notes: ["Chalk", "Flint", "Slate", "Graphite", "Iron"] },
  { label: "Other", color: "#897a63", notes: ["Honey", "Butter", "Cream", "Brioche", "Almond", "Hazelnut"] },
];

export const ALL_NOTES = FLAVOR_GROUPS.flatMap((g) => g.notes);

interface Props {
  selected: string[];
  onToggle: (note: string) => void;
}

export default function FlavorWheel({ selected, onToggle }: Props) {
  return (
    <div className="flavor-wheel">
      {FLAVOR_GROUPS.map((g) => (
        <div key={g.label} className="fg-group">
          <div className="fg-label" style={{ color: g.color }}>{g.label}</div>
          <div className="tags">
            {g.notes.map((n) => (
              <button
                key={n}
                className={`tag${selected.includes(n) ? " solid" : ""}`}
                style={selected.includes(n) ? { background: g.color } : undefined}
                onClick={() => onToggle(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
