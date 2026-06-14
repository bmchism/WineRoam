import type { WineType, LearnArticle } from "../types";

// Wine 101 + wine types educational content.
export const articles: LearnArticle[] = [
  {
    slug: "what-is-wine",
    title: "What Is Wine?",
    subtitle: "Fermented grapes, shaped by place and people.",
    kicker: "Wine 101",
    sections: [
      {
        heading: "The grape and the place",
        body: "Wine is fermented grape juice. That's it — and that's everything. The grape variety (Cabernet, Pinot Noir, Chardonnay, Riesling, and hundreds more), where it's grown (terroir: soil, climate, altitude), and how it's made (vinification) determine what ends up in your glass.",
      },
      {
        heading: "Old World vs. New World",
        body: "Traditional European regions (France, Italy, Spain, Germany) are called 'Old World' — they tend to emphasize terroir and restraint. 'New World' (USA, Australia, Argentina, New Zealand, South Africa) often celebrates fruit and winemaker expression. The line is blurring as both sides learn from each other.",
      },
      {
        heading: "Why appellation matters",
        body: "Appellations (AOC in France, DOC/DOCG in Italy, AVA in the US) define where grapes are grown and often how wine is made. They're a promise of origin and style. A wine labeled 'Barolo' must be 100% Nebbiolo from a specific zone in Piedmont, aged at least 38 months.",
      },
    ],
  },
  {
    slug: "wine-types",
    title: "The Five Wine Types",
    subtitle: "Red, white, rosé, sparkling, dessert — and how they differ.",
    kicker: "Wine 101",
    sections: [
      {
        heading: "Red wine",
        body: "Made from dark-skinned grapes fermented with their skins (which contribute color, tannin, and body). Key grapes: Cabernet Sauvignon, Merlot, Pinot Noir, Syrah/Shiraz, Nebbiolo, Tempranillo, Malbec, Sangiovese.",
      },
      {
        heading: "White wine",
        body: "Made from green/gold-skinned grapes (or dark grapes with skins removed early). No skin contact means no tannin, lighter body. Key grapes: Chardonnay, Sauvignon Blanc, Riesling, Pinot Grigio, Gewürztraminer.",
      },
      {
        heading: "Rosé",
        body: "Dark-skinned grapes with brief skin contact (hours, not days) — enough for pink color, not enough for red-wine tannin. Provence is the spiritual home of dry rosé, but it's made worldwide.",
      },
      {
        heading: "Sparkling wine",
        body: "Wine with dissolved CO₂. The best (Champagne, Cava, Franciacorta) undergo secondary fermentation in the bottle (traditional method), creating fine bubbles and autolytic complexity. Prosecco uses the tank method for fruitier, fresher styles.",
      },
      {
        heading: "Dessert & fortified wine",
        body: "Sweet wines made by stopping fermentation early (Port — fortified with grape spirit), late harvest (noble rot/botrytis in Sauternes), drying grapes (Amarone), or freezing them (Icewine). Higher residual sugar, often higher alcohol.",
      },
    ],
  },
  {
    slug: "how-to-read-a-label",
    title: "Reading a Wine Label",
    subtitle: "Producer, region, vintage, and grape — the four things that matter.",
    kicker: "Wine 101",
    sections: [
      {
        heading: "What to look for",
        body: "A wine label tells you: the producer (who made it), the region/appellation (where the grapes grew), the vintage (harvest year), the grape variety (sometimes — Old World labels often name the place instead), and the alcohol level.",
      },
      {
        heading: "Old World: place over grape",
        body: "A bottle labeled 'Chablis' is Chardonnay from Chablis, France. 'Barolo' is Nebbiolo from Piedmont, Italy. The place name implies the grape. New World labels (California, Australia) typically name the grape variety front and center.",
      },
      {
        heading: "Classifications to know",
        body: "France: AOC/AOP, Cru Classé, Grand Cru. Italy: DOCG > DOC > IGT. Spain: DOCa, DO, Crianza/Reserva/Gran Reserva (aging levels). Germany: Prädikatswein (ripeness levels). USA: AVA designates the growing area.",
      },
    ],
  },
  {
    slug: "how-to-taste-wine",
    title: "How to Taste Wine (WSET Method)",
    subtitle: "Look, smell, taste, conclude — a structured approach to any glass.",
    kicker: "Do a tasting",
    sections: [
      {
        heading: "Set up your tasting",
        body: "Pour about 50ml per wine. Use ISO tasting glasses or any tulip-shaped glass that funnels aroma to your nose. Taste whites before reds, dry before sweet, light before full. Have plain water and unsalted crackers to reset your palate between wines.",
      },
      {
        heading: "Appearance",
        body: "Tilt the glass over a white surface. Note the color intensity (pale, medium, deep) and hue (lemon, gold, amber for whites; purple, ruby, garnet, tawny for reds). Color hints at age, grape variety, and winemaking. A youthful red is purple-rimmed; an older wine shows brick/garnet at the edge.",
      },
      {
        heading: "Nose",
        body: "Give a gentle swirl to release volatiles, then nose the glass. Assess intensity (light, medium, pronounced) and identify aromas in three categories: primary (grape-derived: fruit, floral, herbal), secondary (winemaking: yeast, butter from MLF, oak), tertiary (aging: leather, mushroom, tobacco, petrol).",
      },
      {
        heading: "Palate — structure",
        body: "Take a sip and let it coat your mouth. Assess: sweetness (dry to sweet), acidity (low to high — does it make you salivate?), tannin (reds only — drying sensation), body (light, medium, full — like skim milk vs. whole milk), alcohol (warming sensation), and finish (how long flavors linger after swallowing).",
      },
      {
        heading: "Palate — flavor",
        body: "Identify the same flavor categories as on the nose (primary, secondary, tertiary) but as taste. Notice how the wine evolves — entry, mid-palate, and finish can be quite different. The best wines have complexity (many layers) and length (a finish that goes on and on).",
      },
      {
        heading: "Conclusion",
        body: "Assess overall quality. A great wine shows balance (no one element dominates), intensity, complexity, and length. Consider: is the wine ready to drink, or does it need aging? Does it express its origin? Would you pour another glass? Score it 1–5 or 1–100, then compare notes with friends.",
      },
    ],
  },
];

export const articleBySlug = (slug: string) =>
  articles.find((a) => a.slug === slug);

export interface WineTypeGuide {
  wineType: WineType;
  description: string;
  profile: string;
  accent: string;
}

export const wineTypeGuides: WineTypeGuide[] = [
  {
    wineType: "Red",
    description: "Dark-skinned grapes fermented with skins for color, tannin, and body",
    profile: "Bold to elegant — dark fruit, earth, spice, structured tannins.",
    accent: "#722F37",
  },
  {
    wineType: "White",
    description: "Light-skinned grapes pressed before fermentation, no skin contact",
    profile: "Crisp to rich — citrus, stone fruit, mineral, refreshing acidity.",
    accent: "#C9A24B",
  },
  {
    wineType: "Rosé",
    description: "Brief skin contact gives pink hue without full red-wine tannin",
    profile: "Light and fresh — red berries, flowers, dry and refreshing.",
    accent: "#E8A0BF",
  },
  {
    wineType: "Sparkling",
    description: "Secondary fermentation creates bubbles; traditional method or tank method",
    profile: "Festive — toast, citrus, apple, fine mousse, bracing acidity.",
    accent: "#9AA7B2",
  },
  {
    wineType: "Dessert",
    description: "Sweet wines from late harvest, botrytis, drying, or fortification",
    profile: "Rich and sweet — honey, dried fruit, spice, balanced by acidity.",
    accent: "#D4A574",
  },
  {
    wineType: "Orange",
    description: "White grapes fermented with extended skin contact like a red wine",
    profile: "Textural and tannic — dried fruit, nuts, tea, savory.",
    accent: "#CC7722",
  },
];
