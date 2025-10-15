# UniFeast

A React Native application for Imperial College London's food ordering and review system.

## Environment Setup

This project uses environment variables to manage sensitive configuration. Follow these steps to set up your environment:

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure it with your values:

```bash
cp .env.example .env
```

Then edit the `.env` file with your actual configuration values:

#### AWS Amplify Configuration
- `AWS_REGION`: Your AWS region (e.g., eu-west-2)
- `USER_POOL_ID`: Your Cognito User Pool ID
- `USER_POOL_CLIENT_ID`: Your Cognito User Pool Client ID
- `IDENTITY_POOL_ID`: Your Cognito Identity Pool ID

#### Aurora Database Configuration
- `AURORA_RESOURCE_ARN`: Your Aurora cluster resource ARN
- `AURORA_SECRET_ARN`: Your Aurora cluster secret ARN

#### Database Names
- `CROWD_DATABASE_NAME`: Name of the crowd database
- `FOOD_DATABASE_NAME`: Name of the food database

### 3. Running the Application

```bash
# Run on iOS simulator
npm run ios
```

Note: This project does not work with Expo. It uses AWS Amplify for user authentication and the AWS SDK for other services like Aurora database connections.
