// Top-Wines MANIFEST — the INPUT to the cold-start cache pre-warm.
//
// Just identifiers (producer + wine name, region). NOT the full bottle data —
// the provisioning batch enriches accurate structured profiles via tiered
// Claude + integrations, writes them to DynamoDB as verified=false pending
// admin review. Idempotent / re-runnable.

export type WineType = "Red" | "White" | "Rosé" | "Sparkling" | "Dessert" | "Orange";

export interface TopWineSeed {
  producer: string;
  name: string;
  wineType: WineType;
  region?: string;
  country?: string;
}

const R: WineType = "Red";
const W: WineType = "White";
const Ro: WineType = "Rosé";
const S: WineType = "Sparkling";
const D: WineType = "Dessert";

interface ProducerRow {
  producer: string;
  country?: string;
  wines: { name: string; type: WineType; region?: string }[];
}

const CATALOG: ProducerRow[] = [
  // ---- France: Bordeaux ----
  { producer: "Château Margaux", country: "France", wines: [
    { name: "Château Margaux", type: R, region: "Margaux" },
    { name: "Pavillon Rouge", type: R, region: "Margaux" },
  ]},
  { producer: "Château Lafite Rothschild", country: "France", wines: [
    { name: "Château Lafite Rothschild", type: R, region: "Pauillac" },
    { name: "Carruades de Lafite", type: R, region: "Pauillac" },
  ]},
  { producer: "Château Latour", country: "France", wines: [
    { name: "Château Latour", type: R, region: "Pauillac" },
    { name: "Les Forts de Latour", type: R, region: "Pauillac" },
  ]},
  { producer: "Château Mouton Rothschild", country: "France", wines: [
    { name: "Château Mouton Rothschild", type: R, region: "Pauillac" },
  ]},
  { producer: "Château Haut-Brion", country: "France", wines: [
    { name: "Château Haut-Brion", type: R, region: "Pessac-Léognan" },
    { name: "Château Haut-Brion Blanc", type: W, region: "Pessac-Léognan" },
  ]},
  { producer: "Château Pétrus", country: "France", wines: [
    { name: "Pétrus", type: R, region: "Pomerol" },
  ]},
  { producer: "Château Cheval Blanc", country: "France", wines: [
    { name: "Château Cheval Blanc", type: R, region: "Saint-Émilion" },
  ]},
  { producer: "Château d'Yquem", country: "France", wines: [
    { name: "Château d'Yquem", type: D, region: "Sauternes" },
  ]},

  // ---- France: Burgundy ----
  { producer: "Domaine de la Romanée-Conti", country: "France", wines: [
    { name: "Romanée-Conti Grand Cru", type: R, region: "Vosne-Romanée" },
    { name: "La Tâche Grand Cru", type: R, region: "Vosne-Romanée" },
    { name: "Richebourg Grand Cru", type: R, region: "Vosne-Romanée" },
    { name: "Montrachet Grand Cru", type: W, region: "Puligny-Montrachet" },
  ]},
  { producer: "Domaine Leroy", country: "France", wines: [
    { name: "Musigny Grand Cru", type: R, region: "Chambolle-Musigny" },
    { name: "Chambertin Grand Cru", type: R, region: "Gevrey-Chambertin" },
  ]},
  { producer: "Domaine Leflaive", country: "France", wines: [
    { name: "Chevalier-Montrachet Grand Cru", type: W, region: "Puligny-Montrachet" },
    { name: "Bâtard-Montrachet Grand Cru", type: W, region: "Puligny-Montrachet" },
  ]},
  { producer: "Domaine Coche-Dury", country: "France", wines: [
    { name: "Corton-Charlemagne Grand Cru", type: W, region: "Aloxe-Corton" },
    { name: "Meursault Perrières", type: W, region: "Meursault" },
  ]},

  // ---- France: Champagne ----
  { producer: "Dom Pérignon", country: "France", wines: [
    { name: "Dom Pérignon Vintage", type: S, region: "Champagne" },
    { name: "Dom Pérignon P2", type: S, region: "Champagne" },
    { name: "Dom Pérignon Rosé", type: S, region: "Champagne" },
  ]},
  { producer: "Krug", country: "France", wines: [
    { name: "Krug Grande Cuvée", type: S, region: "Champagne" },
    { name: "Krug Clos du Mesnil", type: S, region: "Champagne" },
    { name: "Krug Vintage", type: S, region: "Champagne" },
  ]},
  { producer: "Louis Roederer", country: "France", wines: [
    { name: "Cristal", type: S, region: "Champagne" },
    { name: "Cristal Rosé", type: S, region: "Champagne" },
  ]},
  { producer: "Salon", country: "France", wines: [
    { name: "Salon Le Mesnil", type: S, region: "Champagne" },
  ]},

  // ---- France: Rhône ----
  { producer: "E. Guigal", country: "France", wines: [
    { name: "La Landonne", type: R, region: "Côte-Rôtie" },
    { name: "La Mouline", type: R, region: "Côte-Rôtie" },
    { name: "La Turque", type: R, region: "Côte-Rôtie" },
  ]},
  { producer: "Château de Beaucastel", country: "France", wines: [
    { name: "Châteauneuf-du-Pape", type: R, region: "Châteauneuf-du-Pape" },
    { name: "Hommage à Jacques Perrin", type: R, region: "Châteauneuf-du-Pape" },
  ]},

  // ---- France: Alsace ----
  { producer: "Trimbach", country: "France", wines: [
    { name: "Clos Sainte Hune Riesling", type: W, region: "Alsace" },
    { name: "Riesling Frédéric Emile", type: W, region: "Alsace" },
  ]},

  // ---- Italy ----
  { producer: "Giacomo Conterno", country: "Italy", wines: [
    { name: "Monfortino Riserva", type: R, region: "Barolo" },
    { name: "Francia", type: R, region: "Barolo" },
  ]},
  { producer: "Antinori", country: "Italy", wines: [
    { name: "Tignanello", type: R, region: "Toscana" },
    { name: "Solaia", type: R, region: "Toscana" },
  ]},
  { producer: "Tenuta San Guido", country: "Italy", wines: [
    { name: "Sassicaia", type: R, region: "Bolgheri" },
  ]},
  { producer: "Gaja", country: "Italy", wines: [
    { name: "Barbaresco", type: R, region: "Barbaresco" },
    { name: "Sperss", type: R, region: "Barolo" },
  ]},
  { producer: "Masseto", country: "Italy", wines: [
    { name: "Masseto", type: R, region: "Toscana" },
  ]},

  // ---- Spain ----
  { producer: "Vega Sicilia", country: "Spain", wines: [
    { name: "Único", type: R, region: "Ribera del Duero" },
    { name: "Valbuena 5°", type: R, region: "Ribera del Duero" },
  ]},
  { producer: "Pingus", country: "Spain", wines: [
    { name: "Pingus", type: R, region: "Ribera del Duero" },
    { name: "Flor de Pingus", type: R, region: "Ribera del Duero" },
  ]},

  // ---- USA: California ----
  { producer: "Opus One", country: "USA", wines: [
    { name: "Opus One", type: R, region: "Napa Valley" },
  ]},
  { producer: "Screaming Eagle", country: "USA", wines: [
    { name: "Screaming Eagle Cabernet", type: R, region: "Napa Valley" },
  ]},
  { producer: "Ridge Vineyards", country: "USA", wines: [
    { name: "Monte Bello", type: R, region: "Santa Cruz Mountains" },
    { name: "Geyserville", type: R, region: "Sonoma County" },
  ]},
  { producer: "Sine Qua Non", country: "USA", wines: [
    { name: "Sine Qua Non Syrah", type: R, region: "Central Coast" },
    { name: "Sine Qua Non Grenache", type: R, region: "Central Coast" },
  ]},
  { producer: "Penfolds", country: "Australia", wines: [
    { name: "Grange", type: R, region: "South Australia" },
    { name: "Bin 389", type: R, region: "South Australia" },
    { name: "Bin 707", type: R, region: "South Australia" },
  ]},

  // ---- New Zealand ----
  { producer: "Cloudy Bay", country: "New Zealand", wines: [
    { name: "Sauvignon Blanc", type: W, region: "Marlborough" },
    { name: "Te Koko", type: W, region: "Marlborough" },
  ]},

  // ---- Argentina ----
  { producer: "Catena Zapata", country: "Argentina", wines: [
    { name: "Malbec Argentino", type: R, region: "Mendoza" },
    { name: "Adrianna Vineyard Mundus Bacillus Terrae", type: R, region: "Mendoza" },
    { name: "White Bones Chardonnay", type: W, region: "Mendoza" },
  ]},

  // ---- Portugal ----
  { producer: "Taylor's", country: "Portugal", wines: [
    { name: "Vintage Port", type: D, region: "Douro" },
    { name: "Single Quinta de Vargellas", type: D, region: "Douro" },
  ]},

  // ---- Rosé ----
  { producer: "Château d'Esclans", country: "France", wines: [
    { name: "Whispering Angel", type: Ro, region: "Provence" },
    { name: "Garrus", type: Ro, region: "Provence" },
  ]},
];

export const topWines: TopWineSeed[] = CATALOG.flatMap((row) =>
  row.wines.map((w) => ({
    producer: row.producer,
    name: w.name,
    wineType: w.type,
    region: w.region,
    country: row.country,
  }))
);

export const TOP_COUNT = topWines.length;
