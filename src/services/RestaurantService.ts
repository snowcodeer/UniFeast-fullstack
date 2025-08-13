// src/services/RestaurantService.ts
import { foodDatabaseService, Restaurant } from './FoodDatabaseService';
// Using Restaurant interface from FoodDatabaseService as it matches Outlet structure
type Outlet = Restaurant;

export class RestaurantService {
  
  async getSouthKensingtonOutlets(): Promise<Outlet[]> {
    try {
      const restaurants = await foodDatabaseService.getSouthKensingtonRestaurants();
      return restaurants;
    } catch (error) {
      console.error('Failed to fetch restaurants from database:', error);
      return [];
    }
  }

  async findOutletById(id: string): Promise<Outlet | undefined> {
    try {
      const restaurant = await foodDatabaseService.getRestaurant(id);
      return restaurant || undefined;
    } catch (error) {
      console.error('Failed to fetch restaurant from database:', error);
      return undefined;
    }
  }

  async searchOutlets(query: string): Promise<Outlet[]> {
    try {
      const allRestaurants = await foodDatabaseService.getSouthKensingtonRestaurants();
      
      // Implement search logic
      const lower = query.trim().toLowerCase();
      if (!lower) return allRestaurants;
      
      return allRestaurants.filter((outlet) =>
        [outlet.name, outlet.description, outlet.buildingOrArea, ...(outlet.tags ?? [])]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(lower))
      );
    } catch (error) {
      console.error('Failed to search database:', error);
      return [];
    }
  }

  // Get the banner position for an outlet (uses database data)
  async getBannerPosition(outletId: string): Promise<string> {
    try {
      const restaurant = await foodDatabaseService.getRestaurant(outletId);
      return restaurant?.banner_position || 'left center';
    } catch (error) {
      console.error('Failed to get banner position from database:', error);
      // Fallback to hardcoded positions for kimiko and huxley_cafe only
      const rightAlignedIds = new Set(["kimiko", "huxley_cafe"]);
      return rightAlignedIds.has(outletId) ? "right center" : "left center";
    }
  }
}

export const restaurantService = new RestaurantService();