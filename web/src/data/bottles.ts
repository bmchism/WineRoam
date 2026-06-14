import type { Bottle, WineType } from "../types";

// Wine Roam seed catalog — notable wines across types and regions.
// Core facts are accurate; `verified` marks confirmed entries.

const A: Record<WineType, string> = {
  Red: "#722F37",
  White: "#C9A24B",
  "Rosé": "#E8A0BF",
  Sparkling: "#9AA7B2",
  Dessert: "#D4A574",
  Orange: "#CC7722",
};

type Seed = Partial<Bottle> & {
  id: string;
  producer: string;
  name: string;
  wineryId: string;
  wineType: WineType;
  region: string;
  aromas: string[];
  flavors: string[];
};
const mk = (s: Seed): Bottle => {
  const base = {
    abv: 13.5,
    accent: A[s.wineType],
    ...s,
  };
  // Populate backward-compat aliases so existing components compile
  return {
    ...base,
    brand: base.producer,
    nom: base.wineryId,
    expression: base.wineType,
    agaveRegion: base.region,
    additiveFree: base.organic,
    proof: Math.round(base.abv * 2),
  };
};

export const bottles: Bottle[] = [
  // ---------- Reds ----------
  mk({
    id: "margaux-2015", producer: "Château Margaux", name: "Château Margaux 2015", wineryId: "chateau-margaux",
    wineType: "Red", vintage: 2015, abv: 13.5, region: "Bordeaux, France", appellation: "Margaux", country: "France",
    grapes: ["Cabernet Sauvignon", "Merlot", "Petit Verdot", "Cabernet Franc"],
    aging: "24 months in new French oak", vinification: "Traditional Bordeaux",
    aromas: ["Blackcurrant", "Violets", "Graphite", "Cedar", "Dark Chocolate"],
    flavors: ["Cassis", "Plum", "Silk Tannins", "Mineral", "Tobacco"],
    tastingNotes: "Extraordinary elegance and depth — a benchmark Margaux with decades of aging potential. Silky tannins wrap around a core of dark fruit and florals.",
    story: "First Growth from the 2015 vintage, widely regarded as one of Bordeaux's greatest modern years.",
    verified: true,
  }),
  mk({
    id: "opus-one-2019", producer: "Opus One", name: "Opus One 2019", wineryId: "opus-one",
    wineType: "Red", vintage: 2019, abv: 14.5, region: "Napa Valley, California", appellation: "Oakville", country: "USA",
    grapes: ["Cabernet Sauvignon", "Merlot", "Cabernet Franc", "Petit Verdot", "Malbec"],
    aging: "18 months in French oak (80% new)",
    aromas: ["Blackberry", "Cassis", "Espresso", "Violet", "Graphite"],
    flavors: ["Dark Fruit", "Mocha", "Fine Tannins", "Spice", "Mineral"],
    tastingNotes: "Opulent and structured with silky tannins. A seamless blend of Bordeaux elegance and Napa ripeness.",
    story: "The Mondavi-Rothschild partnership's flagship from an outstanding Napa vintage.",
    verified: true,
  }),
  mk({
    id: "penfolds-grange-2018", producer: "Penfolds", name: "Penfolds Grange 2018", wineryId: "penfolds",
    wineType: "Red", vintage: 2018, abv: 14.5, region: "South Australia", country: "Australia",
    grapes: ["Shiraz", "Cabernet Sauvignon"],
    aging: "20 months in new American oak hogsheads",
    aromas: ["Blackberry", "Dark Chocolate", "Anise", "Leather", "Tar"],
    flavors: ["Plum", "Spice", "Licorice", "Mocha", "Velvety Tannins"],
    tastingNotes: "Australia's most iconic wine — dense, powerful Shiraz with American oak richness and decades of aging ahead.",
    story: "Created by Max Schubert in 1951, defying early critics. Now Australia's most collected wine.",
    verified: true,
  }),
  mk({
    id: "tignanello-2019", producer: "Antinori", name: "Tignanello 2019", wineryId: "antinori",
    wineType: "Red", vintage: 2019, abv: 14.0, region: "Tuscany, Italy", appellation: "Toscana IGT", country: "Italy",
    grapes: ["Sangiovese", "Cabernet Sauvignon", "Cabernet Franc"],
    aging: "14 months in French and Hungarian oak barriques",
    aromas: ["Cherry", "Plum", "Tobacco", "Cedar", "Dried Herbs"],
    flavors: ["Red Fruit", "Leather", "Spice", "Earthy", "Balanced Tannins"],
    tastingNotes: "The original Super Tuscan. Sangiovese structure with international grape polish — Tuscan soul in a modern frame.",
    story: "First vintage 1971, one of the first to break from Chianti regulations and blend Cabernet with Sangiovese.",
    verified: true,
  }),
  mk({
    id: "ridge-monte-bello-2019", producer: "Ridge Vineyards", name: "Ridge Monte Bello 2019", wineryId: "ridge-vineyards",
    wineType: "Red", vintage: 2019, abv: 13.8, region: "Santa Cruz Mountains, California", country: "USA",
    grapes: ["Cabernet Sauvignon", "Merlot", "Petit Verdot"],
    aging: "17 months in American oak (mostly air-dried)", vinification: "Native yeast, no fining or filtering",
    aromas: ["Cassis", "Iron", "Sage", "Graphite", "Bay Leaf"],
    flavors: ["Black Cherry", "Mineral", "Fine Tannins", "Herb", "Long Finish"],
    tastingNotes: "California's most Bordeaux-like Cabernet from a mountaintop vineyard at 2,600 feet. Pre-industrial methods, extraordinary terroir.",
    story: "Outperformed First Growths in the 1976 Judgment of Paris re-tasting. Pure place over power.",
    verified: true,
  }),
  mk({
    id: "catena-malbec-2020", producer: "Catena Zapata", name: "Catena Zapata Malbec Argentino 2020", wineryId: "catena-zapata",
    wineType: "Red", vintage: 2020, abv: 14.0, region: "Mendoza, Argentina", appellation: "Adrianna Vineyard", country: "Argentina",
    grapes: ["Malbec"],
    aging: "18 months in French oak", soil: "Limestone and clay at 5,000 ft elevation",
    aromas: ["Blackberry", "Violet", "Cocoa", "Crushed Rock", "Plum"],
    flavors: ["Dark Fruit", "Mineral", "Spice", "Silk Tannins", "Long Finish"],
    tastingNotes: "High-altitude Malbec from the Adrianna vineyard — intense violet color, extraordinary depth, and limestone-driven minerality.",
    story: "Nicolás Catena pioneered high-altitude Malbec, proving Argentina could make world-class wine.",
    verified: true,
  }),
  mk({
    id: "vega-sicilia-unico-2012", producer: "Vega Sicilia", name: "Vega Sicilia Único 2012", wineryId: "vega-sicilia",
    wineType: "Red", vintage: 2012, abv: 14.5, region: "Ribera del Duero, Spain", country: "Spain",
    grapes: ["Tempranillo", "Cabernet Sauvignon"],
    aging: "6 years in oak (various sizes), further bottle aging before release",
    aromas: ["Dried Rose", "Tobacco", "Leather", "Black Cherry", "Truffle"],
    flavors: ["Plum", "Cedar", "Spice", "Earth", "Endless Finish"],
    tastingNotes: "Spain's greatest wine — extraordinary complexity from extended aging. Tempranillo meets Cabernet with a decade of patience.",
    story: "Founded 1864, only released after 10+ years of aging. A wine of absolute patience and conviction.",
    verified: true,
  }),
  mk({
    id: "conterno-monfortino-2015", producer: "Giacomo Conterno", name: "Monfortino Riserva 2015", wineryId: "marchesi-barolo",
    wineType: "Red", vintage: 2015, abv: 14.0, region: "Piedmont, Italy", appellation: "Barolo", country: "Italy",
    grapes: ["Nebbiolo"],
    aging: "7 years in large Slavonian oak botti",
    aromas: ["Tar", "Roses", "Dried Cherry", "Truffle", "Licorice"],
    flavors: ["Red Fruit", "Iron", "Earth", "Fine Tannins", "Ethereal Finish"],
    tastingNotes: "The pinnacle of traditional Barolo — tar and roses, iron and silk. Only made in exceptional years.",
    story: "Monfortino represents the highest expression of Nebbiolo, aged longer than any other Barolo.",
    verified: true,
  }),

  // ---------- Whites ----------
  mk({
    id: "cloudy-bay-sb-2023", producer: "Cloudy Bay", name: "Cloudy Bay Sauvignon Blanc 2023", wineryId: "cloudy-bay",
    wineType: "White", vintage: 2023, abv: 13.5, region: "Marlborough, New Zealand", country: "New Zealand",
    grapes: ["Sauvignon Blanc"],
    aging: "Stainless steel", vinification: "Cool fermentation, no malolactic",
    aromas: ["Passionfruit", "Lime", "Cut Grass", "Gooseberry", "Flint"],
    flavors: ["Citrus", "Tropical Fruit", "Mineral", "Crisp Acidity", "Clean Finish"],
    tastingNotes: "The wine that defined New Zealand Sauvignon Blanc — electric acidity, tropical fruit, and herbaceous freshness.",
    story: "David Hohnen founded Cloudy Bay in 1985 and almost single-handedly put Marlborough on the world wine map.",
    verified: true,
  }),
  mk({
    id: "trimbach-clos-ste-hune-2017", producer: "Trimbach", name: "Trimbach Clos Sainte Hune 2017", wineryId: "trimbach",
    wineType: "White", vintage: 2017, abv: 13.0, region: "Alsace, France", appellation: "Alsace Grand Cru", country: "France",
    grapes: ["Riesling"],
    aging: "Extended lees aging in stainless steel", soil: "Limestone and marl (Rosacker Grand Cru)",
    aromas: ["Petrol", "Lime", "White Flowers", "Wet Stone", "Smoke"],
    flavors: ["Citrus", "Mineral", "Steel", "Honey", "Crystalline Acidity"],
    tastingNotes: "Arguably the world's finest dry Riesling. Laser-sharp minerality, extraordinary purity, will age 30+ years.",
    story: "From a tiny 1.67-hectare plot within the Rosacker Grand Cru — the Trimbach family's crown jewel since 1919.",
    verified: true,
  }),
  mk({
    id: "leflaive-chevalier-2020", producer: "Domaine Leflaive", name: "Chevalier-Montrachet Grand Cru 2020", wineryId: "domaine-leflaive",
    wineType: "White", vintage: 2020, abv: 13.5, region: "Burgundy, France", appellation: "Puligny-Montrachet", country: "France",
    grapes: ["Chardonnay"],
    aging: "18 months in French oak (25% new)", vinification: "Whole-cluster press, native yeast, biodynamic",
    aromas: ["White Peach", "Hazelnut", "Citrus Blossom", "Chalk", "Butter"],
    flavors: ["Stone Fruit", "Mineral", "Cream", "Acidity", "Incredible Length"],
    tastingNotes: "Grand Cru white Burgundy at its finest — power wrapped in finesse, with chalky minerality driving the endless finish.",
    story: "Biodynamic since 1997 under Anne-Claude Leflaive's vision. The soul of Puligny-Montrachet.",
    verified: true,
  }),

  // ---------- Sparkling ----------
  mk({
    id: "dom-perignon-2013", producer: "Dom Pérignon", name: "Dom Pérignon Vintage 2013", wineryId: "dom-perignon",
    wineType: "Sparkling", vintage: 2013, abv: 12.5, region: "Champagne, France", appellation: "Champagne", country: "France",
    grapes: ["Chardonnay", "Pinot Noir"],
    aging: "8+ years on lees", vinification: "Traditional method, dosage ~4g/L",
    aromas: ["Brioche", "Citrus", "White Flowers", "Almond", "Smoke"],
    flavors: ["Toast", "Lemon", "Mineral", "Cream", "Fine Mousse"],
    tastingNotes: "Vintage Champagne of remarkable precision. Extended lees aging creates autolytic complexity while preserving freshness.",
    story: "Only produced in vintage years. The 2013 shows the brilliance of a cool, late-harvest year.",
    verified: true,
  }),
  mk({
    id: "krug-grande-cuvee", producer: "Krug", name: "Krug Grande Cuvée (170ème Édition)", wineryId: "krug",
    wineType: "Sparkling", abv: 12.5, region: "Champagne, France", appellation: "Champagne", country: "France",
    grapes: ["Chardonnay", "Pinot Noir", "Pinot Meunier"],
    aging: "7+ years on lees", vinification: "First fermentation in small oak casks, 120+ wines from 10+ vintages",
    aromas: ["Toasted Bread", "Hazelnut", "Dried Fruit", "Honey", "Spice"],
    flavors: ["Brioche", "Citrus", "Richness", "Complexity", "Endless Finish"],
    tastingNotes: "Multi-vintage Champagne of staggering complexity. Oak-fermented components blended from a decade of reserves.",
    story: "Joseph Krug founded the house in 1843 with the belief that the best Champagne is made from the best blend, not the best year.",
    verified: true,
  }),

  // ---------- Rosé ----------
  mk({
    id: "whispering-angel-2023", producer: "Château d'Esclans", name: "Whispering Angel Rosé 2023", wineryId: "whispering-angel",
    wineType: "Rosé", vintage: 2023, abv: 13.0, region: "Provence, France", appellation: "Côtes de Provence", country: "France",
    grapes: ["Grenache", "Cinsault", "Rolle"],
    aging: "Stainless steel", vinification: "Direct press, temperature-controlled fermentation",
    aromas: ["Strawberry", "Peach", "White Flowers", "Citrus"],
    flavors: ["Red Fruit", "Mineral", "Crisp", "Dry", "Refreshing"],
    tastingNotes: "The Provence rosé that launched a global category. Pale salmon color, delicate fruit, bone-dry finish.",
    story: "Sacha Lichine revived this Provençal estate in 2006, creating a rosé that changed how the world drinks pink wine.",
    verified: true,
  }),

  // ---------- Dessert ----------
  mk({
    id: "yquem-2015", producer: "Château d'Yquem", name: "Château d'Yquem 2015", wineryId: "chateau-dyquem",
    wineType: "Dessert", vintage: 2015, abv: 14.0, region: "Bordeaux, France", appellation: "Sauternes", country: "France",
    grapes: ["Sémillon", "Sauvignon Blanc"],
    aging: "36 months in new French oak", vinification: "Botrytis-affected grapes, multiple picking passes",
    aromas: ["Apricot", "Honey", "Saffron", "Crème Brûlée", "Orange Peel"],
    flavors: ["Honeyed Stone Fruit", "Marmalade", "Spice", "Racy Acidity", "Endless"],
    tastingNotes: "The world's greatest sweet wine. Liquid gold with perfect balance — the acidity matches the sweetness note for note.",
    story: "The only Premier Cru Supérieur of 1855. Thomas Jefferson called it 'the best white wine of France.'",
    verified: true,
  }),
  mk({
    id: "taylor-vintage-port-2017", producer: "Taylor's", name: "Taylor's Vintage Port 2017", wineryId: "taylor-port",
    wineType: "Dessert", vintage: 2017, abv: 20.5, region: "Douro Valley, Portugal", appellation: "Porto", country: "Portugal",
    grapes: ["Touriga Nacional", "Touriga Franca", "Tinta Roriz", "Tinta Barroca"],
    aging: "22 months in seasoned oak casks, then bottle-aged",
    aromas: ["Blackberry", "Violet", "Dark Chocolate", "Spice", "Minerals"],
    flavors: ["Concentrated Fruit", "Chocolate", "Grip", "Structure", "Very Long"],
    tastingNotes: "A declared vintage Port from a great year. Massively concentrated with Taylor's signature backbone of tannic structure.",
    story: "Taylor's declared their 2017 vintage — one of the finest in the Douro's modern era. Built to age 50+ years.",
    verified: true,
  }),
];

// Lookup helpers
export const bottleById = (id: string): Bottle | undefined =>
  bottles.find((b) => b.id === id);

export const bottlesByType = (type: WineType): Bottle[] =>
  bottles.filter((b) => b.wineType === type);
