// src/services/FoodDatabaseService.ts
import { auroraService, DatabaseConfig } from './AuroraService';
import {
  EXPO_PUBLIC_AURORA_RESOURCE_ARN,
  EXPO_PUBLIC_AURORA_SECRET_ARN,
  EXPO_PUBLIC_FOOD_DATABASE_NAME,
} from '@env';

// Database configuration for Food Database (readonly Aurora cluster)
const FOOD_DB_CONFIG: DatabaseConfig = {
  resourceArn: EXPO_PUBLIC_AURORA_RESOURCE_ARN,
  secretArn: EXPO_PUBLIC_AURORA_SECRET_ARN,
  database: EXPO_PUBLIC_FOOD_DATABASE_NAME,
  readonly: true,
};

// Database Restaurant schema matching your actual database structure
export interface DatabaseRestaurant {
  restaurant_id: string;
  record_type?: string;
  restaurant_name: string;
  description?: string;
  location?: string;
  opening_hours?: string;
  cuisine_type?: string;
  notes?: string;
  contact?: string;
  accessibility?: string;
  banner_url?: string;
  banner_position?: string;
  created_at?: string;
  updated_at?: string;
}

// Frontend-compatible Restaurant interface (matching your local data structure)
export interface Restaurant {
  id: string;
  name: string;
  campus: "South Kensington";
  category: "Cafe" | "Restaurant" | "Bar" | "Deli" | "Convenience Store";
  description: string;
  buildingOrArea?: string;
  details?: string;
  url: string;
  tags?: string[];
  openingHours?: Array<{
    days: string;
    time: string;
  }>;
  // Database-specific fields
  banner_position?: string;
  banner_url?: string;
}

export interface FoodItem {
  id: number;
  restaurant_id: string;
  record_type: string;
  dish_name: string;
  description?: string;
  category?: string;
  food_type?: string;
  cuisine_type?: string;
  ingredients?: string[];
  dietary_tags?: string[];
  milk_allergy?: boolean;
  eggs_allergy?: boolean;
  peanuts_allergy?: boolean;
  tree_nuts_allergy?: boolean;
  shellfish_allergy?: boolean;
  other_allergens?: string[];
  student_price?: number;
  staff_price?: number;
  serve_time?: string;
  location?: string;
}

export interface FoodSearchFilters {
  restaurantIds?: string[];
  categories?: string[];
  dietaryPreferences?: string[];
  excludeAllergens?: string[];
  priceRange?: { min: number; max: number };
  searchTerm?: string;
  availableOnly?: boolean;
  limit?: number;
  offset?: number;
}

class FoodDatabaseService {
  // Convert database restaurant to frontend format
  private convertDatabaseRestaurantToFrontend(dbRestaurant: DatabaseRestaurant): Restaurant {
    // Parse opening hours from string to array format
    const parseOpeningHours = (hoursString?: string): Array<{days: string, time: string}> => {
      if (!hoursString) return [];
      
      // Handle formats like "Monday-Friday: 08:00-16:00" or "Monday-Friday: 08:00-16:00, Saturday: 09:00-19:00"
      const entries = hoursString.split(',').map(entry => entry.trim());
      
      return entries.map(entry => {
        const colonIndex = entry.indexOf(':');
        if (colonIndex === -1) return { days: entry, time: '' };
        
        const days = entry.substring(0, colonIndex).trim();
        const time = entry.substring(colonIndex + 1).trim();
        
        // Convert "Monday-Friday" to "Mon–Fri" format
        const dayMap: Record<string, string> = {
          'Monday': 'Mon', 'Tuesday': 'Tue', 'Wednesday': 'Wed', 
          'Thursday': 'Thu', 'Friday': 'Fri', 'Saturday': 'Sat', 'Sunday': 'Sun'
        };
        
        let formattedDays = days;
        Object.entries(dayMap).forEach(([full, short]) => {
          formattedDays = formattedDays.replace(full, short);
        });
        formattedDays = formattedDays.replace('-', '–'); // Use en-dash
        
        return { days: formattedDays, time };
      });
    };

    // Map cuisine_type to category
    const mapCuisineTypeToCategory = (cuisineType?: string): Restaurant['category'] => {
      if (!cuisineType) return 'Cafe';
      
      const lowerType = cuisineType.toLowerCase();
      if (lowerType.includes('convenience')) return 'Convenience Store';
      if (lowerType.includes('bar')) return 'Bar';
      if (lowerType.includes('deli')) return 'Deli';
      if (lowerType.includes('restaurant') || lowerType.includes('japanese') || lowerType.includes('chinese') || lowerType.includes('mexican')) return 'Restaurant';
      return 'Cafe';
    };

    // Generate meaningful tags from cuisine type and description
    const generateTags = (cuisineType?: string, description?: string): string[] => {
      const tags: string[] = [];
      
      // Add specific cuisine types as tags (avoiding generic terms that match categories)
      if (cuisineType) {
        const lowerType = cuisineType.toLowerCase();
        
        // Only add specific cuisine types, not generic category terms
        if (lowerType.includes('japanese') || lowerType.includes('chinese') || 
            lowerType.includes('mexican') || lowerType.includes('italian') ||
            lowerType.includes('indian') || lowerType.includes('thai') ||
            lowerType.includes('mediterranean') || lowerType.includes('asian')) {
          tags.push(lowerType);
        }
      }
      
      // Extract common food terms from description
      const foodTerms = ['coffee', 'tea', 'sandwich', 'pizza', 'sushi', 'curry', 'pasta', 'salad', 'soup', 'burger', 'wrap', 'pastry', 'cake'];
      const descLower = (description || '').toLowerCase();
      
      foodTerms.forEach(term => {
        if (descLower.includes(term)) {
          tags.push(term);
        }
      });
      
      return [...new Set(tags)]; // Remove duplicates
    };

    return {
      id: dbRestaurant.restaurant_id,
      name: dbRestaurant.restaurant_name,
      campus: "South Kensington",
      category: mapCuisineTypeToCategory(dbRestaurant.cuisine_type),
      description: dbRestaurant.description || dbRestaurant.notes || '',
      buildingOrArea: dbRestaurant.location,
      details: dbRestaurant.notes,
      url: `https://www.imperial.ac.uk/food-and-drink/opening-hours/`, // Default URL
      tags: generateTags(dbRestaurant.cuisine_type, dbRestaurant.description),
      openingHours: parseOpeningHours(dbRestaurant.opening_hours),
      banner_position: dbRestaurant.banner_position,
      banner_url: dbRestaurant.banner_url,
    };
  }

  // Restaurant operations
  async getRestaurant(restaurantId: string): Promise<Restaurant | null> {
    try {
      const result = await auroraService.executeStatement(
        FOOD_DB_CONFIG,
        'SELECT * FROM public.unifeast_restaurants WHERE restaurant_id = :restaurantId',
        {
          parameters: [
            auroraService.createParameter('restaurantId', restaurantId)
          ]
        }
      );

      const restaurants = auroraService.convertResultsToObjects(result) as DatabaseRestaurant[];
      return restaurants.length > 0 ? this.convertDatabaseRestaurantToFrontend(restaurants[0]) : null;
    } catch (error) {
      console.error('Error getting restaurant:', error);
      return null;
    }
  }

  async getAllRestaurants(limit: number = 50, offset: number = 0): Promise<Restaurant[]> {
    try {
      const result = await auroraService.executeStatement(
        FOOD_DB_CONFIG,
        'SELECT * FROM public.unifeast_restaurants ORDER BY restaurant_name LIMIT :limit OFFSET :offset',
        {
          parameters: [
            auroraService.createParameter('limit', limit),
            auroraService.createParameter('offset', offset)
          ]
        }
      );

      const dbRestaurants = auroraService.convertResultsToObjects(result) as DatabaseRestaurant[];
      return dbRestaurants.map(dbRest => this.convertDatabaseRestaurantToFrontend(dbRest));
    } catch (error) {
      console.error('Error getting restaurants:', error);
      return [];
    }
  }

  // Get all restaurants for South Kensington campus (matching your local data)
  async getSouthKensingtonRestaurants(): Promise<Restaurant[]> {
    try {
      const result = await auroraService.executeStatement(
        FOOD_DB_CONFIG,
        'SELECT * FROM public.unifeast_restaurants ORDER BY restaurant_name'
      );

      const dbRestaurants = auroraService.convertResultsToObjects(result) as DatabaseRestaurant[];
      return dbRestaurants.map(dbRest => this.convertDatabaseRestaurantToFrontend(dbRest));
    } catch (error) {
      console.error('Error getting South Kensington restaurants:', error);
      return [];
    }
  }

  async getRestaurantsByLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 5,
    limit: number = 20
  ): Promise<Restaurant[]> {
    try {
      // Using the haversine formula to calculate distance
      const result = await auroraService.executeStatement(
        FOOD_DB_CONFIG,
        `
        SELECT *, 
          (6371 * acos(cos(radians(:latitude)) * cos(radians(latitude)) 
          * cos(radians(longitude) - radians(:longitude)) 
          + sin(radians(:latitude)) * sin(radians(latitude)))) AS distance
        FROM public.unifeast_restaurants 
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        HAVING distance <= :radius
        ORDER BY distance
        LIMIT :limit
        `,
        {
          parameters: [
            auroraService.createParameter('latitude', latitude),
            auroraService.createParameter('longitude', longitude),
            auroraService.createParameter('radius', radiusKm),
            auroraService.createParameter('limit', limit)
          ]
        }
      );

      return auroraService.convertResultsToObjects(result) as Restaurant[];
    } catch (error) {
      console.error('Error getting restaurants by location:', error);
      return [];
    }
  }

  // Food item operations
  async getFoodItem(foodId: string): Promise<FoodItem | null> {
    try {
      const result = await auroraService.executeStatement(
        FOOD_DB_CONFIG,
        'SELECT * FROM public.unifeast_food WHERE id = :foodId',
        {
          parameters: [
            auroraService.createParameter('foodId', foodId)
          ]
        }
      );

      const foodItems = auroraService.convertResultsToObjects(result);
      return foodItems.length > 0 ? foodItems[0] as FoodItem : null;
    } catch (error) {
      console.error('Error getting food item:', error);
      return null;
    }
  }

  async getFoodItemsByRestaurant(
    restaurantId: string,
    availableOnly: boolean = true
  ): Promise<FoodItem[]> {
    try {
      // Remove availability filter since it doesn't exist in your schema
      const sql = 'SELECT * FROM public.unifeast_food WHERE restaurant_id = :restaurantId ORDER BY category, dish_name';
      const parameters = [auroraService.createParameter('restaurantId', restaurantId)];
  
      const result = await auroraService.executeStatement(FOOD_DB_CONFIG, sql, {
        parameters
      });
  
      return auroraService.convertResultsToObjects(result) as FoodItem[];
    } catch (error) {
      console.error('Error getting food items by restaurant:', error);
      return [];
    }
  }

  async searchFoodItems(filters: FoodSearchFilters): Promise<FoodItem[]> {
    try {
      let sql = 'SELECT f.* FROM public.unifeast_food f';
      let whereConditions: string[] = [];
      let parameters: any[] = [];
      let paramIndex = 0;

      // Join with restaurants if needed for location-based search
      if (filters.restaurantIds && filters.restaurantIds.length > 0) {
        const placeholders = filters.restaurantIds.map(() => `:restaurantId${paramIndex++}`).join(',');
        whereConditions.push(`f.restaurant_id IN (${placeholders})`);
        filters.restaurantIds.forEach(id => {
          parameters.push(auroraService.createParameter(`restaurantId${parameters.length}`, id));
        });
      }

      // Category filter
      if (filters.categories && filters.categories.length > 0) {
        const placeholders = filters.categories.map(() => `:category${paramIndex++}`).join(',');
        whereConditions.push(`f.category IN (${placeholders})`);
        filters.categories.forEach(category => {
          parameters.push(auroraService.createParameter(`category${parameters.length}`, category));
        });
      }

      // Dietary preferences (assuming stored as JSON array)
      if (filters.dietaryPreferences && filters.dietaryPreferences.length > 0) {
        const dietaryConditions = filters.dietaryPreferences.map(() => {
          const param = `:dietary${paramIndex++}`;
          parameters.push(auroraService.createParameter(`dietary${parameters.length}`, JSON.stringify(filters.dietaryPreferences)));
          return `f.dietary_preferences::jsonb ? ${param}`;
        });
        whereConditions.push(`(${dietaryConditions.join(' OR ')})`);
      }

      // Exclude allergens (assuming stored as JSON array)
      if (filters.excludeAllergens && filters.excludeAllergens.length > 0) {
        filters.excludeAllergens.forEach(allergen => {
          const param = `:excludeAllergen${paramIndex++}`;
          parameters.push(auroraService.createParameter(`excludeAllergen${parameters.length}`, allergen));
          whereConditions.push(`NOT (f.allergens::jsonb ? ${param})`);
        });
      }

      // Price range
      if (filters.priceRange) {
        if (filters.priceRange.min !== undefined) {
          whereConditions.push('f.price >= :minPrice');
          parameters.push(auroraService.createParameter('minPrice', filters.priceRange.min));
        }
        if (filters.priceRange.max !== undefined) {
          whereConditions.push('f.price <= :maxPrice');
          parameters.push(auroraService.createParameter('maxPrice', filters.priceRange.max));
        }
      }

      // Search term (name or description)
      if (filters.searchTerm) {
        whereConditions.push('(f.dish_name ILIKE :searchTerm OR f.description ILIKE :searchTerm)');
        parameters.push(auroraService.createParameter('searchTerm', `%${filters.searchTerm}%`));
      }

      // Build final query
      if (whereConditions.length > 0) {
        sql += ' WHERE ' + whereConditions.join(' AND ');
      }

      sql += ' ORDER BY f.restaurant_id, f.category, f.dish_name';

      // Add pagination
      if (filters.limit) {
        sql += ' LIMIT :limit';
        parameters.push(auroraService.createParameter('limit', filters.limit));
      }

      if (filters.offset) {
        sql += ' OFFSET :offset';
        parameters.push(auroraService.createParameter('offset', filters.offset));
      }

      const result = await auroraService.executeStatement(FOOD_DB_CONFIG, sql, {
        parameters
      });

      return auroraService.convertResultsToObjects(result) as FoodItem[];
    } catch (error) {
      console.error('Error searching food items:', error);
      return [];
    }
  }

  async getFoodItemsByDietaryPreference(preference: string): Promise<FoodItem[]> {
    return this.searchFoodItems({
      dietaryPreferences: [preference],
      availableOnly: true
    });
  }

  async getFoodItemsWithoutAllergen(allergen: string): Promise<FoodItem[]> {
    return this.searchFoodItems({
      excludeAllergens: [allergen],
      availableOnly: true
    });
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    return auroraService.testConnection(FOOD_DB_CONFIG);
  }

  // Get database statistics
  async getDatabaseStats(): Promise<{ restaurantCount: number; foodItemCount: number } | null> {
    try {
      const restaurantResult = await auroraService.executeStatement(
        FOOD_DB_CONFIG,
        'SELECT COUNT(*) as count FROM public.unifeast_restaurants'
      );

      const foodResult = await auroraService.executeStatement(
        FOOD_DB_CONFIG,
        'SELECT COUNT(*) as count FROM public.unifeast_food'
      );

      const restaurantData = auroraService.convertResultsToObjects(restaurantResult);
      const foodData = auroraService.convertResultsToObjects(foodResult);

      return {
        restaurantCount: restaurantData[0]?.count || 0,
        foodItemCount: foodData[0]?.count || 0
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return null;
    }
  }
}

// Export singleton instance
export const foodDatabaseService = new FoodDatabaseService();