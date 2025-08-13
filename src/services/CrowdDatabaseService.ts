// src/services/CrowdDatabaseService.ts
import { auroraService, DatabaseConfig } from './AuroraService';
import {
  EXPO_PUBLIC_AURORA_RESOURCE_ARN,
  EXPO_PUBLIC_AURORA_SECRET_ARN,
  EXPO_PUBLIC_CROWD_DATABASE_NAME,
} from '@env';

// Database configuration for Crowd Database (read-write Aurora cluster)
const CROWD_DB_CONFIG: DatabaseConfig = {
  resourceArn: EXPO_PUBLIC_AURORA_RESOURCE_ARN,
  secretArn: EXPO_PUBLIC_AURORA_SECRET_ARN,
  database: EXPO_PUBLIC_CROWD_DATABASE_NAME,
  readonly: false,
};

export interface UserReview {
  id?: string;
  user_id: string;
  restaurant_id: string;
  food_item_id?: string;
  rating: number;
  review_text?: string;
  tags?: string[];
  helpful_count?: number;
  verified_purchase?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserFavorite {
  id?: string;
  user_id: string;
  restaurant_id?: string;
  food_item_id?: string;
  created_at?: string;
}

export interface UserOrder {
  id?: string;
  user_id: string;
  restaurant_id: string;
  order_items: OrderItem[];
  total_amount: number;
  order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  order_type: 'pickup' | 'delivery';
  special_instructions?: string;
  estimated_ready_time?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  food_item_id: string;
  quantity: number;
  unit_price: number;
  customizations?: string[];
  special_requests?: string;
}

export interface CrowdDataInsight {
  restaurant_id: string;
  average_rating: number;
  total_reviews: number;
  popular_items: Array<{
    food_item_id: string;
    order_count: number;
    average_rating: number;
  }>;
  peak_hours: Array<{
    hour: number;
    order_count: number;
  }>;
  dietary_trends: Array<{
    dietary_preference: string;
    percentage: number;
  }>;
}

class CrowdDatabaseService {
  // Review operations
  async createReview(review: Omit<UserReview, 'id' | 'created_at' | 'updated_at'>): Promise<UserReview | null> {
    try {
      const result = await auroraService.executeStatement(
        CROWD_DB_CONFIG,
        `
        INSERT INTO user_reviews (user_id, restaurant_id, food_item_id, rating, review_text, tags, verified_purchase)
        VALUES (:userId, :restaurantId, :foodItemId, :rating, :reviewText, :tags, :verifiedPurchase)
        RETURNING *
        `,
        {
          parameters: [
            auroraService.createParameter('userId', review.user_id),
            auroraService.createParameter('restaurantId', review.restaurant_id),
            auroraService.createParameter('foodItemId', review.food_item_id || null),
            auroraService.createParameter('rating', review.rating),
            auroraService.createParameter('reviewText', review.review_text || null),
            auroraService.createParameter('tags', review.tags ? JSON.stringify(review.tags) : null),
            auroraService.createParameter('verifiedPurchase', review.verified_purchase || false)
          ]
        }
      );

      const reviews = auroraService.convertResultsToObjects(result);
      return reviews.length > 0 ? reviews[0] as UserReview : null;
    } catch (error) {
      console.error('Error creating review:', error);
      return null;
    }
  }

  async getReviewsByRestaurant(restaurantId: string, limit: number = 20, offset: number = 0): Promise<UserReview[]> {
    try {
      const result = await auroraService.executeStatement(
        CROWD_DB_CONFIG,
        `
        SELECT * FROM user_reviews 
        WHERE restaurant_id = :restaurantId 
        ORDER BY created_at DESC 
        LIMIT :limit OFFSET :offset
        `,
        {
          parameters: [
            auroraService.createParameter('restaurantId', restaurantId),
            auroraService.createParameter('limit', limit),
            auroraService.createParameter('offset', offset)
          ]
        }
      );

      return auroraService.convertResultsToObjects(result) as UserReview[];
    } catch (error) {
      console.error('Error getting reviews by restaurant:', error);
      return [];
    }
  }

  async getReviewsByUser(userId: string): Promise<UserReview[]> {
    try {
      const result = await auroraService.executeStatement(
        CROWD_DB_CONFIG,
        'SELECT * FROM user_reviews WHERE user_id = :userId ORDER BY created_at DESC',
        {
          parameters: [
            auroraService.createParameter('userId', userId)
          ]
        }
      );

      return auroraService.convertResultsToObjects(result) as UserReview[];
    } catch (error) {
      console.error('Error getting reviews by user:', error);
      return [];
    }
  }

  // Favorites operations
  async addFavorite(favorite: Omit<UserFavorite, 'id' | 'created_at'>): Promise<UserFavorite | null> {
    try {
      const result = await auroraService.executeStatement(
        CROWD_DB_CONFIG,
        `
        INSERT INTO user_favorites (user_id, restaurant_id, food_item_id)
        VALUES (:userId, :restaurantId, :foodItemId)
        ON CONFLICT (user_id, restaurant_id, food_item_id) DO NOTHING
        RETURNING *
        `,
        {
          parameters: [
            auroraService.createParameter('userId', favorite.user_id),
            auroraService.createParameter('restaurantId', favorite.restaurant_id || null),
            auroraService.createParameter('foodItemId', favorite.food_item_id || null)
          ]
        }
      );

      const favorites = auroraService.convertResultsToObjects(result);
      return favorites.length > 0 ? favorites[0] as UserFavorite : null;
    } catch (error) {
      console.error('Error adding favorite:', error);
      return null;
    }
  }

  async removeFavorite(userId: string, restaurantId?: string, foodItemId?: string): Promise<boolean> {
    try {
      let sql = 'DELETE FROM user_favorites WHERE user_id = :userId';
      const parameters = [auroraService.createParameter('userId', userId)];

      if (restaurantId) {
        sql += ' AND restaurant_id = :restaurantId';
        parameters.push(auroraService.createParameter('restaurantId', restaurantId));
      }

      if (foodItemId) {
        sql += ' AND food_item_id = :foodItemId';
        parameters.push(auroraService.createParameter('foodItemId', foodItemId));
      }

      await auroraService.executeStatement(CROWD_DB_CONFIG, sql, { parameters });
      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      return false;
    }
  }

  async getUserFavorites(userId: string): Promise<UserFavorite[]> {
    try {
      const result = await auroraService.executeStatement(
        CROWD_DB_CONFIG,
        'SELECT * FROM user_favorites WHERE user_id = :userId ORDER BY created_at DESC',
        {
          parameters: [
            auroraService.createParameter('userId', userId)
          ]
        }
      );

      return auroraService.convertResultsToObjects(result) as UserFavorite[];
    } catch (error) {
      console.error('Error getting user favorites:', error);
      return [];
    }
  }

  // Order operations
  async createOrder(order: Omit<UserOrder, 'id' | 'created_at' | 'updated_at'>): Promise<UserOrder | null> {
    try {
      const statements = [
        {
          sql: `
            INSERT INTO user_orders (user_id, restaurant_id, total_amount, order_status, order_type, special_instructions)
            VALUES (:userId, :restaurantId, :totalAmount, :orderStatus, :orderType, :specialInstructions)
            RETURNING id
          `,
          parameters: [
            auroraService.createParameter('userId', order.user_id),
            auroraService.createParameter('restaurantId', order.restaurant_id),
            auroraService.createParameter('totalAmount', order.total_amount),
            auroraService.createParameter('orderStatus', order.order_status),
            auroraService.createParameter('orderType', order.order_type),
            auroraService.createParameter('specialInstructions', order.special_instructions || null)
          ]
        }
      ];

      const results = await auroraService.executeTransaction(CROWD_DB_CONFIG, statements);
      const orderResult = auroraService.convertResultsToObjects(results[0]);
      
      if (orderResult.length === 0) {
        throw new Error('Failed to create order');
      }

      const orderId = orderResult[0].id;

      // Insert order items
      for (const item of order.order_items) {
        await auroraService.executeStatement(
          CROWD_DB_CONFIG,
          `
          INSERT INTO order_items (order_id, food_item_id, quantity, unit_price, customizations, special_requests)
          VALUES (:orderId, :foodItemId, :quantity, :unitPrice, :customizations, :specialRequests)
          `,
          {
            parameters: [
              auroraService.createParameter('orderId', orderId),
              auroraService.createParameter('foodItemId', item.food_item_id),
              auroraService.createParameter('quantity', item.quantity),
              auroraService.createParameter('unitPrice', item.unit_price),
              auroraService.createParameter('customizations', item.customizations ? JSON.stringify(item.customizations) : null),
              auroraService.createParameter('specialRequests', item.special_requests || null)
            ]
          }
        );
      }

      return this.getOrder(orderId);
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  }

  async getOrder(orderId: string): Promise<UserOrder | null> {
    try {
      const orderResult = await auroraService.executeStatement(
        CROWD_DB_CONFIG,
        'SELECT * FROM user_orders WHERE id = :orderId',
        {
          parameters: [auroraService.createParameter('orderId', orderId)]
        }
      );

      const orders = auroraService.convertResultsToObjects(orderResult);
      if (orders.length === 0) {
        return null;
      }

      const order = orders[0] as UserOrder;

      // Get order items
      const itemsResult = await auroraService.executeStatement(
        CROWD_DB_CONFIG,
        'SELECT * FROM order_items WHERE order_id = :orderId',
        {
          parameters: [auroraService.createParameter('orderId', orderId)]
        }
      );

      const orderItems = auroraService.convertResultsToObjects(itemsResult) as OrderItem[];
      order.order_items = orderItems;

      return order;
    } catch (error) {
      console.error('Error getting order:', error);
      return null;
    }
  }

  async getUserOrders(userId: string, limit: number = 20): Promise<UserOrder[]> {
    try {
      const result = await auroraService.executeStatement(
        CROWD_DB_CONFIG,
        'SELECT * FROM user_orders WHERE user_id = :userId ORDER BY created_at DESC LIMIT :limit',
        {
          parameters: [
            auroraService.createParameter('userId', userId),
            auroraService.createParameter('limit', limit)
          ]
        }
      );

      return auroraService.convertResultsToObjects(result) as UserOrder[];
    } catch (error) {
      console.error('Error getting user orders:', error);
      return [];
    }
  }

  async updateOrderStatus(orderId: string, status: UserOrder['order_status']): Promise<boolean> {
    try {
      await auroraService.executeStatement(
        CROWD_DB_CONFIG,
        'UPDATE user_orders SET order_status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :orderId',
        {
          parameters: [
            auroraService.createParameter('status', status),
            auroraService.createParameter('orderId', orderId)
          ]
        }
      );

      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  }

  // Analytics and insights
  async getRestaurantInsights(restaurantId: string): Promise<CrowdDataInsight | null> {
    try {
      // Get basic review statistics
      const ratingResult = await auroraService.executeStatement(
        CROWD_DB_CONFIG,
        `
        SELECT 
          AVG(rating) as average_rating,
          COUNT(*) as total_reviews
        FROM user_reviews 
        WHERE restaurant_id = :restaurantId
        `,
        {
          parameters: [auroraService.createParameter('restaurantId', restaurantId)]
        }
      );

      const ratingData = auroraService.convertResultsToObjects(ratingResult)[0];

      // Get popular items (most ordered)
      const popularItemsResult = await auroraService.executeStatement(
        CROWD_DB_CONFIG,
        `
        SELECT 
          oi.food_item_id,
          COUNT(*) as order_count,
          AVG(ur.rating) as average_rating
        FROM order_items oi
        JOIN user_orders uo ON oi.order_id = uo.id
        LEFT JOIN user_reviews ur ON ur.food_item_id = oi.food_item_id
        WHERE uo.restaurant_id = :restaurantId
        GROUP BY oi.food_item_id
        ORDER BY order_count DESC
        LIMIT 10
        `,
        {
          parameters: [auroraService.createParameter('restaurantId', restaurantId)]
        }
      );

      const popularItems = auroraService.convertResultsToObjects(popularItemsResult);

      // Get peak hours
      const peakHoursResult = await auroraService.executeStatement(
        CROWD_DB_CONFIG,
        `
        SELECT 
          EXTRACT(HOUR FROM created_at) as hour,
          COUNT(*) as order_count
        FROM user_orders
        WHERE restaurant_id = :restaurantId
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY hour
        `,
        {
          parameters: [auroraService.createParameter('restaurantId', restaurantId)]
        }
      );

      const peakHours = auroraService.convertResultsToObjects(peakHoursResult);

      return {
        restaurant_id: restaurantId,
        average_rating: ratingData?.average_rating || 0,
        total_reviews: ratingData?.total_reviews || 0,
        popular_items: popularItems,
        peak_hours: peakHours,
        dietary_trends: [] // Would need additional data structure for this
      } as CrowdDataInsight;
    } catch (error) {
      console.error('Error getting restaurant insights:', error);
      return null;
    }
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    return auroraService.testConnection(CROWD_DB_CONFIG);
  }
}

// Export singleton instance
export const crowdDatabaseService = new CrowdDatabaseService();