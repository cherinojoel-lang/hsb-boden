export const site = {
  name: "HSB Hexagon Säurebau GmbH",
  shortName: "HSB",
  domain: "https://hsb-boden.de",
  email: "info@hsb-boden.de",
  phone: "+49 (0)2562 9463030",
  description:
    "Industrieböden, Säureschutz, Keramik, PU-Beton, Entwässerung und Sanierung für Lebensmittel-, Getränke-, Pharma- und Chemieproduktion.",
  defaultTitle: "Industrieböden & Säureschutz für Produktion | HSB Hexagon Säurebau",
  defaultDescription:
    "Industrieböden, Säureschutz, Keramik, PU-Beton, Entwässerung und Sanierung für Lebensmittel-, Getränke-, Pharma- und Chemieproduktion. Jetzt kostenlose Ersteinschätzung anfordern.",
  ctaLabel: "Ersteinschätzung anfordern",
  ctaTarget: "/kontakt/",
  // Lead-Zustellung läuft serverseitig über /api/lead (kein Secret im Client-Bundle).
  // Die Ziel-URL steht als Worker-Secret LEAD_WEBHOOK_URL, nicht als PUBLIC_*-Variable.
  // Dieser Flag schaltet nur die Formular-UI frei: false = Formular zeigt den direkten
  // Kontaktweg, statt Anfragen ins Leere laufen zu lassen.
  hasLeadEndpoint: import.meta.env.PUBLIC_LEAD_FORM_ENABLED === "true",
};
