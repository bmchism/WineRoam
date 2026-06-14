// Top-Wines MANIFEST — 2,500 wines for cold-start cache pre-warm.
//
// Focus: wines under $100 retail that are readily available for home tastings.
// Some premium/collectible bottles included where popular and findable.
// The provisioning batch enriches full structured profiles via tiered Claude,
// writes them to DynamoDB as verified=false pending admin review.
// Idempotent / re-runnable.

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
const O: WineType = "Orange";

interface ProducerRow {
  producer: string;
  country?: string;
  wines: { name: string; type: WineType; region?: string }[];
}

// ~250 producers × avg 10 wines = ~2,500 entries
const CATALOG: ProducerRow[] = [
  // ========== FRANCE: BORDEAUX ==========
  { producer: "Château Margaux", country: "France", wines: [
    { name: "Château Margaux", type: R, region: "Margaux" },
    { name: "Pavillon Rouge du Château Margaux", type: R, region: "Margaux" },
  ]},
  { producer: "Château Lafite Rothschild", country: "France", wines: [
    { name: "Château Lafite Rothschild", type: R, region: "Pauillac" },
    { name: "Carruades de Lafite", type: R, region: "Pauillac" },
  ]},
  { producer: "Château Mouton Rothschild", country: "France", wines: [
    { name: "Château Mouton Rothschild", type: R, region: "Pauillac" },
    { name: "Le Petit Mouton", type: R, region: "Pauillac" },
  ]},
  { producer: "Château Latour", country: "France", wines: [
    { name: "Les Forts de Latour", type: R, region: "Pauillac" },
  ]},
  { producer: "Château Haut-Brion", country: "France", wines: [
    { name: "Château Haut-Brion", type: R, region: "Pessac-Léognan" },
    { name: "Le Clarence de Haut-Brion", type: R, region: "Pessac-Léognan" },
    { name: "Château Haut-Brion Blanc", type: W, region: "Pessac-Léognan" },
  ]},
  { producer: "Château Lynch-Bages", country: "France", wines: [
    { name: "Château Lynch-Bages", type: R, region: "Pauillac" },
    { name: "Echo de Lynch-Bages", type: R, region: "Pauillac" },
  ]},
  { producer: "Château Pichon Baron", country: "France", wines: [
    { name: "Château Pichon Baron", type: R, region: "Pauillac" },
    { name: "Les Griffons de Pichon Baron", type: R, region: "Pauillac" },
  ]},
  { producer: "Château Pichon Lalande", country: "France", wines: [
    { name: "Château Pichon Longueville Comtesse de Lalande", type: R, region: "Pauillac" },
  ]},
  { producer: "Château Cos d'Estournel", country: "France", wines: [
    { name: "Château Cos d'Estournel", type: R, region: "Saint-Estèphe" },
    { name: "Les Pagodes de Cos", type: R, region: "Saint-Estèphe" },
  ]},
  { producer: "Château Montrose", country: "France", wines: [
    { name: "Château Montrose", type: R, region: "Saint-Estèphe" },
    { name: "La Dame de Montrose", type: R, region: "Saint-Estèphe" },
  ]},
  { producer: "Château Léoville-Las Cases", country: "France", wines: [
    { name: "Château Léoville-Las Cases", type: R, region: "Saint-Julien" },
    { name: "Le Petit Lion du Marquis de Las Cases", type: R, region: "Saint-Julien" },
  ]},
  { producer: "Château Ducru-Beaucaillou", country: "France", wines: [
    { name: "Château Ducru-Beaucaillou", type: R, region: "Saint-Julien" },
  ]},
  { producer: "Château Palmer", country: "France", wines: [
    { name: "Château Palmer", type: R, region: "Margaux" },
    { name: "Alter Ego de Palmer", type: R, region: "Margaux" },
  ]},
  { producer: "Château Pontet-Canet", country: "France", wines: [
    { name: "Château Pontet-Canet", type: R, region: "Pauillac" },
  ]},
  { producer: "Château Calon-Ségur", country: "France", wines: [
    { name: "Château Calon-Ségur", type: R, region: "Saint-Estèphe" },
  ]},
  { producer: "Château Smith Haut Lafitte", country: "France", wines: [
    { name: "Château Smith Haut Lafitte Rouge", type: R, region: "Pessac-Léognan" },
    { name: "Château Smith Haut Lafitte Blanc", type: W, region: "Pessac-Léognan" },
  ]},
  { producer: "Château Pétrus", country: "France", wines: [
    { name: "Pétrus", type: R, region: "Pomerol" },
  ]},
  { producer: "Château Le Pin", country: "France", wines: [
    { name: "Château Le Pin", type: R, region: "Pomerol" },
  ]},
  { producer: "Château Cheval Blanc", country: "France", wines: [
    { name: "Château Cheval Blanc", type: R, region: "Saint-Émilion" },
    { name: "Le Petit Cheval", type: R, region: "Saint-Émilion" },
  ]},
  { producer: "Château Angélus", country: "France", wines: [
    { name: "Château Angélus", type: R, region: "Saint-Émilion" },
  ]},
  { producer: "Château Figeac", country: "France", wines: [
    { name: "Château Figeac", type: R, region: "Saint-Émilion" },
  ]},
  { producer: "Château Canon", country: "France", wines: [
    { name: "Château Canon", type: R, region: "Saint-Émilion" },
  ]},
  { producer: "Château d'Yquem", country: "France", wines: [
    { name: "Château d'Yquem", type: D, region: "Sauternes" },
  ]},
  { producer: "Château Climens", country: "France", wines: [
    { name: "Château Climens", type: D, region: "Barsac" },
  ]},
  // Affordable Bordeaux (<$30-50)
  { producer: "Château Sociando-Mallet", country: "France", wines: [
    { name: "Château Sociando-Mallet", type: R, region: "Haut-Médoc" },
  ]},
  { producer: "Château Phélan Ségur", country: "France", wines: [
    { name: "Château Phélan Ségur", type: R, region: "Saint-Estèphe" },
  ]},
  { producer: "Château Poujeaux", country: "France", wines: [
    { name: "Château Poujeaux", type: R, region: "Moulis-en-Médoc" },
  ]},
  { producer: "Château Gloria", country: "France", wines: [
    { name: "Château Gloria", type: R, region: "Saint-Julien" },
  ]},
  { producer: "Château de Pez", country: "France", wines: [
    { name: "Château de Pez", type: R, region: "Saint-Estèphe" },
  ]},
  { producer: "Château Cantemerle", country: "France", wines: [
    { name: "Château Cantemerle", type: R, region: "Haut-Médoc" },
  ]},
  { producer: "Château Potensac", country: "France", wines: [
    { name: "Château Potensac", type: R, region: "Médoc" },
  ]},
  { producer: "Château Meyney", country: "France", wines: [
    { name: "Château Meyney", type: R, region: "Saint-Estèphe" },
  ]},

  // ========== FRANCE: BURGUNDY ==========
  { producer: "Domaine de la Romanée-Conti", country: "France", wines: [
    { name: "Romanée-Conti Grand Cru", type: R, region: "Vosne-Romanée" },
    { name: "La Tâche Grand Cru", type: R, region: "Vosne-Romanée" },
    { name: "Richebourg Grand Cru", type: R, region: "Vosne-Romanée" },
    { name: "Montrachet Grand Cru", type: W, region: "Puligny-Montrachet" },
  ]},
  { producer: "Domaine Leroy", country: "France", wines: [
    { name: "Musigny Grand Cru", type: R, region: "Chambolle-Musigny" },
    { name: "Chambertin Grand Cru", type: R, region: "Gevrey-Chambertin" },
    { name: "Clos de Vougeot Grand Cru", type: R, region: "Vougeot" },
  ]},
  { producer: "Domaine Leflaive", country: "France", wines: [
    { name: "Chevalier-Montrachet Grand Cru", type: W, region: "Puligny-Montrachet" },
    { name: "Bâtard-Montrachet Grand Cru", type: W, region: "Puligny-Montrachet" },
    { name: "Puligny-Montrachet 1er Cru Les Pucelles", type: W, region: "Puligny-Montrachet" },
  ]},
  { producer: "Domaine Coche-Dury", country: "France", wines: [
    { name: "Corton-Charlemagne Grand Cru", type: W, region: "Aloxe-Corton" },
    { name: "Meursault Perrières 1er Cru", type: W, region: "Meursault" },
  ]},
  { producer: "Domaine Armand Rousseau", country: "France", wines: [
    { name: "Chambertin Grand Cru", type: R, region: "Gevrey-Chambertin" },
    { name: "Clos de la Roche Grand Cru", type: R, region: "Morey-Saint-Denis" },
    { name: "Gevrey-Chambertin 1er Cru Clos St-Jacques", type: R, region: "Gevrey-Chambertin" },
  ]},
  { producer: "Domaine Georges Roumier", country: "France", wines: [
    { name: "Musigny Grand Cru", type: R, region: "Chambolle-Musigny" },
    { name: "Bonnes-Mares Grand Cru", type: R, region: "Chambolle-Musigny" },
    { name: "Chambolle-Musigny 1er Cru Les Amoureuses", type: R, region: "Chambolle-Musigny" },
  ]},
  { producer: "Domaine Comte Georges de Vogüé", country: "France", wines: [
    { name: "Musigny Grand Cru Vieilles Vignes", type: R, region: "Chambolle-Musigny" },
    { name: "Bonnes-Mares Grand Cru", type: R, region: "Chambolle-Musigny" },
  ]},
  { producer: "Domaine Méo-Camuzet", country: "France", wines: [
    { name: "Richebourg Grand Cru", type: R, region: "Vosne-Romanée" },
    { name: "Vosne-Romanée 1er Cru Les Brûlées", type: R, region: "Vosne-Romanée" },
    { name: "Clos de Vougeot Grand Cru", type: R, region: "Vougeot" },
  ]},
  // Accessible Burgundy (<$50-80)
  { producer: "Louis Jadot", country: "France", wines: [
    { name: "Gevrey-Chambertin", type: R, region: "Gevrey-Chambertin" },
    { name: "Beaune 1er Cru Clos des Ursules", type: R, region: "Beaune" },
    { name: "Pouilly-Fuissé", type: W, region: "Mâconnais" },
    { name: "Meursault", type: W, region: "Meursault" },
    { name: "Bourgogne Chardonnay", type: W, region: "Bourgogne" },
    { name: "Beaujolais-Villages", type: R, region: "Beaujolais" },
  ]},
  { producer: "Joseph Drouhin", country: "France", wines: [
    { name: "Chambolle-Musigny", type: R, region: "Chambolle-Musigny" },
    { name: "Beaune 1er Cru Clos des Mouches", type: R, region: "Beaune" },
    { name: "Beaune 1er Cru Clos des Mouches Blanc", type: W, region: "Beaune" },
    { name: "Chablis", type: W, region: "Chablis" },
    { name: "Rully", type: W, region: "Côte Chalonnaise" },
    { name: "Bourgogne Pinot Noir", type: R, region: "Bourgogne" },
  ]},
  { producer: "Bouchard Père & Fils", country: "France", wines: [
    { name: "Meursault Les Clous", type: W, region: "Meursault" },
    { name: "Beaune du Château 1er Cru", type: R, region: "Beaune" },
    { name: "Bourgogne Réserve", type: R, region: "Bourgogne" },
  ]},
  { producer: "Domaine William Fèvre", country: "France", wines: [
    { name: "Chablis Grand Cru Les Clos", type: W, region: "Chablis" },
    { name: "Chablis 1er Cru Montmains", type: W, region: "Chablis" },
    { name: "Chablis", type: W, region: "Chablis" },
  ]},
  { producer: "Domaine Faiveley", country: "France", wines: [
    { name: "Gevrey-Chambertin 1er Cru Les Cazetiers", type: R, region: "Gevrey-Chambertin" },
    { name: "Nuits-Saint-Georges", type: R, region: "Nuits-Saint-Georges" },
    { name: "Mercurey", type: R, region: "Côte Chalonnaise" },
    { name: "Bourgogne Chardonnay", type: W, region: "Bourgogne" },
  ]},
  { producer: "Maison Louis Latour", country: "France", wines: [
    { name: "Corton-Charlemagne Grand Cru", type: W, region: "Aloxe-Corton" },
    { name: "Ardèche Chardonnay", type: W, region: "Ardèche" },
    { name: "Bourgogne Pinot Noir", type: R, region: "Bourgogne" },
  ]},
  { producer: "Domaine Albert Bichot", country: "France", wines: [
    { name: "Chablis", type: W, region: "Chablis" },
    { name: "Bourgogne Vieilles Vignes", type: R, region: "Bourgogne" },
  ]},

  // ========== FRANCE: RHÔNE ==========
  { producer: "E. Guigal", country: "France", wines: [
    { name: "Côtes du Rhône", type: R, region: "Côtes du Rhône" },
    { name: "Crozes-Hermitage", type: R, region: "Crozes-Hermitage" },
    { name: "Hermitage", type: R, region: "Hermitage" },
    { name: "Châteauneuf-du-Pape", type: R, region: "Châteauneuf-du-Pape" },
    { name: "Côte-Rôtie Brune et Blonde", type: R, region: "Côte-Rôtie" },
    { name: "La Landonne", type: R, region: "Côte-Rôtie" },
    { name: "La Mouline", type: R, region: "Côte-Rôtie" },
    { name: "La Turque", type: R, region: "Côte-Rôtie" },
    { name: "Condrieu", type: W, region: "Condrieu" },
  ]},
  { producer: "M. Chapoutier", country: "France", wines: [
    { name: "Hermitage Monier de la Sizeranne", type: R, region: "Hermitage" },
    { name: "Crozes-Hermitage Les Meysonniers", type: R, region: "Crozes-Hermitage" },
    { name: "Côtes du Rhône Belleruche", type: R, region: "Côtes du Rhône" },
    { name: "Côtes du Rhône Belleruche Blanc", type: W, region: "Côtes du Rhône" },
    { name: "Saint-Joseph Deschants", type: R, region: "Saint-Joseph" },
  ]},
  { producer: "Château de Beaucastel", country: "France", wines: [
    { name: "Châteauneuf-du-Pape Rouge", type: R, region: "Châteauneuf-du-Pape" },
    { name: "Châteauneuf-du-Pape Blanc", type: W, region: "Châteauneuf-du-Pape" },
    { name: "Hommage à Jacques Perrin", type: R, region: "Châteauneuf-du-Pape" },
    { name: "Coudoulet de Beaucastel", type: R, region: "Côtes du Rhône" },
  ]},
  { producer: "Domaine du Vieux Télégraphe", country: "France", wines: [
    { name: "Châteauneuf-du-Pape La Crau", type: R, region: "Châteauneuf-du-Pape" },
    { name: "Télégramme", type: R, region: "Châteauneuf-du-Pape" },
  ]},
  { producer: "Jean-Louis Chave", country: "France", wines: [
    { name: "Hermitage", type: R, region: "Hermitage" },
    { name: "Hermitage Blanc", type: W, region: "Hermitage" },
    { name: "Saint-Joseph", type: R, region: "Saint-Joseph" },
  ]},
  { producer: "Paul Jaboulet Aîné", country: "France", wines: [
    { name: "Hermitage La Chapelle", type: R, region: "Hermitage" },
    { name: "Crozes-Hermitage Domaine de Thalabert", type: R, region: "Crozes-Hermitage" },
    { name: "Côtes du Rhône Parallèle 45", type: R, region: "Côtes du Rhône" },
  ]},
  { producer: "Domaine de la Janasse", country: "France", wines: [
    { name: "Châteauneuf-du-Pape Vieilles Vignes", type: R, region: "Châteauneuf-du-Pape" },
    { name: "Côtes du Rhône Terre de Bussière", type: R, region: "Côtes du Rhône" },
  ]},
  { producer: "Château Rayas", country: "France", wines: [
    { name: "Châteauneuf-du-Pape", type: R, region: "Châteauneuf-du-Pape" },
  ]},
  { producer: "Delas Frères", country: "France", wines: [
    { name: "Côtes du Rhône Saint-Esprit", type: R, region: "Côtes du Rhône" },
    { name: "Crozes-Hermitage Les Launes", type: R, region: "Crozes-Hermitage" },
    { name: "Saint-Joseph François de Tournon", type: R, region: "Saint-Joseph" },
  ]},
  { producer: "Domaine Santa Duc", country: "France", wines: [
    { name: "Gigondas", type: R, region: "Gigondas" },
    { name: "Côtes du Rhône Les Plans", type: R, region: "Côtes du Rhône" },
  ]},
  { producer: "Perrin & Fils", country: "France", wines: [
    { name: "Côtes du Rhône Réserve", type: R, region: "Côtes du Rhône" },
    { name: "Côtes du Rhône Réserve Blanc", type: W, region: "Côtes du Rhône" },
    { name: "Vinsobres Les Cornuds", type: R, region: "Vinsobres" },
  ]},

  // ========== FRANCE: CHAMPAGNE ==========
  { producer: "Dom Pérignon", country: "France", wines: [
    { name: "Dom Pérignon Vintage", type: S, region: "Champagne" },
    { name: "Dom Pérignon Rosé", type: S, region: "Champagne" },
    { name: "Dom Pérignon P2", type: S, region: "Champagne" },
  ]},
  { producer: "Krug", country: "France", wines: [
    { name: "Grande Cuvée", type: S, region: "Champagne" },
    { name: "Vintage", type: S, region: "Champagne" },
    { name: "Clos du Mesnil", type: S, region: "Champagne" },
    { name: "Rosé", type: S, region: "Champagne" },
  ]},
  { producer: "Louis Roederer", country: "France", wines: [
    { name: "Cristal", type: S, region: "Champagne" },
    { name: "Brut Premier", type: S, region: "Champagne" },
    { name: "Collection", type: S, region: "Champagne" },
  ]},
  { producer: "Veuve Clicquot", country: "France", wines: [
    { name: "Yellow Label Brut", type: S, region: "Champagne" },
    { name: "La Grande Dame", type: S, region: "Champagne" },
    { name: "Rosé", type: S, region: "Champagne" },
  ]},
  { producer: "Moët & Chandon", country: "France", wines: [
    { name: "Impérial Brut", type: S, region: "Champagne" },
    { name: "Rosé Impérial", type: S, region: "Champagne" },
    { name: "Grand Vintage", type: S, region: "Champagne" },
  ]},
  { producer: "Pol Roger", country: "France", wines: [
    { name: "Brut Réserve", type: S, region: "Champagne" },
    { name: "Cuvée Sir Winston Churchill", type: S, region: "Champagne" },
  ]},
  { producer: "Bollinger", country: "France", wines: [
    { name: "Special Cuvée", type: S, region: "Champagne" },
    { name: "La Grande Année", type: S, region: "Champagne" },
    { name: "R.D.", type: S, region: "Champagne" },
  ]},
  { producer: "Taittinger", country: "France", wines: [
    { name: "Brut Réserve", type: S, region: "Champagne" },
    { name: "Comtes de Champagne Blanc de Blancs", type: S, region: "Champagne" },
    { name: "Comtes de Champagne Rosé", type: S, region: "Champagne" },
  ]},
  { producer: "Perrier-Jouët", country: "France", wines: [
    { name: "Grand Brut", type: S, region: "Champagne" },
    { name: "Belle Epoque", type: S, region: "Champagne" },
  ]},
  { producer: "Laurent-Perrier", country: "France", wines: [
    { name: "La Cuvée", type: S, region: "Champagne" },
    { name: "Grand Siècle", type: S, region: "Champagne" },
    { name: "Cuvée Rosé", type: S, region: "Champagne" },
  ]},
  { producer: "Ruinart", country: "France", wines: [
    { name: "Blanc de Blancs", type: S, region: "Champagne" },
    { name: "Rosé", type: S, region: "Champagne" },
  ]},
  { producer: "Billecart-Salmon", country: "France", wines: [
    { name: "Brut Réserve", type: S, region: "Champagne" },
    { name: "Brut Rosé", type: S, region: "Champagne" },
    { name: "Cuvée Nicolas François", type: S, region: "Champagne" },
  ]},
  { producer: "Charles Heidsieck", country: "France", wines: [
    { name: "Brut Réserve", type: S, region: "Champagne" },
    { name: "Blanc des Millénaires", type: S, region: "Champagne" },
  ]},
  { producer: "Salon", country: "France", wines: [
    { name: "Le Mesnil Blanc de Blancs", type: S, region: "Champagne" },
  ]},
  { producer: "Pierre Gimonnet & Fils", country: "France", wines: [
    { name: "Cuvée Gastronome", type: S, region: "Champagne" },
    { name: "Fleuron Blanc de Blancs", type: S, region: "Champagne" },
  ]},
  { producer: "Laherte Frères", country: "France", wines: [
    { name: "Ultradition Brut", type: S, region: "Champagne" },
  ]},
  { producer: "Egly-Ouriet", country: "France", wines: [
    { name: "Grand Cru Brut Tradition", type: S, region: "Champagne" },
  ]},

  // ========== FRANCE: ALSACE ==========
  { producer: "Trimbach", country: "France", wines: [
    { name: "Riesling", type: W, region: "Alsace" },
    { name: "Riesling Cuvée Frédéric Emile", type: W, region: "Alsace" },
    { name: "Clos Sainte Hune", type: W, region: "Alsace" },
    { name: "Gewürztraminer", type: W, region: "Alsace" },
    { name: "Pinot Gris Réserve Personnelle", type: W, region: "Alsace" },
  ]},
  { producer: "Domaine Weinbach", country: "France", wines: [
    { name: "Riesling Grand Cru Schlossberg", type: W, region: "Alsace" },
    { name: "Gewürztraminer Cuvée Laurence", type: W, region: "Alsace" },
  ]},
  { producer: "Hugel & Fils", country: "France", wines: [
    { name: "Riesling Classic", type: W, region: "Alsace" },
    { name: "Gewürztraminer Jubilee", type: W, region: "Alsace" },
    { name: "Pinot Gris Jubilee", type: W, region: "Alsace" },
  ]},
  { producer: "Zind-Humbrecht", country: "France", wines: [
    { name: "Riesling Rangen de Thann Grand Cru", type: W, region: "Alsace" },
    { name: "Pinot Gris Clos Windsbuhl", type: W, region: "Alsace" },
    { name: "Gewürztraminer Goldert Grand Cru", type: W, region: "Alsace" },
  ]},
  { producer: "Domaine Marcel Deiss", country: "France", wines: [
    { name: "Mambourg Grand Cru", type: W, region: "Alsace" },
    { name: "Alsace Complantation", type: W, region: "Alsace" },
  ]},

  // ========== FRANCE: LOIRE ==========
  { producer: "Domaine Huet", country: "France", wines: [
    { name: "Vouvray Le Haut-Lieu Sec", type: W, region: "Vouvray" },
    { name: "Vouvray Le Mont Demi-Sec", type: W, region: "Vouvray" },
    { name: "Vouvray Clos du Bourg Moelleux", type: D, region: "Vouvray" },
  ]},
  { producer: "Domaine Didier Dagueneau", country: "France", wines: [
    { name: "Silex", type: W, region: "Pouilly-Fumé" },
    { name: "Pur Sang", type: W, region: "Pouilly-Fumé" },
  ]},
  { producer: "Château de Villeneuve", country: "France", wines: [
    { name: "Saumur-Champigny Vieilles Vignes", type: R, region: "Saumur-Champigny" },
  ]},
  { producer: "Pascal Jolivet", country: "France", wines: [
    { name: "Sancerre", type: W, region: "Sancerre" },
    { name: "Pouilly-Fumé", type: W, region: "Pouilly-Fumé" },
    { name: "Sancerre Rosé", type: Ro, region: "Sancerre" },
  ]},
  { producer: "Domaine Vacheron", country: "France", wines: [
    { name: "Sancerre Les Romains", type: W, region: "Sancerre" },
    { name: "Sancerre Rouge", type: R, region: "Sancerre" },
  ]},
  { producer: "Nicolas Joly", country: "France", wines: [
    { name: "Coulée de Serrant", type: W, region: "Savennières" },
  ]},
  { producer: "Domaine de la Taille aux Loups", country: "France", wines: [
    { name: "Montlouis-sur-Loire Les Dix Arpents", type: W, region: "Montlouis" },
  ]},

  // ========== FRANCE: PROVENCE & LANGUEDOC ==========
  { producer: "Château d'Esclans", country: "France", wines: [
    { name: "Whispering Angel", type: Ro, region: "Côtes de Provence" },
    { name: "Rock Angel", type: Ro, region: "Côtes de Provence" },
    { name: "Garrus", type: Ro, region: "Côtes de Provence" },
  ]},
  { producer: "Domaine Tempier", country: "France", wines: [
    { name: "Bandol Rosé", type: Ro, region: "Bandol" },
    { name: "Bandol Rouge", type: R, region: "Bandol" },
    { name: "Bandol Rouge La Tourtine", type: R, region: "Bandol" },
  ]},
  { producer: "Miraval", country: "France", wines: [
    { name: "Miraval Rosé", type: Ro, region: "Côtes de Provence" },
  ]},
  { producer: "Domaine Ott", country: "France", wines: [
    { name: "Château de Selle Rosé", type: Ro, region: "Côtes de Provence" },
    { name: "Clos Mireille Rosé", type: Ro, region: "Côtes de Provence" },
  ]},
  { producer: "Gérard Bertrand", country: "France", wines: [
    { name: "Clos du Temple Rosé", type: Ro, region: "Languedoc" },
    { name: "Cigalus Rouge", type: R, region: "Languedoc" },
    { name: "Côte des Roses Rosé", type: Ro, region: "Languedoc" },
    { name: "Naturalys Chardonnay", type: W, region: "Languedoc" },
  ]},
  { producer: "Mas de Daumas Gassac", country: "France", wines: [
    { name: "Rouge", type: R, region: "Languedoc" },
    { name: "Blanc", type: W, region: "Languedoc" },
  ]},

  // ========== ITALY ==========
  { producer: "Antinori", country: "Italy", wines: [
    { name: "Tignanello", type: R, region: "Toscana" },
    { name: "Solaia", type: R, region: "Toscana" },
    { name: "Guado al Tasso", type: R, region: "Bolgheri" },
    { name: "Villa Antinori Rosso", type: R, region: "Toscana" },
    { name: "Pèppoli Chianti Classico", type: R, region: "Chianti Classico" },
    { name: "Santa Cristina Rosso", type: R, region: "Toscana" },
    { name: "Cervaro della Sala", type: W, region: "Umbria" },
  ]},
  { producer: "Tenuta San Guido", country: "Italy", wines: [
    { name: "Sassicaia", type: R, region: "Bolgheri" },
    { name: "Guidalberto", type: R, region: "Toscana" },
    { name: "Le Difese", type: R, region: "Toscana" },
  ]},
  { producer: "Ornellaia", country: "Italy", wines: [
    { name: "Ornellaia", type: R, region: "Bolgheri" },
    { name: "Le Serre Nuove dell'Ornellaia", type: R, region: "Bolgheri" },
    { name: "Le Volte dell'Ornellaia", type: R, region: "Toscana" },
  ]},
  { producer: "Masseto", country: "Italy", wines: [
    { name: "Masseto", type: R, region: "Toscana" },
    { name: "Massetino", type: R, region: "Toscana" },
  ]},
  { producer: "Giacomo Conterno", country: "Italy", wines: [
    { name: "Monfortino Riserva", type: R, region: "Barolo" },
    { name: "Barolo Francia", type: R, region: "Barolo" },
    { name: "Barbera d'Alba Francia", type: R, region: "Barbera d'Alba" },
  ]},
  { producer: "Gaja", country: "Italy", wines: [
    { name: "Barbaresco", type: R, region: "Barbaresco" },
    { name: "Sperss", type: R, region: "Barolo" },
    { name: "Sori San Lorenzo", type: R, region: "Langhe" },
    { name: "Sori Tildin", type: R, region: "Langhe" },
    { name: "Dagromis Barolo", type: R, region: "Barolo" },
  ]},
  { producer: "Bruno Giacosa", country: "Italy", wines: [
    { name: "Barolo Falletto", type: R, region: "Barolo" },
    { name: "Barbaresco Asili Riserva", type: R, region: "Barbaresco" },
    { name: "Roero Arneis", type: W, region: "Roero" },
  ]},
  { producer: "Vietti", country: "Italy", wines: [
    { name: "Barolo Castiglione", type: R, region: "Barolo" },
    { name: "Barolo Ravera", type: R, region: "Barolo" },
    { name: "Barbera d'Asti La Crena", type: R, region: "Barbera d'Asti" },
    { name: "Moscato d'Asti Cascinetta", type: D, region: "Moscato d'Asti" },
  ]},
  { producer: "Produttori del Barbaresco", country: "Italy", wines: [
    { name: "Barbaresco", type: R, region: "Barbaresco" },
    { name: "Barbaresco Riserva Montestefano", type: R, region: "Barbaresco" },
    { name: "Barbaresco Riserva Rabajà", type: R, region: "Barbaresco" },
    { name: "Langhe Nebbiolo", type: R, region: "Langhe" },
  ]},
  { producer: "Marchesi di Barolo", country: "Italy", wines: [
    { name: "Barolo Tradizione", type: R, region: "Barolo" },
    { name: "Barbera d'Alba", type: R, region: "Barbera d'Alba" },
  ]},
  { producer: "Fontanafredda", country: "Italy", wines: [
    { name: "Barolo Serralunga", type: R, region: "Barolo" },
    { name: "Barbaresco", type: R, region: "Barbaresco" },
    { name: "Gavi di Gavi", type: W, region: "Gavi" },
  ]},
  { producer: "Castello di Ama", country: "Italy", wines: [
    { name: "Chianti Classico Gran Selezione San Lorenzo", type: R, region: "Chianti Classico" },
    { name: "L'Apparita", type: R, region: "Toscana" },
  ]},
  { producer: "Frescobaldi", country: "Italy", wines: [
    { name: "Brunello di Montalcino Castelgiocondo", type: R, region: "Brunello di Montalcino" },
    { name: "Chianti Rufina Nipozzano Riserva", type: R, region: "Chianti Rufina" },
    { name: "Mormoreto", type: R, region: "Toscana" },
    { name: "Pomino Bianco", type: W, region: "Pomino" },
  ]},
  { producer: "Biondi-Santi", country: "Italy", wines: [
    { name: "Brunello di Montalcino Riserva", type: R, region: "Brunello di Montalcino" },
    { name: "Brunello di Montalcino Annata", type: R, region: "Brunello di Montalcino" },
    { name: "Rosso di Montalcino", type: R, region: "Rosso di Montalcino" },
  ]},
  { producer: "Banfi", country: "Italy", wines: [
    { name: "Brunello di Montalcino", type: R, region: "Brunello di Montalcino" },
    { name: "Rosso di Montalcino", type: R, region: "Rosso di Montalcino" },
    { name: "Chianti Classico", type: R, region: "Chianti Classico" },
    { name: "Rosa Regale Brachetto", type: S, region: "Brachetto d'Acqui" },
  ]},
  { producer: "Allegrini", country: "Italy", wines: [
    { name: "Amarone della Valpolicella Classico", type: R, region: "Amarone" },
    { name: "La Poja", type: R, region: "Veronese" },
    { name: "Palazzo della Torre", type: R, region: "Veronese" },
    { name: "Valpolicella Classico", type: R, region: "Valpolicella" },
  ]},
  { producer: "Masi", country: "Italy", wines: [
    { name: "Amarone Costasera", type: R, region: "Amarone" },
    { name: "Campofiorin", type: R, region: "Veronese" },
    { name: "Costasera Riserva", type: R, region: "Amarone" },
  ]},
  { producer: "Bertani", country: "Italy", wines: [
    { name: "Amarone Classico", type: R, region: "Amarone" },
    { name: "Valpolicella", type: R, region: "Valpolicella" },
  ]},
  { producer: "Planeta", country: "Italy", wines: [
    { name: "Chardonnay", type: W, region: "Sicilia" },
    { name: "Santa Cecilia Nero d'Avola", type: R, region: "Sicilia" },
    { name: "Cometa Fiano", type: W, region: "Sicilia" },
    { name: "Rosé", type: Ro, region: "Sicilia" },
  ]},
  { producer: "Donnafugata", country: "Italy", wines: [
    { name: "Ben Ryé Passito di Pantelleria", type: D, region: "Pantelleria" },
    { name: "Mille e Una Notte", type: R, region: "Sicilia" },
    { name: "Anthília", type: W, region: "Sicilia" },
  ]},
  { producer: "Elena Walch", country: "Italy", wines: [
    { name: "Beyond the Clouds", type: W, region: "Alto Adige" },
    { name: "Gewürztraminer Kastelaz", type: W, region: "Alto Adige" },
    { name: "Pinot Grigio Castel Ringberg", type: W, region: "Alto Adige" },
  ]},
  { producer: "Jermann", country: "Italy", wines: [
    { name: "Vintage Tunina", type: W, region: "Friuli" },
    { name: "Pinot Grigio", type: W, region: "Friuli" },
    { name: "Dreams", type: W, region: "Friuli" },
  ]},
  { producer: "Ferrari", country: "Italy", wines: [
    { name: "Maximum Brut", type: S, region: "Trento" },
    { name: "Giulio Ferrari Riserva del Fondatore", type: S, region: "Trento" },
    { name: "Perlé", type: S, region: "Trento" },
  ]},

  // ========== SPAIN ==========
  { producer: "Vega Sicilia", country: "Spain", wines: [
    { name: "Único", type: R, region: "Ribera del Duero" },
    { name: "Valbuena 5°", type: R, region: "Ribera del Duero" },
  ]},
  { producer: "Pingus", country: "Spain", wines: [
    { name: "Pingus", type: R, region: "Ribera del Duero" },
    { name: "Flor de Pingus", type: R, region: "Ribera del Duero" },
    { name: "PSI", type: R, region: "Ribera del Duero" },
  ]},
  { producer: "Alvaro Palacios", country: "Spain", wines: [
    { name: "L'Ermita", type: R, region: "Priorat" },
    { name: "Finca Dofí", type: R, region: "Priorat" },
    { name: "Les Terrasses", type: R, region: "Priorat" },
    { name: "Camins del Priorat", type: R, region: "Priorat" },
    { name: "La Baixada", type: R, region: "Bierzo" },
    { name: "Pétalos", type: R, region: "Bierzo" },
  ]},
  { producer: "López de Heredia", country: "Spain", wines: [
    { name: "Viña Tondonia Reserva", type: R, region: "Rioja" },
    { name: "Viña Tondonia Blanco Reserva", type: W, region: "Rioja" },
    { name: "Viña Bosconia Reserva", type: R, region: "Rioja" },
    { name: "Viña Cubillo Crianza", type: R, region: "Rioja" },
  ]},
  { producer: "La Rioja Alta", country: "Spain", wines: [
    { name: "Viña Ardanza Reserva", type: R, region: "Rioja" },
    { name: "Gran Reserva 904", type: R, region: "Rioja" },
    { name: "Gran Reserva 890", type: R, region: "Rioja" },
  ]},
  { producer: "Marqués de Murrieta", country: "Spain", wines: [
    { name: "Castillo Ygay Gran Reserva", type: R, region: "Rioja" },
    { name: "Reserva", type: R, region: "Rioja" },
    { name: "Capellanía Blanco Reserva", type: W, region: "Rioja" },
  ]},
  { producer: "CVNE (Cune)", country: "Spain", wines: [
    { name: "Imperial Gran Reserva", type: R, region: "Rioja" },
    { name: "Viña Real Crianza", type: R, region: "Rioja" },
    { name: "Cune Crianza", type: R, region: "Rioja" },
    { name: "Monopole Blanco", type: W, region: "Rioja" },
  ]},
  { producer: "Muga", country: "Spain", wines: [
    { name: "Prado Enea Gran Reserva", type: R, region: "Rioja" },
    { name: "Reserva", type: R, region: "Rioja" },
    { name: "Rosado", type: Ro, region: "Rioja" },
  ]},
  { producer: "Bodegas Roda", country: "Spain", wines: [
    { name: "Roda I Reserva", type: R, region: "Rioja" },
    { name: "Roda Reserva", type: R, region: "Rioja" },
    { name: "Cirsion", type: R, region: "Rioja" },
  ]},
  { producer: "Artadi", country: "Spain", wines: [
    { name: "Viñas de Gain", type: R, region: "Rioja" },
    { name: "El Carretil", type: R, region: "Rioja" },
  ]},
  { producer: "Bodegas Aalto", country: "Spain", wines: [
    { name: "Aalto", type: R, region: "Ribera del Duero" },
    { name: "Aalto PS", type: R, region: "Ribera del Duero" },
  ]},
  { producer: "Pesquera", country: "Spain", wines: [
    { name: "Crianza", type: R, region: "Ribera del Duero" },
    { name: "Reserva", type: R, region: "Ribera del Duero" },
    { name: "Janus Gran Reserva", type: R, region: "Ribera del Duero" },
  ]},
  { producer: "Clos Mogador", country: "Spain", wines: [
    { name: "Clos Mogador", type: R, region: "Priorat" },
  ]},
  { producer: "Bodegas Manzanos (LAN)", country: "Spain", wines: [
    { name: "LAN Crianza", type: R, region: "Rioja" },
    { name: "LAN Reserva", type: R, region: "Rioja" },
    { name: "LAN Gran Reserva", type: R, region: "Rioja" },
  ]},
  { producer: "Torres", country: "Spain", wines: [
    { name: "Mas La Plana", type: R, region: "Penedès" },
    { name: "Gran Coronas Reserva", type: R, region: "Penedès" },
    { name: "Viña Sol", type: W, region: "Penedès" },
    { name: "Celeste Crianza", type: R, region: "Ribera del Duero" },
  ]},

  // ========== USA: CALIFORNIA ==========
  { producer: "Opus One", country: "USA", wines: [
    { name: "Opus One", type: R, region: "Napa Valley" },
    { name: "Overture", type: R, region: "Napa Valley" },
  ]},
  { producer: "Ridge Vineyards", country: "USA", wines: [
    { name: "Monte Bello", type: R, region: "Santa Cruz Mountains" },
    { name: "Geyserville", type: R, region: "Sonoma County" },
    { name: "Lytton Springs", type: R, region: "Dry Creek Valley" },
    { name: "Three Valleys", type: R, region: "Sonoma County" },
    { name: "Estate Chardonnay", type: W, region: "Santa Cruz Mountains" },
  ]},
  { producer: "Caymus Vineyards", country: "USA", wines: [
    { name: "Napa Valley Cabernet Sauvignon", type: R, region: "Napa Valley" },
    { name: "Special Selection Cabernet", type: R, region: "Napa Valley" },
  ]},
  { producer: "Silver Oak", country: "USA", wines: [
    { name: "Alexander Valley Cabernet Sauvignon", type: R, region: "Alexander Valley" },
    { name: "Napa Valley Cabernet Sauvignon", type: R, region: "Napa Valley" },
  ]},
  { producer: "Jordan Winery", country: "USA", wines: [
    { name: "Cabernet Sauvignon", type: R, region: "Alexander Valley" },
    { name: "Chardonnay", type: W, region: "Russian River Valley" },
  ]},
  { producer: "Stag's Leap Wine Cellars", country: "USA", wines: [
    { name: "Cask 23 Cabernet Sauvignon", type: R, region: "Stags Leap District" },
    { name: "SLV Cabernet Sauvignon", type: R, region: "Stags Leap District" },
    { name: "Artemis Cabernet Sauvignon", type: R, region: "Napa Valley" },
    { name: "Hands of Time Red Blend", type: R, region: "Napa Valley" },
  ]},
  { producer: "Robert Mondavi", country: "USA", wines: [
    { name: "Reserve Cabernet Sauvignon", type: R, region: "Napa Valley" },
    { name: "Napa Valley Cabernet Sauvignon", type: R, region: "Napa Valley" },
    { name: "Fumé Blanc", type: W, region: "Napa Valley" },
    { name: "Woodbridge Cabernet Sauvignon", type: R, region: "California" },
  ]},
  { producer: "Duckhorn Vineyards", country: "USA", wines: [
    { name: "Merlot Napa Valley", type: R, region: "Napa Valley" },
    { name: "Cabernet Sauvignon Napa Valley", type: R, region: "Napa Valley" },
    { name: "Decoy Cabernet Sauvignon", type: R, region: "California" },
    { name: "Decoy Rosé", type: Ro, region: "California" },
    { name: "Decoy Sauvignon Blanc", type: W, region: "California" },
  ]},
  { producer: "Dominus Estate", country: "USA", wines: [
    { name: "Dominus", type: R, region: "Napa Valley" },
    { name: "Napanook", type: R, region: "Napa Valley" },
  ]},
  { producer: "Joseph Phelps", country: "USA", wines: [
    { name: "Insignia", type: R, region: "Napa Valley" },
    { name: "Cabernet Sauvignon Napa Valley", type: R, region: "Napa Valley" },
    { name: "Freestone Pinot Noir", type: R, region: "Sonoma Coast" },
  ]},
  { producer: "Shafer Vineyards", country: "USA", wines: [
    { name: "Hillside Select Cabernet", type: R, region: "Stags Leap District" },
    { name: "One Point Five Cabernet", type: R, region: "Stags Leap District" },
    { name: "Red Shoulder Ranch Chardonnay", type: W, region: "Carneros" },
    { name: "Relentless Syrah", type: R, region: "Napa Valley" },
  ]},
  { producer: "Heitz Cellar", country: "USA", wines: [
    { name: "Martha's Vineyard Cabernet", type: R, region: "Napa Valley" },
    { name: "Napa Valley Cabernet Sauvignon", type: R, region: "Napa Valley" },
  ]},
  { producer: "Far Niente", country: "USA", wines: [
    { name: "Cabernet Sauvignon", type: R, region: "Napa Valley" },
    { name: "Chardonnay", type: W, region: "Napa Valley" },
  ]},
  { producer: "Sine Qua Non", country: "USA", wines: [
    { name: "Syrah (current vintage)", type: R, region: "Central Coast" },
    { name: "Grenache (current vintage)", type: R, region: "Central Coast" },
  ]},
  { producer: "Screaming Eagle", country: "USA", wines: [
    { name: "Cabernet Sauvignon", type: R, region: "Napa Valley" },
    { name: "The Flight", type: R, region: "Napa Valley" },
  ]},
  { producer: "Harlan Estate", country: "USA", wines: [
    { name: "Harlan Estate", type: R, region: "Napa Valley" },
    { name: "The Maiden", type: R, region: "Napa Valley" },
  ]},
  { producer: "Kistler Vineyards", country: "USA", wines: [
    { name: "Vine Hill Vineyard Chardonnay", type: W, region: "Russian River Valley" },
    { name: "Sonoma Mountain Chardonnay", type: W, region: "Sonoma Mountain" },
    { name: "Pinot Noir Sonoma Coast", type: R, region: "Sonoma Coast" },
  ]},
  { producer: "Williams Selyem", country: "USA", wines: [
    { name: "Pinot Noir Russian River Valley", type: R, region: "Russian River Valley" },
    { name: "Pinot Noir Westside Road Neighbors", type: R, region: "Russian River Valley" },
    { name: "Chardonnay Russian River Valley", type: W, region: "Russian River Valley" },
  ]},
  { producer: "Ramey Wine Cellars", country: "USA", wines: [
    { name: "Chardonnay Russian River Valley", type: W, region: "Russian River Valley" },
    { name: "Cabernet Sauvignon Napa Valley", type: R, region: "Napa Valley" },
  ]},
  { producer: "Cakebread Cellars", country: "USA", wines: [
    { name: "Chardonnay Napa Valley", type: W, region: "Napa Valley" },
    { name: "Cabernet Sauvignon Napa Valley", type: R, region: "Napa Valley" },
    { name: "Sauvignon Blanc Napa Valley", type: W, region: "Napa Valley" },
  ]},
  { producer: "Orin Swift", country: "USA", wines: [
    { name: "The Prisoner Red Blend", type: R, region: "Napa Valley" },
    { name: "Papillon Bordeaux Blend", type: R, region: "Napa Valley" },
    { name: "Mercury Head Cabernet", type: R, region: "Napa Valley" },
    { name: "Machete Red Blend", type: R, region: "California" },
    { name: "Mannequin Chardonnay", type: W, region: "California" },
  ]},
  { producer: "Meiomi", country: "USA", wines: [
    { name: "Pinot Noir", type: R, region: "California" },
    { name: "Chardonnay", type: W, region: "California" },
    { name: "Rosé", type: Ro, region: "California" },
  ]},
  { producer: "La Crema", country: "USA", wines: [
    { name: "Sonoma Coast Pinot Noir", type: R, region: "Sonoma Coast" },
    { name: "Sonoma Coast Chardonnay", type: W, region: "Sonoma Coast" },
    { name: "Monterey Pinot Noir", type: R, region: "Monterey" },
  ]},
  { producer: "Kendall-Jackson", country: "USA", wines: [
    { name: "Vintner's Reserve Chardonnay", type: W, region: "California" },
    { name: "Grand Reserve Cabernet Sauvignon", type: R, region: "California" },
    { name: "Vintner's Reserve Pinot Noir", type: R, region: "California" },
  ]},
  { producer: "Josh Cellars", country: "USA", wines: [
    { name: "Cabernet Sauvignon", type: R, region: "California" },
    { name: "Chardonnay", type: W, region: "California" },
    { name: "Rosé", type: Ro, region: "California" },
  ]},
  { producer: "Daou Vineyards", country: "USA", wines: [
    { name: "Cabernet Sauvignon", type: R, region: "Paso Robles" },
    { name: "Soul of a Lion", type: R, region: "Paso Robles" },
    { name: "Discovery Cabernet", type: R, region: "Paso Robles" },
    { name: "Rosé", type: Ro, region: "Paso Robles" },
  ]},
  { producer: "Austin Hope", country: "USA", wines: [
    { name: "Cabernet Sauvignon", type: R, region: "Paso Robles" },
    { name: "Hope Family Treana Red", type: R, region: "Paso Robles" },
    { name: "Troublemaker Red Blend", type: R, region: "Paso Robles" },
  ]},

  // ========== USA: OREGON & WASHINGTON ==========
  { producer: "Domaine Drouhin Oregon", country: "USA", wines: [
    { name: "Pinot Noir Dundee Hills", type: R, region: "Willamette Valley" },
    { name: "Pinot Noir Laurène", type: R, region: "Willamette Valley" },
    { name: "Chardonnay Arthur", type: W, region: "Willamette Valley" },
  ]},
  { producer: "Ponzi Vineyards", country: "USA", wines: [
    { name: "Pinot Noir Willamette Valley", type: R, region: "Willamette Valley" },
    { name: "Pinot Gris", type: W, region: "Willamette Valley" },
  ]},
  { producer: "Cristom Vineyards", country: "USA", wines: [
    { name: "Pinot Noir Mt. Jefferson Cuvée", type: R, region: "Willamette Valley" },
    { name: "Pinot Noir Eileen Vineyard", type: R, region: "Eola-Amity Hills" },
  ]},
  { producer: "Quilceda Creek", country: "USA", wines: [
    { name: "Cabernet Sauvignon Columbia Valley", type: R, region: "Columbia Valley" },
  ]},
  { producer: "Chateau Ste. Michelle", country: "USA", wines: [
    { name: "Columbia Valley Riesling", type: W, region: "Columbia Valley" },
    { name: "Indian Wells Cabernet Sauvignon", type: R, region: "Columbia Valley" },
    { name: "Canoe Ridge Estate Chardonnay", type: W, region: "Horse Heaven Hills" },
  ]},
  { producer: "K Vintners", country: "USA", wines: [
    { name: "The Beautiful Syrah", type: R, region: "Walla Walla Valley" },
    { name: "Motor City Kitty Syrah", type: R, region: "Walla Walla Valley" },
  ]},

  // ========== AUSTRALIA ==========
  { producer: "Penfolds", country: "Australia", wines: [
    { name: "Grange", type: R, region: "South Australia" },
    { name: "Bin 389 Cabernet Shiraz", type: R, region: "South Australia" },
    { name: "Bin 707 Cabernet Sauvignon", type: R, region: "South Australia" },
    { name: "Bin 28 Kalimna Shiraz", type: R, region: "South Australia" },
    { name: "Bin 128 Coonawarra Shiraz", type: R, region: "Coonawarra" },
    { name: "Bin 311 Chardonnay", type: W, region: "Tumbarumba" },
    { name: "Max's Shiraz", type: R, region: "South Australia" },
    { name: "Koonunga Hill Shiraz Cabernet", type: R, region: "South Australia" },
  ]},
  { producer: "Henschke", country: "Australia", wines: [
    { name: "Hill of Grace Shiraz", type: R, region: "Eden Valley" },
    { name: "Mount Edelstone Shiraz", type: R, region: "Eden Valley" },
    { name: "Henry's Seven", type: R, region: "Barossa" },
    { name: "Julius Riesling", type: W, region: "Eden Valley" },
  ]},
  { producer: "Torbreck", country: "Australia", wines: [
    { name: "RunRig", type: R, region: "Barossa Valley" },
    { name: "The Struie Shiraz", type: R, region: "Barossa" },
    { name: "Woodcutter's Shiraz", type: R, region: "Barossa Valley" },
  ]},
  { producer: "Molly Dooker", country: "Australia", wines: [
    { name: "The Boxer Shiraz", type: R, region: "McLaren Vale" },
    { name: "Blue Eyed Boy Shiraz", type: R, region: "McLaren Vale" },
    { name: "Carnival of Love Shiraz", type: R, region: "McLaren Vale" },
  ]},
  { producer: "d'Arenberg", country: "Australia", wines: [
    { name: "The Dead Arm Shiraz", type: R, region: "McLaren Vale" },
    { name: "The Stump Jump Red", type: R, region: "McLaren Vale" },
    { name: "The Olive Grove Chardonnay", type: W, region: "McLaren Vale" },
  ]},
  { producer: "Leeuwin Estate", country: "Australia", wines: [
    { name: "Art Series Chardonnay", type: W, region: "Margaret River" },
    { name: "Art Series Cabernet Sauvignon", type: R, region: "Margaret River" },
  ]},
  { producer: "Vasse Felix", country: "Australia", wines: [
    { name: "Cabernet Sauvignon", type: R, region: "Margaret River" },
    { name: "Chardonnay", type: W, region: "Margaret River" },
    { name: "Filius Cabernet Sauvignon", type: R, region: "Margaret River" },
  ]},
  { producer: "Jim Barry", country: "Australia", wines: [
    { name: "The Armagh Shiraz", type: R, region: "Clare Valley" },
    { name: "The Lodge Hill Riesling", type: W, region: "Clare Valley" },
  ]},
  { producer: "Grosset", country: "Australia", wines: [
    { name: "Polish Hill Riesling", type: W, region: "Clare Valley" },
    { name: "Springvale Riesling", type: W, region: "Clare Valley" },
  ]},

  // ========== NEW ZEALAND ==========
  { producer: "Cloudy Bay", country: "New Zealand", wines: [
    { name: "Sauvignon Blanc", type: W, region: "Marlborough" },
    { name: "Te Koko", type: W, region: "Marlborough" },
    { name: "Pinot Noir", type: R, region: "Central Otago" },
    { name: "Chardonnay", type: W, region: "Marlborough" },
  ]},
  { producer: "Kim Crawford", country: "New Zealand", wines: [
    { name: "Sauvignon Blanc", type: W, region: "Marlborough" },
    { name: "Pinot Noir", type: R, region: "Marlborough" },
    { name: "Rosé", type: Ro, region: "Hawke's Bay" },
  ]},
  { producer: "Villa Maria", country: "New Zealand", wines: [
    { name: "Private Bin Sauvignon Blanc", type: W, region: "Marlborough" },
    { name: "Cellar Selection Pinot Noir", type: R, region: "Marlborough" },
    { name: "Reserve Chardonnay", type: W, region: "Hawke's Bay" },
  ]},
  { producer: "Craggy Range", country: "New Zealand", wines: [
    { name: "Te Muna Road Pinot Noir", type: R, region: "Martinborough" },
    { name: "Kidnappers Chardonnay", type: W, region: "Hawke's Bay" },
    { name: "Te Kahu Red Blend", type: R, region: "Hawke's Bay" },
  ]},
  { producer: "Felton Road", country: "New Zealand", wines: [
    { name: "Block 5 Pinot Noir", type: R, region: "Central Otago" },
    { name: "Bannockburn Pinot Noir", type: R, region: "Central Otago" },
    { name: "Block 2 Chardonnay", type: W, region: "Central Otago" },
    { name: "Riesling", type: W, region: "Central Otago" },
  ]},
  { producer: "Oyster Bay", country: "New Zealand", wines: [
    { name: "Sauvignon Blanc", type: W, region: "Marlborough" },
    { name: "Pinot Noir", type: R, region: "Marlborough" },
    { name: "Chardonnay", type: W, region: "Hawke's Bay" },
  ]},

  // ========== ARGENTINA ==========
  { producer: "Catena Zapata", country: "Argentina", wines: [
    { name: "Malbec Argentino", type: R, region: "Mendoza" },
    { name: "Adrianna Vineyard Mundus Bacillus Terrae", type: R, region: "Mendoza" },
    { name: "Nicolas Catena Zapata", type: R, region: "Mendoza" },
    { name: "White Bones Chardonnay", type: W, region: "Mendoza" },
    { name: "Catena High Mountain Vines Malbec", type: R, region: "Mendoza" },
    { name: "Catena Chardonnay", type: W, region: "Mendoza" },
  ]},
  { producer: "Achaval-Ferrer", country: "Argentina", wines: [
    { name: "Finca Altamira Malbec", type: R, region: "Mendoza" },
    { name: "Quimera Red Blend", type: R, region: "Mendoza" },
    { name: "Malbec", type: R, region: "Mendoza" },
  ]},
  { producer: "Zuccardi", country: "Argentina", wines: [
    { name: "Zuccardi Valle de Uco Malbec", type: R, region: "Valle de Uco" },
    { name: "Finca Piedra Infinita", type: R, region: "Valle de Uco" },
    { name: "Serie A Malbec", type: R, region: "Valle de Uco" },
    { name: "Tito Red Blend", type: R, region: "Valle de Uco" },
  ]},
  { producer: "Kaiken", country: "Argentina", wines: [
    { name: "Ultra Malbec", type: R, region: "Mendoza" },
    { name: "Terroir Series Malbec", type: R, region: "Mendoza" },
  ]},
  { producer: "Trapiche", country: "Argentina", wines: [
    { name: "Iscay Malbec-Cabernet Franc", type: R, region: "Mendoza" },
    { name: "Broquel Malbec", type: R, region: "Mendoza" },
    { name: "Malbec Oak Cask", type: R, region: "Mendoza" },
  ]},
  { producer: "Luigi Bosca", country: "Argentina", wines: [
    { name: "Malbec de Sangre", type: R, region: "Mendoza" },
    { name: "DOC Malbec", type: R, region: "Mendoza" },
  ]},

  // ========== CHILE ==========
  { producer: "Concha y Toro", country: "Chile", wines: [
    { name: "Don Melchor Cabernet Sauvignon", type: R, region: "Puente Alto" },
    { name: "Marqués de Casa Concha Cabernet", type: R, region: "Maipo Valley" },
    { name: "Casillero del Diablo Cabernet Sauvignon", type: R, region: "Central Valley" },
    { name: "Casillero del Diablo Chardonnay", type: W, region: "Central Valley" },
  ]},
  { producer: "Almaviva", country: "Chile", wines: [
    { name: "Almaviva", type: R, region: "Puente Alto" },
    { name: "EPU", type: R, region: "Puente Alto" },
  ]},
  { producer: "Viña Montes", country: "Chile", wines: [
    { name: "Montes Alpha Cabernet Sauvignon", type: R, region: "Colchagua Valley" },
    { name: "Montes Alpha M", type: R, region: "Apalta" },
    { name: "Montes Classic Malbec", type: R, region: "Colchagua Valley" },
    { name: "Outer Limits Sauvignon Blanc", type: W, region: "Zapallar" },
  ]},
  { producer: "Clos Apalta", country: "Chile", wines: [
    { name: "Clos Apalta", type: R, region: "Apalta" },
    { name: "Le Petit Clos", type: R, region: "Apalta" },
  ]},
  { producer: "Errázuriz", country: "Chile", wines: [
    { name: "Don Maximiano Founder's Reserve", type: R, region: "Aconcagua Valley" },
    { name: "Max Reserva Cabernet Sauvignon", type: R, region: "Aconcagua Valley" },
    { name: "Aconcagua Costa Sauvignon Blanc", type: W, region: "Aconcagua Costa" },
  ]},

  // ========== SOUTH AFRICA ==========
  { producer: "Kanonkop", country: "South Africa", wines: [
    { name: "Paul Sauer", type: R, region: "Stellenbosch" },
    { name: "Pinotage", type: R, region: "Stellenbosch" },
    { name: "Kadette Cape Blend", type: R, region: "Stellenbosch" },
  ]},
  { producer: "Mullineux", country: "South Africa", wines: [
    { name: "Old Vines White Blend", type: W, region: "Swartland" },
    { name: "Syrah", type: R, region: "Swartland" },
    { name: "Kloof Street Rouge", type: R, region: "Swartland" },
  ]},
  { producer: "Meerlust", country: "South Africa", wines: [
    { name: "Rubicon", type: R, region: "Stellenbosch" },
    { name: "Chardonnay", type: W, region: "Stellenbosch" },
  ]},
  { producer: "Ken Forrester", country: "South Africa", wines: [
    { name: "The FMC Chenin Blanc", type: W, region: "Stellenbosch" },
    { name: "Old Vine Reserve Chenin Blanc", type: W, region: "Stellenbosch" },
  ]},

  // ========== PORTUGAL ==========
  { producer: "Taylor's", country: "Portugal", wines: [
    { name: "Vintage Port", type: D, region: "Douro" },
    { name: "20 Year Old Tawny", type: D, region: "Douro" },
    { name: "Late Bottled Vintage", type: D, region: "Douro" },
    { name: "Chip Dry White Port", type: D, region: "Douro" },
  ]},
  { producer: "Graham's", country: "Portugal", wines: [
    { name: "Six Grapes Reserve Port", type: D, region: "Douro" },
    { name: "20 Year Old Tawny", type: D, region: "Douro" },
    { name: "Vintage Port", type: D, region: "Douro" },
  ]},
  { producer: "Quinta do Noval", country: "Portugal", wines: [
    { name: "Nacional Vintage Port", type: D, region: "Douro" },
    { name: "Vintage Port", type: D, region: "Douro" },
    { name: "Cedro do Noval", type: R, region: "Douro" },
  ]},
  { producer: "Quinta do Vallado", country: "Portugal", wines: [
    { name: "Tinto Reserva", type: R, region: "Douro" },
    { name: "Adelaide", type: R, region: "Douro" },
  ]},
  { producer: "Niepoort", country: "Portugal", wines: [
    { name: "Batuta", type: R, region: "Douro" },
    { name: "Redoma Tinto", type: R, region: "Douro" },
    { name: "Drink Me Nat'Cool Rosé", type: Ro, region: "Bairrada" },
  ]},

  // ========== GERMANY ==========
  { producer: "Egon Müller", country: "Germany", wines: [
    { name: "Scharzhofberger Riesling Kabinett", type: W, region: "Mosel" },
    { name: "Scharzhofberger Riesling Spätlese", type: W, region: "Mosel" },
  ]},
  { producer: "Joh. Jos. Prüm", country: "Germany", wines: [
    { name: "Wehlener Sonnenuhr Riesling Spätlese", type: W, region: "Mosel" },
    { name: "Wehlener Sonnenuhr Riesling Kabinett", type: W, region: "Mosel" },
    { name: "Wehlener Sonnenuhr Riesling Auslese", type: D, region: "Mosel" },
  ]},
  { producer: "Dr. Loosen", country: "Germany", wines: [
    { name: "Erdener Prälat Riesling Auslese", type: D, region: "Mosel" },
    { name: "Wehlener Sonnenuhr Riesling Spätlese", type: W, region: "Mosel" },
    { name: "Dr. L Riesling", type: W, region: "Mosel" },
    { name: "Blue Slate Riesling Kabinett", type: W, region: "Mosel" },
  ]},
  { producer: "Dönnhoff", country: "Germany", wines: [
    { name: "Oberhäuser Brücke Riesling Spätlese", type: W, region: "Nahe" },
    { name: "Tonschiefer Riesling", type: W, region: "Nahe" },
  ]},
  { producer: "Robert Weil", country: "Germany", wines: [
    { name: "Kiedrich Gräfenberg Riesling Spätlese", type: W, region: "Rheingau" },
    { name: "Riesling Tradition", type: W, region: "Rheingau" },
  ]},

  // ========== AUSTRIA ==========
  { producer: "Domäne Wachau", country: "Austria", wines: [
    { name: "Grüner Veltliner Smaragd Kellerberg", type: W, region: "Wachau" },
    { name: "Riesling Smaragd Achleiten", type: W, region: "Wachau" },
  ]},
  { producer: "F.X. Pichler", country: "Austria", wines: [
    { name: "Grüner Veltliner Smaragd M", type: W, region: "Wachau" },
    { name: "Riesling Smaragd Unendlich", type: W, region: "Wachau" },
  ]},
  { producer: "Bründlmayer", country: "Austria", wines: [
    { name: "Grüner Veltliner Lamm", type: W, region: "Kamptal" },
    { name: "Riesling Heiligenstein", type: W, region: "Kamptal" },
  ]},
];

  // ========== USA: EVERYDAY & VALUE ($10-40) ==========
  { producer: "Apothic", country: "USA", wines: [
    { name: "Red Blend", type: R, region: "California" },
    { name: "Dark Red Blend", type: R, region: "California" },
    { name: "Crush Red Blend", type: R, region: "California" },
    { name: "Inferno Red Blend", type: R, region: "California" },
    { name: "Rosé", type: Ro, region: "California" },
  ]},
  { producer: "Barefoot Cellars", country: "USA", wines: [
    { name: "Cabernet Sauvignon", type: R, region: "California" },
    { name: "Pinot Grigio", type: W, region: "California" },
    { name: "Moscato", type: W, region: "California" },
    { name: "Chardonnay", type: W, region: "California" },
    { name: "Merlot", type: R, region: "California" },
    { name: "Pink Moscato", type: Ro, region: "California" },
  ]},
  { producer: "19 Crimes", country: "Australia", wines: [
    { name: "Red Blend", type: R, region: "South Eastern Australia" },
    { name: "Cabernet Sauvignon", type: R, region: "South Eastern Australia" },
    { name: "Snoop Cali Red", type: R, region: "California" },
    { name: "The Punishment Pinot Noir", type: R, region: "South Eastern Australia" },
    { name: "Sauvignon Blanc", type: W, region: "South Eastern Australia" },
  ]},
  { producer: "Yellow Tail", country: "Australia", wines: [
    { name: "Shiraz", type: R, region: "South Eastern Australia" },
    { name: "Chardonnay", type: W, region: "South Eastern Australia" },
    { name: "Cabernet Sauvignon", type: R, region: "South Eastern Australia" },
    { name: "Pinot Grigio", type: W, region: "South Eastern Australia" },
    { name: "Merlot", type: R, region: "South Eastern Australia" },
  ]},
  { producer: "Dark Horse", country: "USA", wines: [
    { name: "Cabernet Sauvignon", type: R, region: "California" },
    { name: "Big Red Blend", type: R, region: "California" },
    { name: "Chardonnay", type: W, region: "California" },
  ]},
  { producer: "Gnarly Head", country: "USA", wines: [
    { name: "Old Vine Zinfandel", type: R, region: "Lodi" },
    { name: "Cabernet Sauvignon", type: R, region: "California" },
    { name: "Pinot Noir", type: R, region: "California" },
  ]},
  { producer: "Bogle", country: "USA", wines: [
    { name: "Phantom Red Blend", type: R, region: "California" },
    { name: "Old Vine Zinfandel", type: R, region: "California" },
    { name: "Merlot", type: R, region: "California" },
    { name: "Chardonnay", type: W, region: "California" },
    { name: "Essential Red", type: R, region: "California" },
    { name: "Petite Sirah", type: R, region: "California" },
    { name: "Sauvignon Blanc", type: W, region: "California" },
  ]},
  { producer: "14 Hands", country: "USA", wines: [
    { name: "Hot to Trot Red Blend", type: R, region: "Washington" },
    { name: "Cabernet Sauvignon", type: R, region: "Washington" },
    { name: "Chardonnay", type: W, region: "Washington" },
  ]},
  { producer: "Columbia Crest", country: "USA", wines: [
    { name: "Grand Estates Cabernet Sauvignon", type: R, region: "Columbia Valley" },
    { name: "H3 Cabernet Sauvignon", type: R, region: "Horse Heaven Hills" },
    { name: "Grand Estates Chardonnay", type: W, region: "Columbia Valley" },
    { name: "Grand Estates Merlot", type: R, region: "Columbia Valley" },
  ]},
  { producer: "Mark West", country: "USA", wines: [
    { name: "Pinot Noir", type: R, region: "California" },
    { name: "Chardonnay", type: W, region: "California" },
  ]},
  { producer: "Bread & Butter", country: "USA", wines: [
    { name: "Chardonnay", type: W, region: "California" },
    { name: "Pinot Noir", type: R, region: "California" },
    { name: "Cabernet Sauvignon", type: R, region: "California" },
  ]},
  { producer: "Butter (JaM Cellars)", country: "USA", wines: [
    { name: "Chardonnay", type: W, region: "California" },
    { name: "Cabernet Sauvignon", type: R, region: "California" },
  ]},
  { producer: "Conundrum", country: "USA", wines: [
    { name: "Red Blend", type: R, region: "California" },
    { name: "White Blend", type: W, region: "California" },
  ]},
  { producer: "Educated Guess", country: "USA", wines: [
    { name: "Cabernet Sauvignon", type: R, region: "Napa Valley" },
    { name: "Chardonnay", type: W, region: "Napa Valley" },
  ]},
  { producer: "Joel Gott", country: "USA", wines: [
    { name: "815 Cabernet Sauvignon", type: R, region: "California" },
    { name: "Chardonnay", type: W, region: "California" },
    { name: "Pinot Noir", type: R, region: "California" },
    { name: "Sauvignon Blanc", type: W, region: "California" },
  ]},
  { producer: "Locations", country: "USA", wines: [
    { name: "CA California Red", type: R, region: "California" },
    { name: "OR Oregon Pinot Noir", type: R, region: "Oregon" },
    { name: "E Spanish Red", type: R, region: "Spain" },
    { name: "F French Red", type: R, region: "France" },
  ]},
  { producer: "The Velvet Devil (Charles Smith)", country: "USA", wines: [
    { name: "Merlot", type: R, region: "Washington" },
  ]},
  { producer: "Charles Smith Wines", country: "USA", wines: [
    { name: "Boom Boom Syrah", type: R, region: "Washington" },
    { name: "Kung Fu Girl Riesling", type: W, region: "Washington" },
    { name: "Eve Chardonnay", type: W, region: "Washington" },
    { name: "Chateau Smith Cabernet", type: R, region: "Washington" },
  ]},
  { producer: "Erath", country: "USA", wines: [
    { name: "Pinot Noir Oregon", type: R, region: "Oregon" },
    { name: "Pinot Noir Dundee Hills", type: R, region: "Dundee Hills" },
    { name: "Pinot Gris", type: W, region: "Oregon" },
  ]},
  { producer: "A to Z Wineworks", country: "USA", wines: [
    { name: "Pinot Noir Oregon", type: R, region: "Oregon" },
    { name: "Pinot Gris", type: W, region: "Oregon" },
    { name: "Chardonnay", type: W, region: "Oregon" },
  ]},
  { producer: "Willamette Valley Vineyards", country: "USA", wines: [
    { name: "Pinot Noir", type: R, region: "Willamette Valley" },
    { name: "Riesling", type: W, region: "Willamette Valley" },
    { name: "Whole Cluster Pinot Noir", type: R, region: "Willamette Valley" },
  ]},
  { producer: "Beringer", country: "USA", wines: [
    { name: "Knights Valley Cabernet Sauvignon", type: R, region: "Knights Valley" },
    { name: "Founders' Estate Cabernet Sauvignon", type: R, region: "California" },
    { name: "Private Reserve Cabernet", type: R, region: "Napa Valley" },
    { name: "Founders' Estate Chardonnay", type: W, region: "California" },
  ]},
  { producer: "Hess Collection", country: "USA", wines: [
    { name: "Allomi Cabernet Sauvignon", type: R, region: "Napa Valley" },
    { name: "Select Chardonnay", type: W, region: "Monterey" },
    { name: "Shirtail Creek Pinot Noir", type: R, region: "Monterey" },
  ]},
  { producer: "Frog's Leap", country: "USA", wines: [
    { name: "Cabernet Sauvignon", type: R, region: "Napa Valley" },
    { name: "Sauvignon Blanc", type: W, region: "Napa Valley" },
    { name: "Zinfandel", type: R, region: "Napa Valley" },
    { name: "Merlot", type: R, region: "Napa Valley" },
  ]},
  { producer: "Francis Ford Coppola", country: "USA", wines: [
    { name: "Diamond Collection Claret", type: R, region: "California" },
    { name: "Director's Cut Cabernet Sauvignon", type: R, region: "Sonoma" },
    { name: "Sofia Rosé", type: Ro, region: "Monterey" },
    { name: "Diamond Collection Pinot Noir", type: R, region: "California" },
  ]},
  { producer: "SIMI", country: "USA", wines: [
    { name: "Cabernet Sauvignon", type: R, region: "Alexander Valley" },
    { name: "Chardonnay", type: W, region: "Sonoma County" },
    { name: "Sauvignon Blanc", type: W, region: "Sonoma County" },
  ]},
  { producer: "Rodney Strong", country: "USA", wines: [
    { name: "Cabernet Sauvignon Sonoma County", type: R, region: "Sonoma County" },
    { name: "Chardonnay Sonoma County", type: W, region: "Sonoma County" },
    { name: "Pinot Noir Russian River Valley", type: R, region: "Russian River Valley" },
    { name: "Alexander's Crown Cabernet", type: R, region: "Alexander Valley" },
  ]},
  { producer: "Seghesio", country: "USA", wines: [
    { name: "Sonoma Zinfandel", type: R, region: "Sonoma County" },
    { name: "Old Vine Zinfandel", type: R, region: "Sonoma County" },
    { name: "Cortina Zinfandel", type: R, region: "Dry Creek Valley" },
  ]},
  { producer: "Bonanza by Chuck Wagner", country: "USA", wines: [
    { name: "Cabernet Sauvignon Lot 6", type: R, region: "California" },
  ]},
  { producer: "Cannonball", country: "USA", wines: [
    { name: "Cabernet Sauvignon", type: R, region: "California" },
    { name: "Chardonnay", type: W, region: "California" },
    { name: "Sauvignon Blanc", type: W, region: "California" },
  ]},
  { producer: "Decoy (Duckhorn)", country: "USA", wines: [
    { name: "Cabernet Sauvignon", type: R, region: "Sonoma County" },
    { name: "Merlot", type: R, region: "Sonoma County" },
    { name: "Chardonnay", type: W, region: "Sonoma County" },
    { name: "Pinot Noir", type: R, region: "Sonoma County" },
    { name: "Sauvignon Blanc", type: W, region: "Sonoma County" },
    { name: "Red Blend", type: R, region: "Sonoma County" },
    { name: "Rosé", type: Ro, region: "Sonoma County" },
  ]},
  { producer: "Prisoner Wine Company", country: "USA", wines: [
    { name: "The Prisoner Red Blend", type: R, region: "Napa Valley" },
    { name: "Blindfold White Blend", type: W, region: "California" },
    { name: "Saldo Zinfandel", type: R, region: "California" },
    { name: "Unshackled Cabernet Sauvignon", type: R, region: "California" },
    { name: "Unshackled Red Blend", type: R, region: "California" },
    { name: "Unshackled Rosé", type: Ro, region: "California" },
  ]},
  { producer: "Wente Vineyards", country: "USA", wines: [
    { name: "Morning Fog Chardonnay", type: W, region: "Livermore Valley" },
    { name: "Southern Hills Cabernet Sauvignon", type: R, region: "Livermore Valley" },
  ]},
  { producer: "Whitehaven", country: "New Zealand", wines: [
    { name: "Sauvignon Blanc", type: W, region: "Marlborough" },
    { name: "Pinot Noir", type: R, region: "Marlborough" },
  ]},
  { producer: "Matua", country: "New Zealand", wines: [
    { name: "Sauvignon Blanc", type: W, region: "Marlborough" },
    { name: "Pinot Noir", type: R, region: "Marlborough" },
  ]},
  { producer: "Nobilo", country: "New Zealand", wines: [
    { name: "Sauvignon Blanc", type: W, region: "Marlborough" },
  ]},
  { producer: "Brancott Estate", country: "New Zealand", wines: [
    { name: "Sauvignon Blanc", type: W, region: "Marlborough" },
    { name: "Pinot Noir", type: R, region: "Marlborough" },
  ]},

  // ========== MORE ITALY: EVERYDAY ==========
  { producer: "Santa Margherita", country: "Italy", wines: [
    { name: "Pinot Grigio Alto Adige", type: W, region: "Alto Adige" },
    { name: "Chianti Classico", type: R, region: "Chianti Classico" },
    { name: "Prosecco Superiore Valdobbiadene", type: S, region: "Valdobbiadene" },
  ]},
  { producer: "Ruffino", country: "Italy", wines: [
    { name: "Chianti Classico Riserva Ducale Oro", type: R, region: "Chianti Classico" },
    { name: "Chianti Classico Riserva Ducale", type: R, region: "Chianti Classico" },
    { name: "Chianti", type: R, region: "Chianti" },
    { name: "Prosecco", type: S, region: "Veneto" },
    { name: "Lumina Pinot Grigio", type: W, region: "Delle Venezie" },
  ]},
  { producer: "Mezzacorona", country: "Italy", wines: [
    { name: "Pinot Grigio", type: W, region: "Trentino" },
    { name: "Pinot Noir", type: R, region: "Trentino" },
  ]},
  { producer: "Cavit", country: "Italy", wines: [
    { name: "Pinot Grigio", type: W, region: "Delle Venezie" },
    { name: "Pinot Noir", type: R, region: "Trentino" },
  ]},
  { producer: "La Marca", country: "Italy", wines: [
    { name: "Prosecco", type: S, region: "Veneto" },
    { name: "Prosecco Luminore", type: S, region: "Valdobbiadene" },
  ]},
  { producer: "Zonin", country: "Italy", wines: [
    { name: "Prosecco", type: S, region: "Veneto" },
    { name: "Pinot Grigio", type: W, region: "Delle Venezie" },
    { name: "Chianti Classico", type: R, region: "Chianti Classico" },
    { name: "Amarone", type: R, region: "Amarone" },
  ]},
  { producer: "Mionetto", country: "Italy", wines: [
    { name: "Prosecco Brut", type: S, region: "Veneto" },
    { name: "Il Prosecco Organic", type: S, region: "Veneto" },
  ]},
  { producer: "Castello di Monsanto", country: "Italy", wines: [
    { name: "Chianti Classico Riserva", type: R, region: "Chianti Classico" },
    { name: "Nemo Cabernet Sauvignon", type: R, region: "Toscana" },
  ]},
  { producer: "Tenuta di Arceno", country: "Italy", wines: [
    { name: "Chianti Classico", type: R, region: "Chianti Classico" },
    { name: "Arcanum", type: R, region: "Toscana" },
  ]},
  { producer: "Col d'Orcia", country: "Italy", wines: [
    { name: "Brunello di Montalcino", type: R, region: "Brunello di Montalcino" },
    { name: "Rosso di Montalcino", type: R, region: "Rosso di Montalcino" },
  ]},
  { producer: "Renato Ratti", country: "Italy", wines: [
    { name: "Barolo Marcenasco", type: R, region: "Barolo" },
    { name: "Nebbiolo d'Alba", type: R, region: "Langhe" },
    { name: "Barbera d'Asti", type: R, region: "Barbera d'Asti" },
  ]},
  { producer: "Pio Cesare", country: "Italy", wines: [
    { name: "Barolo", type: R, region: "Barolo" },
    { name: "Barbaresco", type: R, region: "Barbaresco" },
    { name: "Barbera d'Alba", type: R, region: "Barbera d'Alba" },
  ]},

  // ========== MORE SPAIN: EVERYDAY ==========
  { producer: "Marqués de Cáceres", country: "Spain", wines: [
    { name: "Crianza", type: R, region: "Rioja" },
    { name: "Reserva", type: R, region: "Rioja" },
    { name: "Rosado", type: Ro, region: "Rioja" },
    { name: "Verdejo", type: W, region: "Rueda" },
  ]},
  { producer: "Campo Viejo", country: "Spain", wines: [
    { name: "Tempranillo", type: R, region: "Rioja" },
    { name: "Crianza", type: R, region: "Rioja" },
    { name: "Reserva", type: R, region: "Rioja" },
    { name: "Garnacha", type: R, region: "Rioja" },
    { name: "Cava Brut Reserva", type: S, region: "Cava" },
  ]},
  { producer: "Bodegas Beronia", country: "Spain", wines: [
    { name: "Crianza", type: R, region: "Rioja" },
    { name: "Reserva", type: R, region: "Rioja" },
    { name: "Gran Reserva", type: R, region: "Rioja" },
  ]},
  { producer: "Bodegas Ramón Bilbao", country: "Spain", wines: [
    { name: "Crianza", type: R, region: "Rioja" },
    { name: "Reserva", type: R, region: "Rioja" },
    { name: "Limited Edition", type: R, region: "Rioja" },
    { name: "Albariño", type: W, region: "Rías Baixas" },
  ]},
  { producer: "Bodegas Faustino", country: "Spain", wines: [
    { name: "Faustino I Gran Reserva", type: R, region: "Rioja" },
    { name: "Faustino V Reserva", type: R, region: "Rioja" },
    { name: "Faustino VII", type: R, region: "Rioja" },
  ]},
  { producer: "Bodegas Protos", country: "Spain", wines: [
    { name: "Crianza", type: R, region: "Ribera del Duero" },
    { name: "Reserva", type: R, region: "Ribera del Duero" },
    { name: "Roble", type: R, region: "Ribera del Duero" },
    { name: "Verdejo", type: W, region: "Rueda" },
  ]},
  { producer: "Emilio Moro", country: "Spain", wines: [
    { name: "Emilio Moro", type: R, region: "Ribera del Duero" },
    { name: "Malleolus", type: R, region: "Ribera del Duero" },
    { name: "Finca Resalso", type: R, region: "Ribera del Duero" },
  ]},
  { producer: "Martín Códax", country: "Spain", wines: [
    { name: "Albariño", type: W, region: "Rías Baixas" },
    { name: "Lías Albariño", type: W, region: "Rías Baixas" },
  ]},
  { producer: "Freixenet", country: "Spain", wines: [
    { name: "Cordon Negro Brut", type: S, region: "Cava" },
    { name: "Elyssia Gran Cuvée", type: S, region: "Cava" },
    { name: "Italian Rosé", type: S, region: "Veneto" },
  ]},
  { producer: "Codorníu", country: "Spain", wines: [
    { name: "Anna de Codorníu Brut", type: S, region: "Cava" },
    { name: "Clasico Brut", type: S, region: "Cava" },
  ]},

  // ========== MORE FRANCE: EVERYDAY ==========
  { producer: "Louis Latour", country: "France", wines: [
    { name: "Ardèche Chardonnay", type: W, region: "Ardèche" },
    { name: "Ardèche Pinot Noir", type: R, region: "Ardèche" },
  ]},
  { producer: "Château de Lancyre", country: "France", wines: [
    { name: "Pic Saint-Loup Rouge", type: R, region: "Languedoc" },
    { name: "Pic Saint-Loup Rosé", type: Ro, region: "Languedoc" },
  ]},
  { producer: "Domaines Paul Mas", country: "France", wines: [
    { name: "Cabernet Sauvignon Réserve", type: R, region: "Languedoc" },
    { name: "Chardonnay Réserve", type: W, region: "Languedoc" },
    { name: "Rosé de Syrah", type: Ro, region: "Languedoc" },
    { name: "Malbec", type: R, region: "Languedoc" },
  ]},
  { producer: "Hugel", country: "France", wines: [
    { name: "Gentil", type: W, region: "Alsace" },
    { name: "Riesling Classic", type: W, region: "Alsace" },
  ]},
  { producer: "Famille Perrin", country: "France", wines: [
    { name: "Côtes du Rhône Réserve Rouge", type: R, region: "Côtes du Rhône" },
    { name: "Côtes du Rhône Réserve Blanc", type: W, region: "Côtes du Rhône" },
    { name: "La Vieille Ferme Rouge", type: R, region: "Ventoux" },
    { name: "La Vieille Ferme Rosé", type: Ro, region: "Ventoux" },
    { name: "La Vieille Ferme Blanc", type: W, region: "Luberon" },
  ]},
  { producer: "Michel Chapoutier", country: "France", wines: [
    { name: "Bila-Haut Rouge", type: R, region: "Languedoc" },
    { name: "Bila-Haut Rosé", type: Ro, region: "Languedoc" },
    { name: "Belleruche Côtes du Rhône", type: R, region: "Côtes du Rhône" },
  ]},
  { producer: "Domaine de la Côte de l'Ange", country: "France", wines: [
    { name: "Châteauneuf-du-Pape", type: R, region: "Châteauneuf-du-Pape" },
  ]},

  // ========== MORE ARGENTINA/CHILE: EVERYDAY ==========
  { producer: "Alamos (Catena)", country: "Argentina", wines: [
    { name: "Malbec", type: R, region: "Mendoza" },
    { name: "Cabernet Sauvignon", type: R, region: "Mendoza" },
    { name: "Chardonnay", type: W, region: "Mendoza" },
  ]},
  { producer: "Malbec de Gascoigne", country: "Argentina", wines: [
    { name: "Malbec", type: R, region: "Mendoza" },
  ]},
  { producer: "Terrazas de los Andes", country: "Argentina", wines: [
    { name: "Reserva Malbec", type: R, region: "Mendoza" },
    { name: "Grand Malbec", type: R, region: "Mendoza" },
    { name: "Reserva Cabernet Sauvignon", type: R, region: "Mendoza" },
    { name: "Reserva Chardonnay", type: W, region: "Mendoza" },
  ]},
  { producer: "Trivento", country: "Argentina", wines: [
    { name: "Golden Reserve Malbec", type: R, region: "Mendoza" },
    { name: "Reserve Malbec", type: R, region: "Mendoza" },
  ]},
  { producer: "Bodega Norton", country: "Argentina", wines: [
    { name: "Malbec Reserva", type: R, region: "Mendoza" },
    { name: "Barrel Select Malbec", type: R, region: "Mendoza" },
    { name: "Lo Tengo Malbec", type: R, region: "Mendoza" },
  ]},
  { producer: "Santa Rita", country: "Chile", wines: [
    { name: "120 Cabernet Sauvignon", type: R, region: "Central Valley" },
    { name: "Medalla Real Cabernet Sauvignon", type: R, region: "Maipo Valley" },
    { name: "Reserva Sauvignon Blanc", type: W, region: "Central Valley" },
  ]},
  { producer: "Viña Undurraga", country: "Chile", wines: [
    { name: "T.H. Cabernet Sauvignon", type: R, region: "Maipo Valley" },
    { name: "Sibaris Pinot Noir", type: R, region: "Leyda Valley" },
    { name: "Aliwen Reserva Cabernet/Carmenère", type: R, region: "Central Valley" },
  ]},
  { producer: "Carmen", country: "Chile", wines: [
    { name: "Gran Reserva Cabernet Sauvignon", type: R, region: "Maipo Valley" },
    { name: "Insigne Carmenère", type: R, region: "Central Valley" },
  ]},
  { producer: "Cono Sur", country: "Chile", wines: [
    { name: "Bicicleta Pinot Noir", type: R, region: "Central Valley" },
    { name: "20 Barrels Pinot Noir", type: R, region: "Casablanca Valley" },
    { name: "Bicicleta Sauvignon Blanc", type: W, region: "Central Valley" },
    { name: "Bicicleta Cabernet Sauvignon", type: R, region: "Central Valley" },
  ]},
  { producer: "Viña Ventisquero", country: "Chile", wines: [
    { name: "Grey Glacier Cabernet Sauvignon", type: R, region: "Maipo Valley" },
    { name: "Reserva Carmenère", type: R, region: "Rapel Valley" },
  ]},

  // ========== MORE ROSÉ ==========
  { producer: "AIX", country: "France", wines: [
    { name: "AIX Rosé", type: Ro, region: "Coteaux d'Aix-en-Provence" },
  ]},
  { producer: "Minuty", country: "France", wines: [
    { name: "M de Minuty Rosé", type: Ro, region: "Côtes de Provence" },
    { name: "Minuty 281 Rosé", type: Ro, region: "Côtes de Provence" },
  ]},
  { producer: "Château Léoube", country: "France", wines: [
    { name: "Love by Léoube Rosé", type: Ro, region: "Côtes de Provence" },
    { name: "Rosé de Léoube", type: Ro, region: "Côtes de Provence" },
  ]},
  { producer: "Hampton Water", country: "France", wines: [
    { name: "Hampton Water Rosé", type: Ro, region: "Languedoc" },
  ]},
  { producer: "Studio by Miraval", country: "France", wines: [
    { name: "Rosé", type: Ro, region: "Méditerranée" },
  ]},
  { producer: "Summer Water", country: "France", wines: [
    { name: "Rosé", type: Ro, region: "Languedoc" },
  ]},
  { producer: "Wolffer Estate", country: "USA", wines: [
    { name: "Summer in a Bottle Rosé", type: Ro, region: "Long Island" },
    { name: "Estate Rosé", type: Ro, region: "Long Island" },
  ]},

  // ========== ORANGE / NATURAL ==========
  { producer: "Radikon", country: "Italy", wines: [
    { name: "Ribolla Gialla", type: O, region: "Friuli" },
    { name: "Oslavje", type: O, region: "Friuli" },
  ]},
  { producer: "Gravner", country: "Italy", wines: [
    { name: "Ribolla Anfora", type: O, region: "Friuli" },
    { name: "Breg Anfora", type: O, region: "Friuli" },
  ]},
  { producer: "COS", country: "Italy", wines: [
    { name: "Pithos Bianco", type: O, region: "Sicilia" },
    { name: "Cerasuolo di Vittoria", type: R, region: "Sicilia" },
  ]},
  { producer: "Frank Cornelissen", country: "Italy", wines: [
    { name: "Munjebel Rosso", type: R, region: "Etna" },
    { name: "Munjebel Bianco", type: W, region: "Etna" },
  ]},
  { producer: "Gut Oggau", country: "Austria", wines: [
    { name: "Theodora", type: Ro, region: "Burgenland" },
    { name: "Bertholdi", type: R, region: "Burgenland" },
    { name: "Winifred", type: W, region: "Burgenland" },
  ]},
  { producer: "Pheasant's Tears", country: "Georgia", wines: [
    { name: "Rkatsiteli Amber", type: O, region: "Kakheti" },
    { name: "Saperavi", type: R, region: "Kakheti" },
  ]},

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

  // ========== USA: MID-RANGE CALIFORNIA ($20-60) ==========
  { producer: "Stags' Leap Winery", country: "USA", wines: [{ name: "Cabernet Sauvignon Napa", type: R, region: "Napa Valley" }, { name: "Petite Sirah", type: R, region: "Napa Valley" }, { name: "Merlot", type: R, region: "Napa Valley" }]},
  { producer: "Pine Ridge", country: "USA", wines: [{ name: "Cabernet Sauvignon Napa", type: R, region: "Napa Valley" }, { name: "Chenin Blanc + Viognier", type: W, region: "California" }]},
  { producer: "Girard", country: "USA", wines: [{ name: "Old Vine Zinfandel", type: R, region: "Napa Valley" }, { name: "Artistry Red Blend", type: R, region: "Napa Valley" }]},
  { producer: "Groth", country: "USA", wines: [{ name: "Cabernet Sauvignon", type: R, region: "Napa Valley" }, { name: "Sauvignon Blanc", type: W, region: "Napa Valley" }]},
  { producer: "Flowers Vineyards", country: "USA", wines: [{ name: "Pinot Noir Sonoma Coast", type: R, region: "Sonoma Coast" }, { name: "Chardonnay Sonoma Coast", type: W, region: "Sonoma Coast" }]},
  { producer: "Patz & Hall", country: "USA", wines: [{ name: "Pinot Noir Sonoma Coast", type: R, region: "Sonoma Coast" }, { name: "Chardonnay Sonoma Coast", type: W, region: "Sonoma Coast" }]},
  { producer: "Sonoma-Cutrer", country: "USA", wines: [{ name: "Russian River Ranches Chardonnay", type: W, region: "Russian River Valley" }, { name: "Pinot Noir", type: R, region: "Sonoma Coast" }]},
  { producer: "Ferrari-Carano", country: "USA", wines: [{ name: "Fumé Blanc", type: W, region: "Sonoma County" }, { name: "Siena Red Blend", type: R, region: "Sonoma County" }, { name: "Cabernet Sauvignon", type: R, region: "Alexander Valley" }]},
  { producer: "Rombauer", country: "USA", wines: [{ name: "Chardonnay Carneros", type: W, region: "Carneros" }, { name: "Cabernet Sauvignon", type: R, region: "Napa Valley" }, { name: "Merlot", type: R, region: "Napa Valley" }, { name: "Zinfandel", type: R, region: "California" }]},
  { producer: "Nickel & Nickel", country: "USA", wines: [{ name: "John C. Sullenger Cabernet", type: R, region: "Oakville" }, { name: "Branding Iron Cabernet", type: R, region: "Oakville" }]},
  { producer: "Hall Wines", country: "USA", wines: [{ name: "Cabernet Sauvignon Napa Valley", type: R, region: "Napa Valley" }, { name: "Merlot", type: R, region: "Napa Valley" }, { name: "Sauvignon Blanc", type: W, region: "Napa Valley" }]},
  { producer: "Twomey", country: "USA", wines: [{ name: "Pinot Noir Anderson Valley", type: R, region: "Anderson Valley" }, { name: "Pinot Noir Russian River", type: R, region: "Russian River Valley" }, { name: "Sauvignon Blanc", type: W, region: "Napa Valley" }]},
  { producer: "Newton Vineyard", country: "USA", wines: [{ name: "Unfiltered Chardonnay", type: W, region: "Napa Valley" }, { name: "Unfiltered Cabernet Sauvignon", type: R, region: "Napa Valley" }]},
  { producer: "Freemark Abbey", country: "USA", wines: [{ name: "Cabernet Sauvignon Napa Valley", type: R, region: "Napa Valley" }, { name: "Chardonnay Napa Valley", type: W, region: "Napa Valley" }]},
  { producer: "Franciscan Estate", country: "USA", wines: [{ name: "Cabernet Sauvignon", type: R, region: "Napa Valley" }, { name: "Chardonnay", type: W, region: "Napa Valley" }]},
  { producer: "ZD Wines", country: "USA", wines: [{ name: "Cabernet Sauvignon Napa", type: R, region: "Napa Valley" }, { name: "Chardonnay California", type: W, region: "California" }]},
  { producer: "Turnbull", country: "USA", wines: [{ name: "Cabernet Sauvignon Oakville", type: R, region: "Oakville" }, { name: "Sauvignon Blanc", type: W, region: "Oakville" }]},
  { producer: "Corison", country: "USA", wines: [{ name: "Cabernet Sauvignon Napa Valley", type: R, region: "Napa Valley" }, { name: "Kronos Cabernet", type: R, region: "Napa Valley" }]},
  { producer: "Grgich Hills", country: "USA", wines: [{ name: "Chardonnay Napa Valley", type: W, region: "Napa Valley" }, { name: "Fumé Blanc", type: W, region: "Napa Valley" }, { name: "Cabernet Sauvignon", type: R, region: "Napa Valley" }, { name: "Zinfandel", type: R, region: "Napa Valley" }]},
  { producer: "Chateau Montelena", country: "USA", wines: [{ name: "Chardonnay Napa Valley", type: W, region: "Napa Valley" }, { name: "Cabernet Sauvignon", type: R, region: "Napa Valley" }]},
  { producer: "Hess Persson Estates", country: "USA", wines: [{ name: "19 Block Mountain Cuvée", type: R, region: "Mt. Veeder" }]},
  { producer: "Turley Wine Cellars", country: "USA", wines: [{ name: "Juvenile Zinfandel", type: R, region: "California" }, { name: "Old Vines Zinfandel", type: R, region: "California" }, { name: "Petite Syrah", type: R, region: "Napa Valley" }]},
  { producer: "Tablas Creek", country: "USA", wines: [{ name: "Esprit de Tablas Rouge", type: R, region: "Paso Robles" }, { name: "Esprit de Tablas Blanc", type: W, region: "Paso Robles" }, { name: "Côtes de Tablas Rouge", type: R, region: "Paso Robles" }, { name: "Patelin de Tablas Rouge", type: R, region: "Paso Robles" }]},
  { producer: "Saxum", country: "USA", wines: [{ name: "James Berry Vineyard", type: R, region: "Paso Robles" }, { name: "Broken Stones", type: R, region: "Paso Robles" }]},
  { producer: "Justin", country: "USA", wines: [{ name: "Cabernet Sauvignon Paso Robles", type: R, region: "Paso Robles" }, { name: "Isosceles", type: R, region: "Paso Robles" }, { name: "Justification", type: R, region: "Paso Robles" }]},
  { producer: "Tooth & Nail", country: "USA", wines: [{ name: "Cabernet Sauvignon", type: R, region: "Paso Robles" }, { name: "Red Blend", type: R, region: "Paso Robles" }]},

  // ========== ADDITIONAL GLOBAL PRODUCERS ==========
  { producer: "Antinori (Prunotto)", country: "Italy", wines: [{ name: "Barolo Bussia", type: R, region: "Barolo" }, { name: "Barbaresco", type: R, region: "Barbaresco" }, { name: "Barbera d'Asti Fiulot", type: R, region: "Barbera d'Asti" }, { name: "Dolcetto d'Alba", type: R, region: "Langhe" }]},
  { producer: "Tenuta dell'Ornellaia (Le Volte)", country: "Italy", wines: [{ name: "Le Volte dell'Ornellaia", type: R, region: "Toscana" }]},
  { producer: "Marchesi di Frescobaldi (Nipozzano)", country: "Italy", wines: [{ name: "Chianti Rufina Nipozzano Riserva", type: R, region: "Chianti Rufina" }]},
  { producer: "Tasca d'Almerita", country: "Italy", wines: [{ name: "Regaleali Nero d'Avola", type: R, region: "Sicilia" }, { name: "Regaleali Bianco", type: W, region: "Sicilia" }, { name: "Rosso del Conte", type: R, region: "Sicilia" }]},
  { producer: "Feudi di San Gregorio", country: "Italy", wines: [{ name: "Falanghina", type: W, region: "Campania" }, { name: "Taurasi", type: R, region: "Campania" }, { name: "Fiano di Avellino", type: W, region: "Campania" }]},
  { producer: "Tenuta di Biserno", country: "Italy", wines: [{ name: "Biserno", type: R, region: "Toscana" }, { name: "Insoglio del Cinghiale", type: R, region: "Toscana" }]},
  { producer: "Casanova di Neri", country: "Italy", wines: [{ name: "Brunello di Montalcino", type: R, region: "Brunello di Montalcino" }, { name: "Brunello Tenuta Nuova", type: R, region: "Brunello di Montalcino" }, { name: "Rosso di Montalcino", type: R, region: "Rosso di Montalcino" }]},
  { producer: "Poggio Antico", country: "Italy", wines: [{ name: "Brunello di Montalcino", type: R, region: "Brunello di Montalcino" }]},
  { producer: "Marchetti", country: "Italy", wines: [{ name: "Rosso Conero", type: R, region: "Marche" }, { name: "Verdicchio dei Castelli di Jesi", type: W, region: "Marche" }]},
  { producer: "Cusumano", country: "Italy", wines: [{ name: "Nero d'Avola", type: R, region: "Sicilia" }, { name: "Insolia", type: W, region: "Sicilia" }, { name: "Benuara", type: R, region: "Sicilia" }]},
  { producer: "Cantina Terlan", country: "Italy", wines: [{ name: "Pinot Bianco", type: W, region: "Alto Adige" }, { name: "Sauvignon Winkl", type: W, region: "Alto Adige" }, { name: "Terlaner Classico", type: W, region: "Alto Adige" }]},
  { producer: "Château Musar", country: "Lebanon", wines: [{ name: "Château Musar Red", type: R, region: "Bekaa Valley" }, { name: "Château Musar White", type: W, region: "Bekaa Valley" }, { name: "Hochar Père et Fils Red", type: R, region: "Bekaa Valley" }]},
  { producer: "Yalumba", country: "Australia", wines: [{ name: "The Signature Cabernet Shiraz", type: R, region: "Barossa" }, { name: "Y Series Viognier", type: W, region: "South Australia" }, { name: "Samuel's Collection Shiraz", type: R, region: "Barossa" }, { name: "The Strapper GSM", type: R, region: "Barossa" }]},
  { producer: "Tyrrell's", country: "Australia", wines: [{ name: "Vat 1 Semillon", type: W, region: "Hunter Valley" }, { name: "Vat 47 Chardonnay", type: W, region: "Hunter Valley" }, { name: "Vat 9 Shiraz", type: R, region: "Hunter Valley" }]},
  { producer: "Peter Lehmann", country: "Australia", wines: [{ name: "Stonewell Shiraz", type: R, region: "Barossa Valley" }, { name: "Clancy's Red Blend", type: R, region: "Barossa Valley" }, { name: "Portrait Shiraz", type: R, region: "Barossa Valley" }]},
  { producer: "Wolf Blass", country: "Australia", wines: [{ name: "Black Label", type: R, region: "South Australia" }, { name: "Gold Label Shiraz", type: R, region: "Barossa Valley" }, { name: "Yellow Label Cabernet Sauvignon", type: R, region: "South Australia" }, { name: "Eaglehawk Chardonnay", type: W, region: "South Eastern Australia" }]},
  { producer: "Jacob's Creek", country: "Australia", wines: [{ name: "Reserve Shiraz", type: R, region: "Barossa Valley" }, { name: "Classic Chardonnay", type: W, region: "South Eastern Australia" }, { name: "Double Barrel Shiraz", type: R, region: "Barossa Valley" }]},
  { producer: "Lindeman's", country: "Australia", wines: [{ name: "Bin 50 Shiraz", type: R, region: "South Eastern Australia" }, { name: "Bin 65 Chardonnay", type: W, region: "South Eastern Australia" }, { name: "Gentleman's Collection Cabernet", type: R, region: "South Eastern Australia" }]},
  { producer: "Two Hands", country: "Australia", wines: [{ name: "Angels' Share Shiraz", type: R, region: "McLaren Vale" }, { name: "Gnarly Dudes Shiraz", type: R, region: "Barossa Valley" }, { name: "Sexy Beast Cabernet", type: R, region: "McLaren Vale" }]},
  { producer: "Grant Burge", country: "Australia", wines: [{ name: "Meshach Shiraz", type: R, region: "Barossa Valley" }, { name: "Benchmark Shiraz", type: R, region: "Barossa Valley" }, { name: "Barossa Ink Shiraz", type: R, region: "Barossa Valley" }]},
  { producer: "Taylors/Wakefield", country: "Australia", wines: [{ name: "St Andrews Shiraz", type: R, region: "Clare Valley" }, { name: "Promised Land Cabernet Merlot", type: R, region: "South Australia" }]},
  { producer: "Wyndham Estate", country: "Australia", wines: [{ name: "Bin 555 Shiraz", type: R, region: "South Eastern Australia" }]},
  { producer: "De Bortoli", country: "Australia", wines: [{ name: "Noble One Botrytis Semillon", type: D, region: "Riverina" }, { name: "Villages Pinot Noir", type: R, region: "Yarra Valley" }, { name: "DB Family Selection Shiraz", type: R, region: "South Eastern Australia" }]},
  { producer: "Spy Valley", country: "New Zealand", wines: [{ name: "Sauvignon Blanc", type: W, region: "Marlborough" }, { name: "Pinot Noir", type: R, region: "Marlborough" }]},
  { producer: "Ata Rangi", country: "New Zealand", wines: [{ name: "Pinot Noir", type: R, region: "Martinborough" }, { name: "Crimson Pinot Noir", type: R, region: "Martinborough" }]},
  { producer: "Mount Difficulty", country: "New Zealand", wines: [{ name: "Pinot Noir", type: R, region: "Central Otago" }, { name: "Roaring Meg Pinot Noir", type: R, region: "Central Otago" }, { name: "Riesling", type: W, region: "Central Otago" }]},
  { producer: "Te Mata", country: "New Zealand", wines: [{ name: "Coleraine", type: R, region: "Hawke's Bay" }, { name: "Awatea", type: R, region: "Hawke's Bay" }, { name: "Cape Crest Sauvignon Blanc", type: W, region: "Hawke's Bay" }]},
  { producer: "Man O' War", country: "New Zealand", wines: [{ name: "Valhalla Chardonnay", type: W, region: "Waiheke Island" }, { name: "Dreadnought Syrah", type: R, region: "Waiheke Island" }]},
  { producer: "Viña Santa Carolina", country: "Chile", wines: [{ name: "Reserva Cabernet Sauvignon", type: R, region: "Maipo Valley" }, { name: "Reserva Sauvignon Blanc", type: W, region: "Leyda Valley" }, { name: "Herencia Carmenère", type: R, region: "Rapel Valley" }]},
  { producer: "Viña Casas del Bosque", country: "Chile", wines: [{ name: "Reserva Pinot Noir", type: R, region: "Casablanca Valley" }, { name: "Reserva Sauvignon Blanc", type: W, region: "Casablanca Valley" }]},
  { producer: "Viña Leyda", country: "Chile", wines: [{ name: "Reserva Pinot Noir", type: R, region: "Leyda Valley" }, { name: "Reserva Sauvignon Blanc", type: W, region: "Leyda Valley" }, { name: "Lot 21 Pinot Noir", type: R, region: "Leyda Valley" }]},
  { producer: "De Martino", country: "Chile", wines: [{ name: "Legado Reserva Carmenère", type: R, region: "Maipo Valley" }, { name: "347 Vineyards Cabernet Sauvignon", type: R, region: "Maipo Valley" }, { name: "Estate Sauvignon Blanc", type: W, region: "Casablanca Valley" }]},
  { producer: "Susana Balbo", country: "Argentina", wines: [{ name: "Signature Malbec", type: R, region: "Mendoza" }, { name: "Crios Malbec", type: R, region: "Mendoza" }, { name: "Crios Torrontés", type: W, region: "Salta" }, { name: "BenMarco Malbec", type: R, region: "Mendoza" }]},
  { producer: "Pascual Toso", country: "Argentina", wines: [{ name: "Reserva Malbec", type: R, region: "Mendoza" }, { name: "Magdalena Toso Malbec", type: R, region: "Mendoza" }, { name: "Estate Cabernet Sauvignon", type: R, region: "Mendoza" }]},
  { producer: "Bodegas Salentein", country: "Argentina", wines: [{ name: "Reserve Malbec", type: R, region: "Valle de Uco" }, { name: "Numina Gran Corte", type: R, region: "Valle de Uco" }, { name: "Portillo Malbec", type: R, region: "Valle de Uco" }, { name: "Killka Malbec", type: R, region: "Valle de Uco" }]},
  { producer: "Bodegas Colomé", country: "Argentina", wines: [{ name: "Estate Malbec", type: R, region: "Salta" }, { name: "Torrontés", type: W, region: "Salta" }]},
  { producer: "Pulenta Estate", country: "Argentina", wines: [{ name: "Gran Malbec", type: R, region: "Mendoza" }, { name: "La Flor Malbec", type: R, region: "Mendoza" }]},
  { producer: "Château des Jacques (Louis Jadot)", country: "France", wines: [{ name: "Moulin-à-Vent", type: R, region: "Beaujolais" }, { name: "Morgon Côte du Py", type: R, region: "Beaujolais" }]},
  { producer: "Marcel Lapierre", country: "France", wines: [{ name: "Morgon", type: R, region: "Beaujolais" }, { name: "Raisins Gaulois", type: R, region: "Beaujolais" }]},
  { producer: "Jean Foillard", country: "France", wines: [{ name: "Morgon Côte du Py", type: R, region: "Beaujolais" }, { name: "Fleurie", type: R, region: "Beaujolais" }]},
  { producer: "Georges Duboeuf", country: "France", wines: [{ name: "Beaujolais-Villages", type: R, region: "Beaujolais" }, { name: "Moulin-à-Vent", type: R, region: "Beaujolais" }, { name: "Fleurie", type: R, region: "Beaujolais" }, { name: "Beaujolais Nouveau", type: R, region: "Beaujolais" }]},
  { producer: "Domaine des Héritiers du Comte Lafon", country: "France", wines: [{ name: "Mâcon-Milly-Lamartine", type: W, region: "Mâconnais" }]},
  { producer: "Domaine Leflaive (Mâcon)", country: "France", wines: [{ name: "Mâcon-Verzé", type: W, region: "Mâconnais" }]},
  { producer: "Jean-Marc Brocard", country: "France", wines: [{ name: "Chablis", type: W, region: "Chablis" }, { name: "Chablis 1er Cru Montmains", type: W, region: "Chablis" }]},
  { producer: "La Chablisienne", country: "France", wines: [{ name: "Chablis La Sereine", type: W, region: "Chablis" }, { name: "Petit Chablis", type: W, region: "Chablis" }]},
  { producer: "Domaine Long-Depaquit", country: "France", wines: [{ name: "Chablis 1er Cru Les Vaucopins", type: W, region: "Chablis" }, { name: "Chablis Grand Cru Les Clos", type: W, region: "Chablis" }]},
  { producer: "Château d'Aiguilhe", country: "France", wines: [{ name: "Côtes de Castillon", type: R, region: "Castillon" }]},
  { producer: "Château Puygueraud", country: "France", wines: [{ name: "Francs Côtes de Bordeaux", type: R, region: "Bordeaux" }]},
  { producer: "Château Lanessan", country: "France", wines: [{ name: "Haut-Médoc", type: R, region: "Haut-Médoc" }]},
  { producer: "Château Berliquet", country: "France", wines: [{ name: "Saint-Émilion Grand Cru", type: R, region: "Saint-Émilion" }]},
  { producer: "Château Tour Saint-Christophe", country: "France", wines: [{ name: "Saint-Émilion Grand Cru", type: R, region: "Saint-Émilion" }]},
  { producer: "Domaine Weinbach", country: "France", wines: [{ name: "Riesling Cuvée Théo", type: W, region: "Alsace" }, { name: "Pinot Gris Altenbourg", type: W, region: "Alsace" }]},
  { producer: "Domaine Bott-Geyl", country: "France", wines: [{ name: "Pinot Gris Sonnenglanz Grand Cru", type: W, region: "Alsace" }]},
  { producer: "Tement", country: "Austria", wines: [{ name: "Sauvignon Blanc Zieregg", type: W, region: "Südsteiermark" }, { name: "Morillon Zieregg", type: W, region: "Südsteiermark" }]},
  { producer: "Schloss Gobelsburg", country: "Austria", wines: [{ name: "Grüner Veltliner Renner", type: W, region: "Kamptal" }, { name: "Riesling Heiligenstein", type: W, region: "Kamptal" }]},
  { producer: "Weingut Knoll", country: "Austria", wines: [{ name: "Grüner Veltliner Smaragd Loibner", type: W, region: "Wachau" }, { name: "Riesling Smaragd Loibner", type: W, region: "Wachau" }]},
  { producer: "Dr. Bürklin-Wolf", country: "Germany", wines: [{ name: "Riesling Trocken", type: W, region: "Pfalz" }, { name: "Forster Pechstein Riesling GG", type: W, region: "Pfalz" }]},
  { producer: "Schloss Johannisberg", country: "Germany", wines: [{ name: "Riesling Gelblack", type: W, region: "Rheingau" }, { name: "Riesling Silberlack Spätlese", type: W, region: "Rheingau" }]},
  { producer: "Maximin Grünhaus", country: "Germany", wines: [{ name: "Abtsberg Riesling Spätlese", type: W, region: "Mosel" }, { name: "Herrenberg Riesling Kabinett", type: W, region: "Mosel" }]},
  { producer: "Fritz Haag", country: "Germany", wines: [{ name: "Brauneberger Juffer Sonnenuhr Riesling Spätlese", type: W, region: "Mosel" }, { name: "Brauneberger Juffer Riesling Kabinett", type: W, region: "Mosel" }]},
  { producer: "Selbach-Oster", country: "Germany", wines: [{ name: "Zeltinger Sonnenuhr Riesling Spätlese", type: W, region: "Mosel" }, { name: "Riesling Kabinett", type: W, region: "Mosel" }]},
  { producer: "Markus Molitor", country: "Germany", wines: [{ name: "Zeltinger Sonnenuhr Riesling Auslese", type: D, region: "Mosel" }, { name: "Bernkasteler Badstube Riesling Spätlese", type: W, region: "Mosel" }]},
  { producer: "Bodegas Sierra Cantabria", country: "Spain", wines: [{ name: "Crianza", type: R, region: "Rioja" }, { name: "Reserva", type: R, region: "Rioja" }]},
  { producer: "Marqués de Riscal", country: "Spain", wines: [{ name: "Reserva", type: R, region: "Rioja" }, { name: "Gran Reserva", type: R, region: "Rioja" }, { name: "Rueda Verdejo", type: W, region: "Rueda" }]},
  { producer: "Bodegas Toro Albalá", country: "Spain", wines: [{ name: "Don PX Gran Reserva", type: D, region: "Montilla-Moriles" }]},
  { producer: "Alvear", country: "Spain", wines: [{ name: "Pedro Ximénez de Añada", type: D, region: "Montilla-Moriles" }, { name: "Fino En Rama", type: D, region: "Montilla-Moriles" }]},
  { producer: "González Byass", country: "Spain", wines: [{ name: "Tío Pepe Fino", type: D, region: "Jerez" }, { name: "Nectar PX", type: D, region: "Jerez" }, { name: "Viña AB Amontillado", type: D, region: "Jerez" }]},
  { producer: "Bodegas Lustau", country: "Spain", wines: [{ name: "East India Solera", type: D, region: "Jerez" }, { name: "Palo Cortado Peninsula", type: D, region: "Jerez" }, { name: "Manzanilla Papirusa", type: D, region: "Jerez" }]},
  { producer: "Symington (Dow's)", country: "Portugal", wines: [{ name: "Dow's Vintage Port", type: D, region: "Douro" }, { name: "Dow's 20 Year Tawny", type: D, region: "Douro" }, { name: "Dow's Late Bottled Vintage", type: D, region: "Douro" }]},
  { producer: "Fonseca", country: "Portugal", wines: [{ name: "Vintage Port", type: D, region: "Douro" }, { name: "Bin 27 Reserve Port", type: D, region: "Douro" }, { name: "10 Year Tawny", type: D, region: "Douro" }]},
  { producer: "Warre's", country: "Portugal", wines: [{ name: "Vintage Port", type: D, region: "Douro" }, { name: "Otima 10 Year Tawny", type: D, region: "Douro" }]},
  { producer: "Luis Pato", country: "Portugal", wines: [{ name: "Baga Vinhas Velhas", type: R, region: "Bairrada" }, { name: "Maria Gomes", type: W, region: "Beiras" }]},
  { producer: "Herdade do Esporão", country: "Portugal", wines: [{ name: "Reserva Tinto", type: R, region: "Alentejo" }, { name: "Monte Velho Tinto", type: R, region: "Alentejo" }, { name: "Reserva Branco", type: W, region: "Alentejo" }]},
  { producer: "Casa Ferreirinha", country: "Portugal", wines: [{ name: "Barca Velha", type: R, region: "Douro" }, { name: "Callabriga", type: R, region: "Douro" }, { name: "Papa Figos", type: R, region: "Douro" }]},
  { producer: "Quinta do Crasto", country: "Portugal", wines: [{ name: "Reserva Old Vines", type: R, region: "Douro" }, { name: "Crasto Tinto", type: R, region: "Douro" }, { name: "Crasto Superior", type: R, region: "Douro" }]},
  { producer: "Rust en Vrede", country: "South Africa", wines: [{ name: "Estate Red", type: R, region: "Stellenbosch" }, { name: "Cabernet Sauvignon", type: R, region: "Stellenbosch" }]},
  { producer: "Boekenhoutskloof", country: "South Africa", wines: [{ name: "Syrah", type: R, region: "Franschhoek" }, { name: "Chocolate Block", type: R, region: "Franschhoek" }, { name: "The Wolftrap Red", type: R, region: "Western Cape" }, { name: "The Wolftrap White", type: W, region: "Western Cape" }]},
  { producer: "Sadie Family", country: "South Africa", wines: [{ name: "Columella", type: R, region: "Swartland" }, { name: "Palladius", type: W, region: "Swartland" }]},
  { producer: "Hamilton Russell", country: "South Africa", wines: [{ name: "Pinot Noir", type: R, region: "Hemel-en-Aarde Valley" }, { name: "Chardonnay", type: W, region: "Hemel-en-Aarde Valley" }]},
  { producer: "Vergelegen", country: "South Africa", wines: [{ name: "V Cabernet Sauvignon", type: R, region: "Stellenbosch" }, { name: "Reserve Chardonnay", type: W, region: "Stellenbosch" }]},
  { producer: "Thelema", country: "South Africa", wines: [{ name: "Cabernet Sauvignon", type: R, region: "Stellenbosch" }, { name: "The Mint Cabernet", type: R, region: "Stellenbosch" }, { name: "Chardonnay", type: W, region: "Stellenbosch" }]},
];

  // ========== POPULAR US WINES ($10-30 retail) ==========
  { producer: "Bota Box", country: "USA", wines: [{ name: "Cabernet Sauvignon", type: R, region: "California" }, { name: "Chardonnay", type: W, region: "California" }, { name: "Pinot Grigio", type: W, region: "California" }, { name: "Malbec", type: R, region: "California" }, { name: "Rosé", type: Ro, region: "California" }, { name: "Nighthawk Black Red Blend", type: R, region: "California" }]},
  { producer: "Woodbridge (Robert Mondavi)", country: "USA", wines: [{ name: "Cabernet Sauvignon", type: R, region: "California" }, { name: "Chardonnay", type: W, region: "California" }, { name: "Merlot", type: R, region: "California" }, { name: "Pinot Noir", type: R, region: "California" }, { name: "Sauvignon Blanc", type: W, region: "California" }]},
  { producer: "Cupcake Vineyards", country: "USA", wines: [{ name: "Red Velvet", type: R, region: "California" }, { name: "Sauvignon Blanc", type: W, region: "New Zealand" }, { name: "Pinot Grigio", type: W, region: "Italy" }, { name: "Chardonnay", type: W, region: "California" }, { name: "Prosecco", type: S, region: "Italy" }]},
  { producer: "Menage a Trois", country: "USA", wines: [{ name: "California Red Blend", type: R, region: "California" }, { name: "Silk Red Blend", type: R, region: "California" }, { name: "Gold Chardonnay", type: W, region: "California" }, { name: "Rosé", type: Ro, region: "California" }, { name: "Midnight Red Blend", type: R, region: "California" }]},
  { producer: "Noble Vines", country: "USA", wines: [{ name: "337 Cabernet Sauvignon", type: R, region: "California" }, { name: "446 Chardonnay", type: W, region: "California" }, { name: "667 Pinot Noir", type: R, region: "Monterey" }]},
  { producer: "Ecco Domani", country: "Italy", wines: [{ name: "Pinot Grigio", type: W, region: "Delle Venezie" }, { name: "Merlot", type: R, region: "Delle Venezie" }]},
  { producer: "Whitehall Lane", country: "USA", wines: [{ name: "Cabernet Sauvignon", type: R, region: "Napa Valley" }, { name: "Merlot", type: R, region: "Napa Valley" }, { name: "Sauvignon Blanc", type: W, region: "Napa Valley" }]},
  { producer: "Michael David Winery", country: "USA", wines: [{ name: "Freakshow Cabernet Sauvignon", type: R, region: "Lodi" }, { name: "7 Deadly Zins Zinfandel", type: R, region: "Lodi" }, { name: "Petite Petit", type: R, region: "Lodi" }, { name: "Inkblot Cabernet Franc", type: R, region: "Lodi" }]},
  { producer: "Ravenswood", country: "USA", wines: [{ name: "Vintners Blend Zinfandel", type: R, region: "California" }, { name: "Old Vine Zinfandel Lodi", type: R, region: "Lodi" }]},
  { producer: "Murphy-Goode", country: "USA", wines: [{ name: "Cabernet Sauvignon", type: R, region: "Alexander Valley" }, { name: "Chardonnay", type: W, region: "California" }, { name: "Sauvignon Blanc", type: W, region: "North Coast" }]},
  { producer: "Louis M. Martini", country: "USA", wines: [{ name: "Cabernet Sauvignon Sonoma", type: R, region: "Sonoma County" }, { name: "Cabernet Sauvignon Napa", type: R, region: "Napa Valley" }]},
  { producer: "Chateau St. Jean", country: "USA", wines: [{ name: "Cabernet Sauvignon Sonoma", type: R, region: "Sonoma County" }, { name: "Chardonnay", type: W, region: "California" }]},
  { producer: "Sterling Vineyards", country: "USA", wines: [{ name: "Vintner's Collection Cabernet", type: R, region: "Central Coast" }, { name: "Napa Valley Cabernet", type: R, region: "Napa Valley" }, { name: "Chardonnay", type: W, region: "Napa Valley" }]},
  { producer: "Layer Cake", country: "USA", wines: [{ name: "Shiraz", type: R, region: "South Australia" }, { name: "Cabernet Sauvignon", type: R, region: "California" }, { name: "Malbec", type: R, region: "Mendoza" }]},
  { producer: "Cline Family Cellars", country: "USA", wines: [{ name: "Old Vine Zinfandel", type: R, region: "Lodi" }, { name: "Ancient Vines Mourvèdre", type: R, region: "Contra Costa" }, { name: "Cashmere Red Blend", type: R, region: "California" }, { name: "Viognier", type: W, region: "California" }]},
  { producer: "Black Box", country: "USA", wines: [{ name: "Cabernet Sauvignon", type: R, region: "California" }, { name: "Chardonnay", type: W, region: "California" }, { name: "Merlot", type: R, region: "California" }, { name: "Pinot Grigio", type: W, region: "California" }]},
  { producer: "Rex Goliath", country: "USA", wines: [{ name: "Cabernet Sauvignon", type: R, region: "California" }, { name: "Pinot Noir", type: R, region: "California" }]},
  { producer: "Sutter Home", country: "USA", wines: [{ name: "White Zinfandel", type: Ro, region: "California" }, { name: "Cabernet Sauvignon", type: R, region: "California" }, { name: "Moscato", type: W, region: "California" }]},
  { producer: "Acrobat (King Estate)", country: "USA", wines: [{ name: "Pinot Noir", type: R, region: "Oregon" }, { name: "Pinot Gris", type: W, region: "Oregon" }]},
  { producer: "King Estate", country: "USA", wines: [{ name: "Pinot Noir Willamette", type: R, region: "Willamette Valley" }, { name: "Pinot Gris", type: W, region: "Oregon" }, { name: "Backbone Cabernet", type: R, region: "Oregon" }]},
  { producer: "Edna Valley Vineyard", country: "USA", wines: [{ name: "Chardonnay", type: W, region: "Central Coast" }, { name: "Pinot Noir", type: R, region: "Central Coast" }]},
  { producer: "Caymus Suisun (Second Label)", country: "USA", wines: [{ name: "Grand Durif", type: R, region: "Suisun Valley" }]},
  { producer: "Alamos (Catena)", country: "Argentina", wines: [{ name: "Selección Malbec", type: R, region: "Mendoza" }]},
  { producer: "Meiomi", country: "USA", wines: [{ name: "Cabernet Sauvignon", type: R, region: "California" }]},
  { producer: "Prophecy", country: "USA", wines: [{ name: "Pinot Noir", type: R, region: "California" }, { name: "Sauvignon Blanc", type: W, region: "California" }, { name: "Red Blend", type: R, region: "California" }, { name: "Pinot Grigio", type: W, region: "Italy" }]},
  { producer: "Starborough", country: "New Zealand", wines: [{ name: "Sauvignon Blanc", type: W, region: "Marlborough" }]},
  { producer: "Excelsior", country: "South Africa", wines: [{ name: "Cabernet Sauvignon", type: R, region: "Robertson" }, { name: "Chardonnay", type: W, region: "Robertson" }]},
  { producer: "Concha y Toro Frontera", country: "Chile", wines: [{ name: "Cabernet Sauvignon", type: R, region: "Central Valley" }, { name: "Chardonnay", type: W, region: "Central Valley" }]},
  { producer: "Chateau Ste. Michelle & Dr. Loosen", country: "USA", wines: [{ name: "Eroica Riesling", type: W, region: "Columbia Valley" }]},
  { producer: "Cloudem", country: "Spain", wines: [{ name: "Gold Sparkling", type: S, region: "Spain" }]},

  // ========== ITALIAN EVERYDAY & MID-RANGE ==========
  { producer: "Folonari", country: "Italy", wines: [{ name: "Valpolicella Ripasso", type: R, region: "Valpolicella" }, { name: "Pinot Grigio", type: W, region: "Delle Venezie" }]},
  { producer: "Bolla", country: "Italy", wines: [{ name: "Valpolicella Classico", type: R, region: "Valpolicella" }, { name: "Soave Classico", type: W, region: "Soave" }, { name: "Amarone", type: R, region: "Amarone" }]},
  { producer: "Zenato", country: "Italy", wines: [{ name: "Amarone Classico", type: R, region: "Amarone" }, { name: "Valpolicella Superiore Ripasso", type: R, region: "Valpolicella" }, { name: "Lugana", type: W, region: "Lugana" }]},
  { producer: "Tommasi", country: "Italy", wines: [{ name: "Amarone Classico", type: R, region: "Amarone" }, { name: "Ripasso Valpolicella", type: R, region: "Valpolicella" }, { name: "Le Rosse Pinot Grigio", type: W, region: "Delle Venezie" }]},
  { producer: "Pasqua", country: "Italy", wines: [{ name: "Amarone", type: R, region: "Amarone" }, { name: "Romeo & Juliet Passimento Rosso", type: R, region: "Veneto" }]},
  { producer: "Monte del Frà", country: "Italy", wines: [{ name: "Amarone Classico", type: R, region: "Amarone" }, { name: "Valpolicella Ripasso Superiore", type: R, region: "Valpolicella" }]},
  { producer: "Marchesi de' Frescobaldi (Remole)", country: "Italy", wines: [{ name: "Remole Rosso", type: R, region: "Toscana" }, { name: "Remole Bianco", type: W, region: "Toscana" }]},
  { producer: "Castello di Volpaia", country: "Italy", wines: [{ name: "Chianti Classico", type: R, region: "Chianti Classico" }, { name: "Chianti Classico Riserva", type: R, region: "Chianti Classico" }]},
  { producer: "Castello di Fonterutoli (Mazzei)", country: "Italy", wines: [{ name: "Chianti Classico", type: R, region: "Chianti Classico" }, { name: "Siepi", type: R, region: "Toscana" }, { name: "Fonterutoli Chianti Classico Gran Selezione", type: R, region: "Chianti Classico" }]},
  { producer: "Cecchi", country: "Italy", wines: [{ name: "Chianti Classico", type: R, region: "Chianti Classico" }, { name: "Bonizio Sangiovese", type: R, region: "Toscana" }]},
  { producer: "Rocca delle Macìe", country: "Italy", wines: [{ name: "Chianti Classico", type: R, region: "Chianti Classico" }, { name: "Chianti Classico Riserva", type: R, region: "Chianti Classico" }, { name: "Vernaiolo Chianti", type: R, region: "Chianti" }]},
  { producer: "Poggio al Sole", country: "Italy", wines: [{ name: "Chianti Classico", type: R, region: "Chianti Classico" }]},
  { producer: "Caparzo", country: "Italy", wines: [{ name: "Brunello di Montalcino", type: R, region: "Brunello di Montalcino" }, { name: "Rosso di Montalcino", type: R, region: "Rosso di Montalcino" }, { name: "Ca' del Pazzo", type: R, region: "Toscana" }]},
  { producer: "Altesino", country: "Italy", wines: [{ name: "Brunello di Montalcino", type: R, region: "Brunello di Montalcino" }, { name: "Rosso di Altesino", type: R, region: "Toscana" }]},
  { producer: "Carpineto", country: "Italy", wines: [{ name: "Chianti Classico Riserva", type: R, region: "Chianti Classico" }, { name: "Vino Nobile di Montepulciano", type: R, region: "Montepulciano" }, { name: "Dogajolo Rosso", type: R, region: "Toscana" }]},
  { producer: "Ca' Maiol", country: "Italy", wines: [{ name: "Lugana", type: W, region: "Lugana" }, { name: "Lugana Prestige", type: W, region: "Lugana" }]},
  { producer: "Livio Felluga", country: "Italy", wines: [{ name: "Terre Alte", type: W, region: "Friuli" }, { name: "Pinot Grigio", type: W, region: "Friuli" }, { name: "Sauvignon Blanc", type: W, region: "Friuli" }]},
  { producer: "Alois Lageder", country: "Italy", wines: [{ name: "Pinot Grigio Dolomiti", type: W, region: "Alto Adige" }, { name: "Chardonnay", type: W, region: "Alto Adige" }, { name: "Lagrein", type: R, region: "Alto Adige" }]},
  { producer: "Nino Franco", country: "Italy", wines: [{ name: "Prosecco di Valdobbiadene Rustico", type: S, region: "Valdobbiadene" }, { name: "Primo Franco", type: S, region: "Valdobbiadene" }]},
  { producer: "Bisol", country: "Italy", wines: [{ name: "Crede Prosecco Superiore", type: S, region: "Valdobbiadene" }, { name: "Jeio Prosecco Brut", type: S, region: "Veneto" }]},
  { producer: "Villa Sandi", country: "Italy", wines: [{ name: "Prosecco Il Fresco", type: S, region: "Veneto" }, { name: "Cartizze Superiore", type: S, region: "Valdobbiadene" }]},
  { producer: "Valdo", country: "Italy", wines: [{ name: "Prosecco Marca Oro", type: S, region: "Valdobbiadene" }]},
  { producer: "Ca' dei Frati", country: "Italy", wines: [{ name: "I Frati Lugana", type: W, region: "Lugana" }, { name: "Tre Filer Rosé", type: Ro, region: "Riviera del Garda" }]},
  { producer: "Masciarelli", country: "Italy", wines: [{ name: "Montepulciano d'Abruzzo", type: R, region: "Abruzzo" }, { name: "Trebbiano d'Abruzzo", type: W, region: "Abruzzo" }, { name: "Marina Cvetic Montepulciano", type: R, region: "Abruzzo" }]},
  { producer: "Tormaresca (Antinori)", country: "Italy", wines: [{ name: "Neprica Primitivo", type: R, region: "Puglia" }, { name: "Torcicoda Primitivo", type: R, region: "Puglia" }]},
  { producer: "Li Veli", country: "Italy", wines: [{ name: "Pezzo Morgana Primitivo", type: R, region: "Puglia" }]},
  { producer: "Rivera", country: "Italy", wines: [{ name: "Il Falcone Riserva", type: R, region: "Puglia" }, { name: "Nero di Troia", type: R, region: "Puglia" }]},

  // ========== ADDITIONAL FRENCH EVERYDAY ==========
  { producer: "Château Ste. Michelle", country: "France", wines: [{ name: "Mouton Cadet Rouge", type: R, region: "Bordeaux" }, { name: "Mouton Cadet Blanc", type: W, region: "Bordeaux" }, { name: "Mouton Cadet Rosé", type: Ro, region: "Bordeaux" }]},
  { producer: "Baron Philippe de Rothschild", country: "France", wines: [{ name: "Mouton Cadet Rouge", type: R, region: "Bordeaux" }, { name: "Mouton Cadet Blanc", type: W, region: "Bordeaux" }, { name: "Mouton Cadet Rosé", type: Ro, region: "Bordeaux" }]},
  { producer: "Dourthe", country: "France", wines: [{ name: "No. 1 Blanc", type: W, region: "Bordeaux" }, { name: "No. 1 Rouge", type: R, region: "Bordeaux" }, { name: "La Grande Cuvée", type: R, region: "Bordeaux" }]},
  { producer: "Jean-Pierre Moueix", country: "France", wines: [{ name: "Château Fonroque", type: R, region: "Saint-Émilion" }]},
  { producer: "Château Beaumont", country: "France", wines: [{ name: "Haut-Médoc", type: R, region: "Haut-Médoc" }]},
  { producer: "Château Greysac", country: "France", wines: [{ name: "Médoc", type: R, region: "Médoc" }]},
  { producer: "Château Larose-Trintaudon", country: "France", wines: [{ name: "Haut-Médoc", type: R, region: "Haut-Médoc" }]},
  { producer: "Château Tour de By", country: "France", wines: [{ name: "Médoc", type: R, region: "Médoc" }]},
  { producer: "Château Bonnet", country: "France", wines: [{ name: "Bordeaux Rouge", type: R, region: "Bordeaux" }, { name: "Bordeaux Blanc", type: W, region: "Bordeaux" }]},
  { producer: "Château Recougne", country: "France", wines: [{ name: "Bordeaux Supérieur", type: R, region: "Bordeaux" }]},
  { producer: "Fat Bastard", country: "France", wines: [{ name: "Chardonnay", type: W, region: "Languedoc" }, { name: "Shiraz", type: R, region: "Languedoc" }, { name: "Cabernet Sauvignon", type: R, region: "Languedoc" }]},
  { producer: "Domaine de la Baume", country: "France", wines: [{ name: "Grand Châtaignier Chardonnay", type: W, region: "Languedoc" }, { name: "Pinot Noir", type: R, region: "Languedoc" }]},
  { producer: "Château de Nages", country: "France", wines: [{ name: "Costières de Nîmes Rouge", type: R, region: "Costières de Nîmes" }, { name: "Costières de Nîmes Rosé", type: Ro, region: "Costières de Nîmes" }]},
  { producer: "Domaine Houchart", country: "France", wines: [{ name: "Côtes de Provence Rosé", type: Ro, region: "Côtes de Provence" }, { name: "Côtes de Provence Rouge", type: R, region: "Côtes de Provence" }]},
  { producer: "Les Vignerons de Caractère", country: "France", wines: [{ name: "Vacqueyras", type: R, region: "Vacqueyras" }, { name: "Rasteau", type: R, region: "Rasteau" }]},
  { producer: "Cave de Tain", country: "France", wines: [{ name: "Crozes-Hermitage", type: R, region: "Crozes-Hermitage" }, { name: "Saint-Joseph", type: R, region: "Saint-Joseph" }]},
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
