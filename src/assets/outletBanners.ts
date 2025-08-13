// src/assets/outletBanners.ts
// Mapping of database restaurant IDs to banner images (.webp)
// File names now match database restaurant_id values

const outletBanners: Record<string, any> = {
  "business_school_café": require("./outletBanners/business_school_café.webp"),
  "chemistry_café": require("./outletBanners/chemistry_café.webp"),
  "college_café": require("./outletBanners/college_café.webp"),
  "eastside_restaurant_and_bar": require("./outletBanners/eastside_restaurant_and_bar.webp"),
  "essentials_convenience_store": require("./outletBanners/essentials_convenience_store.webp"),
  "feast": require("./outletBanners/feast.webp"),
  "hǎo_chí": require("./outletBanners/hǎo_chí.webp"),
  "huxley_cafe": require("./outletBanners/huxley_cafe.webp"),
  "kokoro_at_h-bar": require("./outletBanners/kokoro_at_h-bar.webp"),
  "kimiko": require("./outletBanners/kimiko.webp"),
  "la_cantina": require("./outletBanners/la_cantina.webp"),
  "library_café": require("./outletBanners/library_café.webp"),
  "lumen_café": require("./outletBanners/lumen_café.webp"),
  "pizza_pi_(neo_pizza_&_pasta)": require("./outletBanners/pizza_pi_neo_pizza_pasta.webp"),
  "queen's_tower_rooms": require("./outletBanners/queen's_tower_rooms.webp"),
  "rcm_restaurant": require("./outletBanners/rcm_restaurant.webp"),
  "royal_school_of_mines_café": require("./outletBanners/royal_school_of_mines_café.webp"),
  "scr_restaurant": require("./outletBanners/scr_restaurant.webp"),
  "the_bakery_(starbucks)": require("./outletBanners/the_bakery_(starbucks).webp"),
  "the_loud_bird": require("./outletBanners/the_loud_bird.webp"),
  "the_pantry": require("./outletBanners/the_pantry.webp"),
  "the_roastery": require("./outletBanners/the_roastery.webp"),
  // Only include restaurants that have banner files
};

export default outletBanners;

