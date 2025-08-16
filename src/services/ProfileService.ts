// src/services/ProfileService.ts
import { fetchAuthSession } from 'aws-amplify/auth';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

export interface UserProfile {
  user_id: string;
  user_name?: string;
  email?: string;
  user_identity?: string;
  dietary_preferences?: string[];
  period_plan?: string;
  budget?: string;
  milk_allergy?: boolean;
  eggs_allergy?: boolean;
  peanuts_allergy?: boolean;
  tree_nuts_allergy?: boolean;
  shellfish_allergy?: boolean;
  other_allergies?: string[]; 
  favourites?: FavouriteItem[];
  session_data?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FavouriteItem {
  id: string;
  type: 'restaurant' | 'menu_item';
  name: string;
  description?: string;
  restaurant_id?: string;
  restaurant_name?: string;
  added_at: string;
}

class SimpleUserService {
  private readonly tableName = 'unifeast-users';
  private readonly region = 'eu-west-2';

  private async getClient(): Promise<DynamoDBDocumentClient> {
    try {
      // Fetch session; Amplify will use cached tokens and refresh only if expired
      const session = await fetchAuthSession();
      
      if (!session.credentials) {
        throw new Error('No credentials available');
      }

      const dynamoClient = new DynamoDBClient({
        region: this.region,
        credentials: {
          accessKeyId: session.credentials.accessKeyId,
          secretAccessKey: session.credentials.secretAccessKey,
          sessionToken: session.credentials.sessionToken,
        },
      });

      return DynamoDBDocumentClient.from(dynamoClient, {
        marshallOptions: {
          convertEmptyValues: false,
          removeUndefinedValues: true,
        },
      });
    } catch (error) {
      console.error('Failed to create DynamoDB client:', error);
      throw error;
    }
  }

  async getUser(userId: string): Promise<UserProfile | null> {
    try {
      const client = await this.getClient();
      const command = new GetCommand({
        TableName: this.tableName,
        Key: { user_id: userId },
      });

      const response = await client.send(command);
      return response.Item as UserProfile || null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async createUser(userId: string, userData: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const client = await this.getClient();
      const timestamp = new Date().toISOString();
      
      const user: UserProfile = {
        user_id: userId,
        user_name: '',
        email: '',
        user_identity: 'student',
        dietary_preferences: [],
        period_plan: '',
        budget: '',
        milk_allergy: false,
        eggs_allergy: false,
        peanuts_allergy: false,
        tree_nuts_allergy: false,
        shellfish_allergy: false,
        other_allergies: [],
        favourites: [],
        session_data: '',
        created_at: timestamp,
        updated_at: timestamp,
        ...userData,
      };

      const command = new PutCommand({
        TableName: this.tableName,
        Item: user,
      });

      await client.send(command);
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  async updateUser(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const client = await this.getClient();
      
      // Build update expression
      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      // Add updated timestamp
      const updatesWithTimestamp = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      Object.entries(updatesWithTimestamp).forEach(([key, value], index) => {
        if (value !== undefined) {
          const nameKey = `#attr${index}`;
          const valueKey = `:val${index}`;
          
          updateExpressions.push(`${nameKey} = ${valueKey}`);
          expressionAttributeNames[nameKey] = key;
          expressionAttributeValues[valueKey] = value;
        }
      });

      if (updateExpressions.length === 0) {
        return await this.getUser(userId);
      }

      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: { user_id: userId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      });

      const response = await client.send(command);
      return response.Attributes as UserProfile || null;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      const command = new DeleteCommand({
        TableName: this.tableName,
        Key: { user_id: userId },
      });

      await client.send(command);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  async addToFavourites(userId: string, item: Omit<FavouriteItem, 'added_at'>): Promise<UserProfile | null> {
    try {
      const user = await this.getUser(userId);
      if (!user) return null;

      const newFavourite: FavouriteItem = {
        ...item,
        added_at: new Date().toISOString(),
      };

      const currentFavourites = user.favourites || [];
      const updatedFavourites = [...currentFavourites, newFavourite];

      return await this.updateUser(userId, { favourites: updatedFavourites });
    } catch (error) {
      console.error('Error adding to favourites:', error);
      return null;
    }
  }

  async removeFromFavourites(userId: string, itemId: string, itemType: 'restaurant' | 'menu_item'): Promise<UserProfile | null> {
    try {
      const user = await this.getUser(userId);
      if (!user) return null;

      const currentFavourites = user.favourites || [];
      const updatedFavourites = currentFavourites.filter(
        item => !(item.id === itemId && item.type === itemType)
      );

      return await this.updateUser(userId, { favourites: updatedFavourites });
    } catch (error) {
      console.error('Error removing from favourites:', error);
      return null;
    }
  }

  async isFavourite(userId: string, itemId: string, itemType: 'restaurant' | 'menu_item'): Promise<boolean> {
    try {
      const user = await this.getUser(userId);
      if (!user || !user.favourites) return false;

      return user.favourites.some(
        item => item.id === itemId && item.type === itemType
      );
    } catch (error) {
      console.error('Error checking favourite status:', error);
      return false;
    }
  }
}

// Export singleton instance
export const userService = new SimpleUserService();