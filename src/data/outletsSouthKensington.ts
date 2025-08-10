// Local dataset of Imperial College London South Kensington catering outlets

export type OutletCategory =
  | "Cafe"
  | "Restaurant"
  | "Bar"
  | "Deli"
  | "Convenience Store";

export interface OpeningHoursEntry {
  days: string; // e.g., "Mon–Fri"
  time: string; // e.g., "08:30–17:30"
}

export interface Outlet {
  id: string;
  name: string;
  campus: "South Kensington";
  category: OutletCategory;
  description: string;
  buildingOrArea?: string;
  details?: string;
  url: string;
  tags?: string[];
  openingHours?: OpeningHoursEntry[];
}

export const southKensingtonOutlets: Outlet[] = [
  {
    id: "business-school-cafe",
    name: "Business School Café",
    campus: "South Kensington",
    category: "Cafe",
    description:
      "Ground floor of the Imperial Business School; selection of pre-packaged sandwiches, salads, baguettes, cakes and muffins. Only outlet serving Illy coffee and Illy Cold Brew.",
    buildingOrArea: "Business School (Ground floor)",
    url: "https://www.imperial.ac.uk/food-and-drink/catering-outlets/business-school-cafe/",
    tags: ["coffee", "Illy", "cakes", "muffins", "sandwiches", "salads", "baguettes"],
    details: "Accessible by Imperial Business School students only. Located next to the main entrance on Exhibition Road.",
    openingHours: [
      { days: "Mon–Fri", time: "08:30–17:30" },
    ],
  },
  {
    id: "chemistry-cafe",
    name: "The Chemistry Café",
    campus: "South Kensington",
    category: "Cafe",
    description:
      "Great view of the Queen's Tower lawns; serves soups, sandwiches and barista coffee with comfortable seating.",
    buildingOrArea: "Chemistry", 
    url: "https://www.imperial.ac.uk/food-and-drink/opening-hours/",
    tags: ["soups", "sandwiches", "coffee", "view"],
    openingHours: [
      { days: "Mon–Fri", time: "08:00–16:00" },
    ],
  },
  {
    id: "college-cafe",
    name: "College Café",
    campus: "South Kensington",
    category: "Cafe",
    description:
      "Situated in the main entrance; hot and cold options including hand carved sandwiches, shaker salads and smoothies.",
    buildingOrArea: "Main entrance",
    url: "https://www.imperial.ac.uk/food-and-drink/opening-hours/",
    tags: ["sandwiches", "salads", "smoothies", "hot food"],
    openingHours: [
      { days: "Mon–Fri", time: "08:00–18:00" },
    ],
  },
  {
    id: "eastside-bar",
    name: "Eastside Bar",
    campus: "South Kensington",
    category: "Restaurant",
    description:
      "From salads and pizzas to burgers and curries; large selection of main meals plus full bar and cocktail menu.",
    buildingOrArea: "Eastside",
    url: "https://www.imperial.ac.uk/food-and-drink/catering-outlets/eastside-restaurant-and-bar/",
    tags: ["salads", "pizza", "burgers", "curries", "bar", "cocktails"],
    openingHours: [
      { days: "Mon–Fri", time: "11:00–22:00" },
    ],
  },
  
  {
    id: "essentials-convenience-store",
    name: "Essentials Convenience Store",
    campus: "South Kensington",
    category: "Convenience Store",
    description:
      "Located in Prince’s Gardens; toiletries, newspapers, groceries and fresh fruit.",
    buildingOrArea: "Prince’s Gardens",
    url: "https://www.imperial.ac.uk/food-and-drink/opening-hours/",
    tags: ["groceries", "snacks", "convenience"],
    openingHours: [
      { days: "Mon–Fri", time: "08:00–21:00" },
      { days: "Sat", time: "09:00–19:00" },
      { days: "Sun", time: "10:00–16:30" },
    ],
  },
  {
    id: "kokoro",
    name: "Kokoro",
    campus: "South Kensington",
    category: "Restaurant",
    description:
      "Japanese kitchen (Kokoro). Temporarily operating in Queen's Tower Rooms.",
    buildingOrArea: "Queen's Tower Rooms",
    url: "https://www.imperial.ac.uk/food-and-drink/opening-hours/",
    tags: ["Japanese", "curry", "sushi"],
  },
  {
    id: "jcr-deli",
    name: "JCR Deli",
    campus: "South Kensington",
    category: "Cafe",
    description:
      "From oven-baked jacket potatoes to fresh baguettes; a variety of lunch options made to order.",
    buildingOrArea: "JCR, Sherfield Building",
    url: "https://www.imperial.ac.uk/food-and-drink/opening-hours/",
    tags: ["jacket potatoes", "baguettes", "made to order"],
  },
  {
    id: "kimiko",
    name: "Kimiko",
    campus: "South Kensington",
    category: "Restaurant",
    description:
      "Located in the JCR (Sherfield Building); full menu of hot Japanese curries and cold sushi.",
    buildingOrArea: "JCR, Sherfield Building",
    url: "https://www.imperial.ac.uk/food-and-drink/opening-hours/",
    tags: ["Japanese", "curry", "sushi"],
  },
  {
    id: "library-cafe",
    name: "Library Café",
    campus: "South Kensington",
    category: "Cafe",
    description:
      "Located in the Central Library; hot breakfast and lunches, sandwiches, salads and cakes, plus 24hr vending.",
    buildingOrArea: "Central Library",
    url: "https://www.imperial.ac.uk/food-and-drink/catering-outlets/library-cafe/",
    tags: ["breakfast", "lunch", "sandwiches", "salads", "cakes", "vending"],
    openingHours: [
      { days: "Mon–Thu", time: "08:00–22:00" },
      { days: "Fri", time: "08:00–21:00" },
      { days: "Sat", time: "10:00–20:00" },
      { days: "Sun", time: "10:00–16:00" },
    ],
  },
  {
    id: "the-bakery",
    name: "The Bakery",
    campus: "South Kensington",
    category: "Cafe",
    description:
      "Located in the JCR (Sherfield Building); freshly baked pastries and baguettes, plus Starbucks offering.",
    buildingOrArea: "JCR, Sherfield Building",
    url: "https://www.imperial.ac.uk/food-and-drink/opening-hours/",
    tags: ["pastries", "baguettes", "Starbucks"],
  },
  {
    id: "blackett-cafe",
    name: "Blackett Café",
    campus: "South Kensington",
    category: "Cafe",
    description: "Coffee and grab-and-go in the Blackett Building.",
    buildingOrArea: "Blackett Building",
    url: "https://www.imperial.ac.uk/food-and-drink/opening-hours/",
    openingHours: [
      { days: "Mon–Fri", time: "08:00–16:00" },
    ],
  },
  {
    id: "la-cantina",
    name: "La Cantina",
    campus: "South Kensington",
    category: "Restaurant",
    description: "Mexican-inspired hot dishes and bowls.",
    buildingOrArea: "South Kensington",
    url: "https://www.imperial.ac.uk/food-and-drink/opening-hours/",
    openingHours: [
      { days: "Mon–Fri", time: "11:45–14:30" },
    ],
  },
  {
    id: "feast",
    name: "Feast",
    campus: "South Kensington",
    category: "Restaurant",
    description: "Daily rotating hot dishes.",
    buildingOrArea: "South Kensington",
    url: "https://www.imperial.ac.uk/food-and-drink/opening-hours/",
    openingHours: [
      { days: "Mon–Fri", time: "11:00–14:30" },
    ],
  },
  {
    id: "hao-chi",
    name: "Hǎo Chī",
    campus: "South Kensington",
    category: "Restaurant",
    description: "Chinese-inspired canteen dishes.",
    buildingOrArea: "South Kensington",
    url: "https://www.imperial.ac.uk/food-and-drink/opening-hours/",
    openingHours: [
      { days: "Mon–Fri", time: "11:45–14:30" },
    ],
  },
  {
    id: "huxley-cafe",
    name: "Huxley Café",
    campus: "South Kensington",
    category: "Cafe",
    description: "Café in Huxley Building with drinks and snacks.",
    buildingOrArea: "Huxley Building",
    url: "https://www.imperial.ac.uk/food-and-drink/opening-hours/",
    openingHours: [
      { days: "Mon–Fri", time: "09:00–15:00" },
    ],
  },
  {
    id: "lumen-cafe",
    name: "Lumen Café",
    campus: "South Kensington",
    category: "Cafe",
    description: "Bubble teas, fruity teas, iced drinks, and barista coffee.",
    buildingOrArea: "Electrical Engineering Building (Foyer)",
    url: "https://www.imperial.ac.uk/food-and-drink/catering-outlets/lumen-cafe/",
    openingHours: [
      { days: "Mon–Fri", time: "08:00–18:00" },
    ],
  },
  {
    id: "the-loud-bird",
    name: "The Loud Bird",
    campus: "South Kensington",
    category: "Cafe",
    description: "Café with hot drinks and snacks.",
    buildingOrArea: "South Kensington",
    url: "https://www.imperial.ac.uk/food-and-drink/opening-hours/",
    openingHours: [
      { days: "Mon–Fri", time: "08:00–16:00" },
    ],
  },
  {
    id: "pizza-pi",
    name: "Pizza Pi",
    campus: "South Kensington",
    category: "Restaurant",
    description: "Pizza and pasta made to order.",
    buildingOrArea: "South Kensington",
    url: "https://www.imperial.ac.uk/food-and-drink/opening-hours/",
    openingHours: [
      { days: "Mon–Fri", time: "11:30–14:30" },
    ],
  },
  {
    id: "the-pantry",
    name: "The Pantry",
    campus: "South Kensington",
    category: "Restaurant",
    description: "Hot counter with daily options.",
    buildingOrArea: "South Kensington",
    url: "https://www.imperial.ac.uk/food-and-drink/opening-hours/",
    openingHours: [
      { days: "Mon–Fri", time: "11:00–14:00" },
    ],
  },
  {
    id: "qtr",
    name: "QTR",
    campus: "South Kensington",
    category: "Restaurant",
    description: "Queen's Tower Rooms hot food service.",
    buildingOrArea: "Queen's Tower Rooms",
    url: "https://www.imperial.ac.uk/food-and-drink/opening-hours/",
    openingHours: [
      { days: "Mon–Fri", time: "11:45–14:30" },
    ],
  },
  {
    id: "rcm-bar",
    name: "RCM Bar",
    campus: "South Kensington",
    category: "Bar",
    description: "Bar service at the Royal College of Music.",
    buildingOrArea: "RCM",
    url: "https://www.imperial.ac.uk/food-and-drink/opening-hours/",
    openingHours: [
      { days: "Mon–Wed", time: "16:30–21:00" },
      { days: "Thu–Fri", time: "16:30–23:00" },
    ],
  },
  {
    id: "the-roastery",
    name: "The Roastery",
    campus: "South Kensington",
    category: "Cafe",
    description: "Specialty coffee and bakes.",
    buildingOrArea: "South Kensington",
    url: "https://www.imperial.ac.uk/food-and-drink/opening-hours/",
    openingHours: [
      { days: "Mon–Fri", time: "08:00–17:00" },
    ],
  },
  {
    id: "royal-school-of-mines-cafe",
    name: "Royal School of Mines Café",
    campus: "South Kensington",
    category: "Cafe",
    description: "Café at the RSM building.",
    buildingOrArea: "Royal School of Mines",
    url: "https://www.imperial.ac.uk/food-and-drink/opening-hours/",
    openingHours: [
      { days: "Mon–Fri", time: "08:30–16:30" },
    ],
  },
  {
    id: "scr-restaurant",
    name: "Senior Common Room Restaurant",
    campus: "South Kensington",
    category: "Restaurant",
    description: "Senior Common Room hot food service.",
    buildingOrArea: "Senior Common Room",
    url: "https://www.imperial.ac.uk/food-and-drink/opening-hours/",
    openingHours: [
      { days: "Mon–Fri", time: "11:45–14:30" },
    ],
  },
  
];

export default southKensingtonOutlets;

