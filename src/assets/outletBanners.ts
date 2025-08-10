// src/assets/outletBanners.ts
// Mapping of outlet IDs to banner images (.webp recommended)
// Place files under `src/assets/outletBanners/` and reference them here with require(...)

const outletBanners: Record<string, any> = {
  "business-school-cafe": require("./outletBanners/business-school-cafe.webp"),
  "chemistry-cafe": require("./outletBanners/chemistry-cafe.webp"),
  "college-cafe": require("./outletBanners/college-cafe.webp"),
  // Eastside consistently keyed as eastside-bar
  "eastside-bar": require("./outletBanners/eastside-bar-restaurant.webp"),
  "essentials-convenience-store": require("./outletBanners/essentials-convenience-store.webp"),
  "ex-libris-cafe": require("./outletBanners/ex-libris-cafe.webp"),
  "feast": require("./outletBanners/feast.webp"),
  "hao-chi": require("./outletBanners/hao-chi.webp"),
  "huxley-cafe": require("./outletBanners/huxley-cafe.webp"),
  "kokoro": require("./outletBanners/kokoro.webp"),
  "kimiko": require("./outletBanners/kimiko.webp"),
  "la-cantina": require("./outletBanners/la-cantina.webp"),
  "library-cafe": require("./outletBanners/library-cafe.webp"),
  "lumen-cafe": require("./outletBanners/lumen-cafe.webp"),
  "pizza-pi": require("./outletBanners/pizza-pi.webp"),
  "qtr": require("./outletBanners/qtr.webp"),
  "rcm-bar": require("./outletBanners/rcm-bar.webp"),
  "royal-school-of-mines-cafe": require("./outletBanners/royal-school-of-mines-cafe.webp"),
  "scr-restaurant": require("./outletBanners/scr-restaurant.webp"),
  "the-bakery": require("./outletBanners/the-bakery.webp"),
  "the-loud-bird": require("./outletBanners/the-loud-bird.webp"),
  "the-pantry": require("./outletBanners/the-pantry.webp"),
  "the-roastery": require("./outletBanners/the-roastery.webp"),
};

export default outletBanners;

