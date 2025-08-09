// src/services/SimpleUserService.ts
import { fetchAuthSession } from 'aws-amplify/auth';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

/**
 * Simple service for unifeast-users DynamoDB table
 * Uses your existing Cognito user pool: YOUR_USER_POOL_ID_HERE
 */

export interface UserProfile {
  user_id: string;
  user_name?: string;
  email?: string;
  user_identity?: string;
  dietary_preferences?: string;
  period_plan?: string;
  milk_allergy?: boolean;
  eggs_allergy?: boolean;
  peanuts_allergy?: boolean;
  tree_nuts_allergy?: boolean;
  shellfish_allergy?: boolean;
  other_allergies?: string[];  // Array of strings based on your table
  session_data?: string;
  created_at?: string;
  updated_at?: string;
}

class SimpleUserService {
  private client: DynamoDBDocumentClient | null = null;
  private readonly tableName = 'unifeast-users';
  private readonly region = 'eu-west-2';

  private async getClient(): Promise<DynamoDBDocumentClient> {
    if (!this.client) {
      try {
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

        this.client = DynamoDBDocumentClient.from(dynamoClient, {
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
    return this.client;
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
        dietary_preferences: '',
        period_plan: '',
        milk_allergy: false,
        eggs_allergy: false,
        peanuts_allergy: false,
        tree_nuts_allergy: false,
        shellfish_allergy: false,
        other_allergies: [],
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
}

// Export singleton instance
export const userService = new SimpleUserService();