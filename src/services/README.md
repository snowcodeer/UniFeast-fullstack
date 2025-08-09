# AWS DynamoDB Integration Guide

This guide explains how to connect your Amplify Gen2 app to existing DynamoDB tables using the AWS SDK.

## Overview

The integration provides:
- **AwsConfig**: Handles AWS authentication using Amplify credentials
- **DynamoDBService**: Generic service for DynamoDB operations
- **MenuDataService**: Specific service for restaurant/menu data
- **ExternalDataExample**: React component demonstrating usage

## Setup

### 1. Install Dependencies

The required packages are already installed:
```bash
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb @aws-sdk/credential-providers
```

### 2. AWS Permissions

Ensure your Amplify user pool has the necessary IAM permissions to access your DynamoDB tables. You'll need policies like:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": "arn:aws:dynamodb:your-region:your-account:table/your-table-name"
    }
  ]
}
```

## Basic Usage

### 1. Configure AWS Region

```typescript
import { AwsConfig } from './services/AwsConfig';

// Set your AWS region (default is eu-west-2)
AwsConfig.setRegion('us-east-1');
```

### 2. Use Generic DynamoDB Service

```typescript
import { DynamoDBService } from './services/DynamoDBService';

// Create service for your table
const userDataService = new DynamoDBService('your-table-name');

// Basic operations
const item = await userDataService.getItem({ id: 'user123' });
await userDataService.putItem({ id: 'user123', name: 'John', email: 'john@example.com' });
await userDataService.updateItem({ id: 'user123' }, { name: 'John Doe' });
await userDataService.deleteItem({ id: 'user123' });

// Query and scan
const results = await userDataService.queryItems(
  'userId = :userId',
  {
    expressionAttributeValues: { ':userId': 'user123' }
  }
);

const allItems = await userDataService.scanTable({ limit: 100 });
```

### 3. Use Menu Data Service (Specialized Example)

```typescript
import { MenuDataService } from './services/MenuDataService';

// Create service with table names
const menuService = new MenuDataService('menu-items-table', 'restaurants-table');

// Get restaurant data
const restaurant = await menuService.getRestaurant('restaurant123');
const nearbyRestaurants = await menuService.getRestaurantsByLocation(51.5074, -0.1278, 5); // London, 5km radius

// Get menu data
const menu = await menuService.getMenuByRestaurant('restaurant123');
const veganItems = await menuService.getMenuItemsByDietaryPreference('vegan');
const nutFreeItems = await menuService.getMenuItemsWithoutAllergen('nuts');

// Advanced search
const filteredItems = await menuService.searchMenuItemsAdvanced({
  restaurantId: 'restaurant123',
  dietaryPreferences: ['vegan', 'gluten-free'],
  excludeAllergens: ['nuts', 'dairy'],
  priceRange: { min: 5, max: 20 },
  searchTerm: 'burger'
});
```

## React Component Integration

### 1. Basic Hook Usage

```typescript
import React, { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { DynamoDBService } from './services/DynamoDBService';

const MyComponent = () => {
  const { user } = useAuthenticator();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const service = new DynamoDBService('my-table');
        const result = await service.scanTable({ limit: 20 });
        setData(result.items);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // ... render component
};
```

### 2. Error Handling

```typescript
const handleOperation = async () => {
  try {
    await dynamoService.putItem(newItem);
    // Success handling
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      // Handle conditional check failure
    } else if (error.name === 'ResourceNotFoundException') {
      // Handle table not found
    } else {
      // Handle other errors
    }
  }
};
```

## Advanced Features

### 1. Batch Operations

```typescript
// Batch get multiple items
const keys = [{ id: 'item1' }, { id: 'item2' }, { id: 'item3' }];
const items = await service.batchGetItems(keys);

// Batch write operations
await service.batchWriteItems([
  { type: 'PUT', item: { id: 'new1', name: 'New Item 1' } },
  { type: 'PUT', item: { id: 'new2', name: 'New Item 2' } },
  { type: 'DELETE', key: { id: 'old1' } },
]);
```

### 2. Conditional Updates

```typescript
await service.updateItem(
  { id: 'item123' },
  { status: 'active' },
  {
    condition: 'attribute_exists(id) AND #status = :oldStatus',
    expressionAttributeNames: { '#status': 'status' },
    expressionAttributeValues: { ':oldStatus': 'pending' }
  }
);
```

### 3. Pagination

```typescript
let lastKey = undefined;
let allItems = [];

do {
  const result = await service.scanTable({
    limit: 25,
    lastEvaluatedKey: lastKey
  });
  
  allItems = [...allItems, ...result.items];
  lastKey = result.lastEvaluatedKey;
} while (lastKey);
```

## Testing Connections

```typescript
import { AwsConfig } from './services/AwsConfig';
import { DynamoDBService } from './services/DynamoDBService';

// Test AWS connection
const awsConnected = await AwsConfig.testConnection();

// Test table access
const service = new DynamoDBService('your-table');
const tableAccessible = await service.testConnection();
```

## Common Patterns for UniFeast

### 1. User Profile Integration

```typescript
// Combine Amplify profile with external user data
const externalUserService = new DynamoDBService('external-users');

const getUserData = async (userId: string) => {
  const [amplifyProfile, externalData] = await Promise.all([
    ProfileService.getProfile(userId),
    externalUserService.getItem({ userId })
  ]);
  
  return { ...amplifyProfile, ...externalData };
};
```

### 2. Menu Search with User Preferences

```typescript
const getPersonalizedMenu = async (restaurantId: string, userProfile: any) => {
  return await menuService.searchMenuItemsAdvanced({
    restaurantId,
    dietaryPreferences: userProfile.dietary_preferences?.split(',') || [],
    excludeAllergens: getAllergensFromProfile(userProfile)
  });
};
```

### 3. Location-Based Recommendations

```typescript
const getNearbyMenuItems = async (latitude: number, longitude: number, preferences: any) => {
  const restaurants = await menuService.getRestaurantsByLocation(latitude, longitude);
  
  const allMenuItems = await Promise.all(
    restaurants.map(restaurant => 
      menuService.searchMenuItemsAdvanced({
        restaurantId: restaurant.id,
        dietaryPreferences: preferences.dietary_preferences,
        excludeAllergens: preferences.allergens
      })
    )
  );
  
  return allMenuItems.flat();
};
```

## Security Best Practices

1. **Authentication Required**: All operations require user authentication through Amplify
2. **Least Privilege**: Only grant necessary DynamoDB permissions
3. **Input Validation**: Always validate data before DynamoDB operations
4. **Error Handling**: Never expose internal errors to users
5. **Rate Limiting**: Be mindful of DynamoDB read/write capacity

## Troubleshooting

### Common Issues

1. **"Cannot redefine property: default"**: Ensure you're using Amplify Gen2 CLI (`ampx`) not the old CLI
2. **Access Denied**: Check IAM permissions for your user pool
3. **Table Not Found**: Verify table name and region
4. **Throttling**: Implement exponential backoff for retries

### Debug Tips

```typescript
// Enable debug logging
console.log('AWS Region:', AwsConfig.getRegion());
console.log('User credentials available:', await AwsConfig.testConnection());
console.log('Table accessible:', await service.testConnection());
```

## Integration with Existing Code

This DynamoDB integration works alongside your existing Amplify setup:

- **Amplify Data**: Use for user profiles, authentication-based data
- **External DynamoDB**: Use for shared data, external APIs, legacy systems
- **Both**: Combine data from both sources in your components

The services are designed to be modular and can be easily extended for your specific use cases.