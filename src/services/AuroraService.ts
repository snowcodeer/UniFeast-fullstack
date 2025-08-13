// src/services/AuroraService.ts
import { fetchAuthSession } from 'aws-amplify/auth';
import { RDSDataClient, ExecuteStatementCommand, BeginTransactionCommand, CommitTransactionCommand, RollbackTransactionCommand } from '@aws-sdk/client-rds-data';

export interface DatabaseConfig {
  resourceArn: string;
  secretArn: string;
  database: string;
  readonly?: boolean;
}

export interface QueryResult {
  records?: any[][];
  numberOfRecordsUpdated?: number;
  generatedFields?: any[];
  columnMetadata?: any[];
}

import { SqlParameter } from '@aws-sdk/client-rds-data';

export interface QueryOptions {
  parameters?: SqlParameter[];
  includeResultMetadata?: boolean;
  continueAfterTimeout?: boolean;
}

class AuroraService {
  private readonly region = 'eu-west-2';
  private client: RDSDataClient | null = null;

  private async getClient(): Promise<RDSDataClient> {
    if (this.client) {
      return this.client;
    }

    try {
      // Fetch session; Amplify will use cached tokens and refresh only if expired
      const session = await fetchAuthSession();
      
      if (!session.credentials) {
        throw new Error('No credentials available');
      }

      this.client = new RDSDataClient({
        region: this.region,
        credentials: {
          accessKeyId: session.credentials.accessKeyId,
          secretAccessKey: session.credentials.secretAccessKey,
          sessionToken: session.credentials.sessionToken,
        },
      });

      return this.client;
    } catch (error) {
      console.error('Failed to create RDS Data client:', error);
      throw error;
    }
  }

  async executeStatement(
    config: DatabaseConfig,
    sql: string,
    options: QueryOptions = {}
  ): Promise<QueryResult> {
    try {
      const client = await this.getClient();
      
      const command = new ExecuteStatementCommand({
        resourceArn: config.resourceArn,
        secretArn: config.secretArn,
        database: config.database,
        sql,
        parameters: options.parameters,
        includeResultMetadata: options.includeResultMetadata ?? true,
        continueAfterTimeout: options.continueAfterTimeout ?? false,
      });

      const response = await client.send(command);
      
      return {
        records: response.records,
        numberOfRecordsUpdated: response.numberOfRecordsUpdated,
        generatedFields: response.generatedFields,
        columnMetadata: response.columnMetadata,
      };
    } catch (error) {
      console.error('Error executing SQL statement:', error);
      throw error;
    }
  }

  async executeTransaction(
    config: DatabaseConfig,
    statements: Array<{ sql: string; parameters?: QueryOptions['parameters'] }>
  ): Promise<QueryResult[]> {
    if (config.readonly) {
      throw new Error('Cannot execute transactions on readonly database');
    }

    const client = await this.getClient();
    let transactionId: string | undefined;

    try {
      // Begin transaction
      const beginCommand = new BeginTransactionCommand({
        resourceArn: config.resourceArn,
        secretArn: config.secretArn,
        database: config.database,
      });
      
      const beginResponse = await client.send(beginCommand);
      transactionId = beginResponse.transactionId;

      if (!transactionId) {
        throw new Error('Failed to begin transaction');
      }

      // Execute statements
      const results: QueryResult[] = [];
      for (const statement of statements) {
        const command = new ExecuteStatementCommand({
          resourceArn: config.resourceArn,
          secretArn: config.secretArn,
          database: config.database,
          sql: statement.sql,
          parameters: statement.parameters,
          transactionId,
          includeResultMetadata: true,
        });

        const response = await client.send(command);
        results.push({
          records: response.records,
          numberOfRecordsUpdated: response.numberOfRecordsUpdated,
          generatedFields: response.generatedFields,
          columnMetadata: response.columnMetadata,
        });
      }

      // Commit transaction
      const commitCommand = new CommitTransactionCommand({
        resourceArn: config.resourceArn,
        secretArn: config.secretArn,
        transactionId,
      });

      await client.send(commitCommand);
      return results;

    } catch (error) {
      // Rollback transaction on error
      if (transactionId) {
        try {
          const rollbackCommand = new RollbackTransactionCommand({
            resourceArn: config.resourceArn,
            secretArn: config.secretArn,
            transactionId,
          });
          await client.send(rollbackCommand);
        } catch (rollbackError) {
          console.error('Error rolling back transaction:', rollbackError);
        }
      }
      
      console.error('Error executing transaction:', error);
      throw error;
    }
  }

  // Helper method to convert RDS Data API results to more usable format
  convertResultsToObjects(result: QueryResult): any[] {
    if (!result.records || !result.columnMetadata) {
      return [];
    }

    const columns = result.columnMetadata.map(col => col.name);
    
    return result.records.map(record => {
      const obj: any = {};
      record.forEach((field, index) => {
        const columnName = columns[index];
        
        // Extract value based on field type
        if (field.stringValue !== undefined) {
          obj[columnName] = field.stringValue;
        } else if (field.longValue !== undefined) {
          obj[columnName] = field.longValue;
        } else if (field.doubleValue !== undefined) {
          obj[columnName] = field.doubleValue;
        } else if (field.booleanValue !== undefined) {
          obj[columnName] = field.booleanValue;
        } else if (field.isNull) {
          obj[columnName] = null;
        } else {
          obj[columnName] = field;
        }
      });
      
      return obj;
    });
  }

  // Helper method to create query parameters
  createParameter(name: string, value: any): SqlParameter {
    if (value === null || value === undefined) {
      return { name, value: { isNull: true } as any };
    }
    
    if (typeof value === 'string') {
      return { name, value: { stringValue: value } as any };
    }
    
    if (typeof value === 'number') {
      return Number.isInteger(value) 
        ? { name, value: { longValue: value } as any }
        : { name, value: { doubleValue: value } as any };
    }
    
    if (typeof value === 'boolean') {
      return { name, value: { booleanValue: value } as any };
    }
    
    // Default to string for other types
    return { name, value: { stringValue: String(value) } as any };
  }

  async testConnection(config: DatabaseConfig): Promise<boolean> {
    try {
      await this.executeStatement(config, 'SELECT 1 as test');
      return true;
    } catch (error) {
      console.error('Aurora connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const auroraService = new AuroraService();