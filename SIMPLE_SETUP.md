# Simple DynamoDB Integration Setup

## ✅ What's Done

Your UniFeast app now integrates with your existing DynamoDB table:
- **Table**: `unifeast-users` 
- **Region**: `eu-west-2`
- **User Pool**: `YOUR_USER_POOL_ID_HERE`
- **Primary Key**: `user_id` (String)
- **Fields**: user_name, email, user_identity, allergies, etc.

## 🔧 Required: IAM Permissions

You need to add DynamoDB permissions to your Cognito Identity Pool. 

### Find Your Identity Pool Role

1. Go to **AWS Console** → **Cognito** → **Identity pools** 
2. Find identity pool: `YOUR_IDENTITY_POOL_ID_HERE`
3. Click **Edit identity pool**
4. Note the **Authenticated role ARN** (should look like `arn:aws:iam::YOUR_AWS_ACCOUNT_ID_HERE :role/Cognito_YourPoolAuth_Role`)

### Add DynamoDB Policy

1. Go to **AWS Console** → **IAM** → **Roles**
2. Find your Cognito authenticated role from step above
3. Click **Add permissions** → **Create inline policy**
4. Paste this policy:

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
        "dynamodb:DeleteItem"
      ],
      "Resource": "arn:aws:dynamodb:eu-west-2:YOUR_AWS_ACCOUNT_ID_HERE :table/unifeast-users"
    }
  ]
}
```

5. Name it `UniFeastDynamoDBAccess` and save

## 🚀 How It Works

Your Profile component now:

1. **Reads**: Tries Amplify first, falls back to DynamoDB table
2. **Creates**: Saves new profiles directly to DynamoDB table  
3. **Updates**: Updates the DynamoDB table

## 📱 Usage

Everything works exactly the same in your app - the Profile tab will now use your external DynamoDB table for data storage.

## 🔍 Simple Service Usage

If you need to access the DynamoDB service directly:

```typescript
import { userService } from './src/services/SimpleUserService';

// Get user
const user = await userService.getUser('user-id');

// Create user  
const newUser = await userService.createUser('user-id', {
  user_name: 'John Doe',
  email: 'john@example.com',
  user_identity: 'student',
  dietary_preferences: 'vegan,gluten-free',
  milk_allergy: true,
  other_allergies: ['shellfish', 'dairy'], // Array format
});

// Update user
await userService.updateUser('user-id', {
  period_plan: 'semester',
  eggs_allergy: false,
  other_allergies: ['nuts'], // Update allergies array
});
```

## 🛠️ Troubleshooting

- **"Access Denied"**: Check IAM permissions are attached to correct role
- **"Table not found"**: Verify table name and region in AWS Console
- **No data showing**: Check user is logged in and permissions are correct

That's it! Your app is now connected to your existing DynamoDB table.